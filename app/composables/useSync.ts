import { ref } from 'vue'
import type { PublicUser } from '~~/shared/types/account'
import type { StoredCharacter } from '~~/shared/types/character'
import type { SyncChange, SyncResult, SyncRow } from '~~/shared/types/sync'
import { t } from '~/composables/useT'
import { onChange } from '~/db/changes'
import { getCharacter, getInventory, getState, listCharacters, replaceCharacterData } from '~/db/characterRepository'
import type { OutboxEntry, RemoteInfo, SyncMeta } from '~/db/schema'
import {
  applyRemoteRow, clearLocalData, countOutbox, getAllRemote, getMeta, listOutbox, queueOutbox, removeLocal, setMeta,
  setRemote, settleOutbox,
} from '~/db/syncRepository'
import { arrayBufferToBase64 } from '~/utils/base64'
import { inventoryFromStart, isValidState, parseInventory } from '~/utils/characterParts'
import { parseCharacterFile, serializeCharacter } from '~/utils/characterFile'
import { newId } from '~/utils/newId'
import { getSeed } from '~/data/characters'
import { portraitHash, sheetOf, stableStringify, withPortrait } from '~/utils/syncSheet'

export interface SyncOptions {
  fetch?: typeof fetch
  now?: () => Date
  /** Faux dès que la synchronisation doit s'arrêter (déconnexion, autre compte) : plus aucune écriture. */
  alive?: () => boolean
}

/** `unauthorized` : session expirée ou mot de passe à changer ; `offline` : serveur injoignable. */
export type SyncOutcome = 'done' | 'offline' | 'unauthorized' | 'error'

/** Révisions relues en arrière du curseur : une écriture validée en retard sur le serveur n'est pas manquée. */
const CURSOR_OVERLAP = 50
const BATCH_SIZE = 50
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

class SyncStop extends Error {
  constructor(readonly outcome: Exclude<SyncOutcome, 'done'>) {
    super(outcome)
  }
}

function client(doFetch: typeof fetch) {
  async function call(path: string, init?: RequestInit): Promise<Response> {
    let response: Response
    try {
      response = await doFetch(path, { cache: 'no-store', ...init })
    }
    catch {
      throw new SyncStop('offline')
    }
    if (response.status === 401 || response.status === 403) throw new SyncStop('unauthorized')
    if (!response.ok) throw new SyncStop('error')
    return response
  }
  return {
    async pull(since: number): Promise<{ rows: SyncRow[], cursor: number, more: boolean }> {
      return (await call(`/api/sync?since=${since}`)).json()
    },
    async push(changes: SyncChange[]): Promise<SyncResult[]> {
      const response = await call('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ changes }) })
      return (await response.json() as { results: SyncResult[] }).results
    },
    async portrait(id: string): Promise<ArrayBuffer> {
      return (await call(`/api/portraits/${encodeURIComponent(id)}`)).arrayBuffer()
    },
  }
}

type Api = ReturnType<typeof client>

async function pullFrom(api: Api, since: number): Promise<{ rows: SyncRow[], cursor: number }> {
  const rows: SyncRow[] = []
  let cursor = since
  for (;;) {
    const page = await api.pull(cursor)
    rows.push(...page.rows)
    cursor = Math.max(cursor, page.cursor)
    if (!page.more) return { rows, cursor }
  }
}

/**
 * Fiche reçue complète, ou `unchanged` si l'appareil a déjà cette version. Le portrait local est
 * réutilisé seulement si son empreinte, recalculée, est celle du serveur.
 */
async function incomingCharacter(api: Api, row: SyncRow, remote: RemoteInfo | undefined): Promise<{ character: StoredCharacter | null, unchanged: boolean }> {
  if (!row.sheet || !row.portraitHash) return { character: null, unchanged: false }
  const local = await getCharacter(row.id)
  if (local && remote?.sheetAt === row.sheetAt && remote.portraitHash === row.portraitHash) return { character: null, unchanged: true }
  const localBase64 = local ? arrayBufferToBase64(local.portrait.data) : null
  const reuse = local && localBase64 && await portraitHash(local.portrait.mime, localBase64) === row.portraitHash
  const base64 = reuse ? localBase64! : arrayBufferToBase64(await api.portrait(row.id))
  const parsed = parseCharacterFile(withPortrait(row.sheet, base64))
  if (!parsed.ok) {
    console.warn('Fiche reçue illisible', row.id, parsed.error)
    return { character: null, unchanged: false }
  }
  return { character: parsed.value.character, unchanged: false }
}

async function applyRows(api: Api, rows: SyncRow[], alive: () => boolean): Promise<void> {
  const remote = await getAllRemote()
  // Une même fiche peut revenir plusieurs fois (recouvrement du curseur) : la plus récente seulement
  const latest = new Map<string, SyncRow>()
  for (const row of rows) if ((latest.get(row.id)?.rev ?? -1) < row.rev) latest.set(row.id, row)
  for (const row of latest.values()) {
    if (!row.deletedAt && !row.sheet) continue
    const incoming = row.deletedAt ? { character: null, unchanged: false } : await incomingCharacter(api, row, remote.get(row.id))
    // Déconnexion ou changement de compte pendant la réception : plus rien n'est écrit
    if (!alive()) throw new SyncStop('error')
    await applyRemoteRow({ row, character: incoming.character, sheetUnchanged: incoming.unchanged })
  }
}

/**
 * Première synchronisation d'un compte sur l'appareil, partie par partie (fiche, état de jeu, sac) :
 * une partie modifiée ici part sur le serveur si le compte peut écrire la fiche ; sinon la fiche
 * entière devient une copie à soi, rien n'est perdu. Le reste prend la version du serveur ; une
 * fiche absente du serveur (ou supprimée) et jamais modifiée ici disparaît de l'appareil.
 */
async function mergeLocal(user: PublicUser, rows: SyncRow[], now: Date): Promise<void> {
  const server = new Map(rows.filter(row => row.sheet && !row.deletedAt).map(row => [row.id, row]))
  const changedAt = now.toISOString()
  const queued: OutboxEntry[] = []
  const removed: string[] = []
  const same = (a: unknown, b: unknown) => stableStringify(a) === stableStringify(b)
  for (const character of await listCharacters()) {
    const row = server.get(character.id)
    const localState = await getState(character.id)
    const state = isValidState(localState) ? localState : null
    const inventory = parseInventory(await getInventory(character.id))
    const seed = getSeed(character.id)
    const sheetEdited = character.origin !== 'builtin' || character.updatedAt !== character.createdAt
    // Parties à envoyer : différentes du serveur (ou, sans fiche sur le serveur, différentes du départ)
    const parts: OutboxEntry['part'][] = []
    if (row ? sheetEdited && !same(sheetOf(character), row.sheet) : sheetEdited) parts.push('sheet')
    if (state && (row ? !same(state, row.state) : true)) parts.push('state')
    if (inventory && (row ? !same(inventory, row.inventory) : !same(inventory, inventoryFromStart(seed?.inventory)))) parts.push('inventory')
    const writable = user.role === 'master' || (row ? row.ownerId === user.id : UUID_PATTERN.test(character.id))

    if (row) {
      if (!parts.length) continue
      if (writable) {
        queued.push(...parts.map(part => ({ id: character.id, part, changedAt })))
        continue
      }
    }
    else if (writable && (parts.length || (user.role === 'master' && !rows.some(r => r.id === character.id)))) {
      // Absente du serveur : la fiche part entière (le premier master envoie aussi les fiches de départ ;
      // une fiche supprimée sur le serveur ne revient que si elle a été modifiée ici)
      queued.push({ id: character.id, part: 'sheet', changedAt })
      if (state) queued.push({ id: character.id, part: 'state', changedAt })
      if (inventory) queued.push({ id: character.id, part: 'inventory', changedAt })
      continue
    }
    else if (!parts.length) {
      removed.push(character.id)
      continue
    }
    // Modifiée ici, mais pas modifiable par ce compte : gardée comme copie, rien n'est perdu
    await replaceCharacterData({
      ...character,
      id: newId(),
      firstName: t('import.copyName', { name: character.firstName }),
      origin: 'import',
      createdAt: changedAt,
      updatedAt: changedAt,
    }, state ?? undefined, inventory ?? undefined)
    if (!row) removed.push(character.id)
  }
  await queueOutbox(queued)
  await removeLocal(removed)
}

/** Modification à envoyer, avec ses données relues maintenant ; null si l'objet n'existe plus. */
async function changeFor(entry: OutboxEntry): Promise<SyncChange | null> {
  const base = { id: entry.id, part: entry.part, changedAt: entry.changedAt }
  if (entry.part === 'delete') return base
  if (entry.part === 'sheet') {
    const character = await getCharacter(entry.id)
    return character ? { ...base, data: serializeCharacter(character) } : null
  }
  const data = entry.part === 'state' ? await getState(entry.id) : parseInventory(await getInventory(entry.id))
  return entry.part === 'state' ? (isValidState(data) ? { ...base, data } : null) : (data ? { ...base, data } : null)
}

/** Envoie l'outbox ; renvoie true si une modification a été refusée ou dépassée (relecture complète). */
async function pushOutbox(api: Api, user: PublicUser, alive: () => boolean): Promise<boolean> {
  const entries = await listOutbox()
  const order = { delete: 0, sheet: 1, state: 2, inventory: 3 }
  entries.sort((a, b) => order[a.part] - order[b.part])
  const remote = await getAllRemote()
  let refetch = false
  // Une fiche (portrait compris, jusqu'à 1,5 Mo) par envoi ; le reste par lots
  const batches: OutboxEntry[][] = []
  for (const entry of entries) {
    const last = batches.at(-1)
    if (entry.part !== 'sheet' && last && last[0]!.part !== 'sheet' && last.length < BATCH_SIZE) last.push(entry)
    else batches.push([entry])
  }
  for (const batch of batches) {
    const ready = (await Promise.all(batch.map(async entry => ({ entry, change: await changeFor(entry) }))))
    for (const { entry } of ready.filter(r => !r.change)) await settleOutbox(entry)
    const sendable = ready.filter((r): r is { entry: OutboxEntry, change: SyncChange } => r.change !== null)
    if (!sendable.length) continue
    const results = await api.push(sendable.map(r => r.change))
    if (!alive()) throw new SyncStop('error')
    for (const [index, { entry, change }] of sendable.entries()) {
      const status = results[index]?.status
      await settleOutbox(entry)
      if (status === 'stale' || status === 'forbidden') refetch = true
      if (status === 'invalid' || status === 'notFound') console.warn('Modification refusée par le serveur', entry, status)
      if (status !== 'applied') continue
      const known = remote.get(entry.id) ?? { ownerId: user.id, portraitHash: null, sheetAt: null, stateAt: null, inventoryAt: null }
      if (entry.part === 'delete') continue
      if (entry.part === 'sheet') {
        const portrait = (change.data as ReturnType<typeof serializeCharacter>).character.portrait
        known.sheetAt = entry.changedAt
        known.portraitHash = await portraitHash(portrait.mime, portrait.base64)
      }
      else if (entry.part === 'state') known.stateAt = entry.changedAt
      else known.inventoryAt = entry.changedAt
      remote.set(entry.id, known)
      await setRemote(entry.id, known)
    }
  }
  return refetch
}

/**
 * Une synchronisation complète : fusion à la première connexion du compte sur l'appareil, envoi de
 * l'outbox, puis réception de ce qui a changé sur le serveur depuis le curseur.
 */
export async function runSync(user: PublicUser, options: SyncOptions = {}): Promise<SyncOutcome> {
  const api = client(options.fetch ?? ((input, init) => fetch(input, init)))
  const now = options.now ?? (() => new Date())
  const alive = options.alive ?? (() => true)
  const check = () => {
    if (!alive()) throw new SyncStop('error')
  }
  try {
    let meta = await getMeta('sync')
    if (meta && meta.userId !== user.id) {
      // Données d'un autre compte (connexion sans déconnexion) : elles ne lui appartiennent pas
      await clearLocalData({ keepSession: true })
      meta = undefined
    }
    meta ??= { userId: user.id, cursor: 0, merged: false }
    if (!meta.merged) {
      const { rows } = await pullFrom(api, 0)
      check()
      await mergeLocal(user, rows, now())
      meta = { ...meta, merged: true, cursor: 0 }
      await setMeta('sync', meta)
    }
    check()
    const refetch = await pushOutbox(api, user, alive)
    const { rows, cursor } = await pullFrom(api, refetch ? 0 : Math.max(0, meta.cursor - CURSOR_OVERLAP))
    check()
    await applyRows(api, rows, alive)
    check()
    const next: SyncMeta = { ...meta, cursor: Math.max(meta.cursor, cursor), lastSyncAt: now().toISOString() }
    await setMeta('sync', next)
    return 'done'
  }
  catch (error) {
    if (error instanceof SyncStop) return error.outcome
    console.error('Synchronisation impossible', error)
    return 'error'
  }
}

// État affiché de la synchronisation (indicateur discret)
const status = ref<'idle' | 'syncing' | SyncOutcome>('idle')
const pending = ref(0)

/** Délai entre une modification et son envoi : plusieurs appuis rapides partent ensemble. */
const LOCAL_DELAY_MS = 2000
const INTERVAL_MS = 60_000

let running: Promise<void> | null = null
let again = false
/** Change à chaque arrêt : une synchronisation lancée avant ne peut plus rien écrire. */
let generation = 0
let timer: ReturnType<typeof setTimeout> | null = null
let stopLoop: (() => void) | null = null
let trigger: (() => Promise<void>) | null = null

/** Synchronisation en arrière-plan pour le compte connecté ; renvoie la fonction d'arrêt. */
export function startSync(user: PublicUser, onUnauthorized: () => void): () => void {
  stopLoop?.()
  const mine = generation
  const alive = () => generation === mine
  const run = (): Promise<void> => {
    if (!alive()) return Promise.resolve()
    if (running) {
      again = true
      return running
    }
    status.value = 'syncing'
    running = runSync(user, { alive }).then(async (outcome) => {
      if (!alive()) return
      status.value = outcome === 'done' ? 'idle' : outcome
      pending.value = await countOutbox()
      if (outcome === 'unauthorized') onUnauthorized()
    }).finally(() => {
      running = null
      if (again && alive()) {
        again = false
        void run()
      }
    })
    return running
  }
  const soon = () => {
    void countOutbox().then((n) => { pending.value = n })
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => void run(), LOCAL_DELAY_MS)
  }
  const visible = () => {
    if (document.visibilityState === 'visible') void run()
  }
  const online = () => void run()
  trigger = run
  const stopLocal = onChange('local', soon)
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') void run()
  }, INTERVAL_MS)
  document.addEventListener('visibilitychange', visible)
  window.addEventListener('online', online)
  void run()
  stopLoop = () => {
    generation++
    again = false
    stopLocal()
    clearInterval(interval)
    if (timer) clearTimeout(timer)
    document.removeEventListener('visibilitychange', visible)
    window.removeEventListener('online', online)
    stopLoop = null
    trigger = null
  }
  return stopLoop
}

/** Arrête la synchronisation et attend la fin d'un envoi en cours (avant d'effacer l'appareil). */
export async function stopSync(): Promise<void> {
  stopLoop?.()
  generation++
  await running?.catch(() => undefined)
}

/** Synchronisation immédiate (après une attribution, par exemple) ; attend la fin. */
export async function syncNow(): Promise<void> {
  await trigger?.()
}

export function useSync() {
  return { status, pending }
}
