import type { StoredCharacter } from '~~/shared/types/character'
import type { PublicUser } from '~~/shared/types/account'
import type { SyncRow } from '~~/shared/types/sync'
import { applyExternal } from '~/composables/persistState'
import { emitChange } from '~/db/changes'
import { openCodexDB, outboxKey, type MetaValues, type OutboxEntry, type RemoteInfo } from '~/db/schema'
import { isValidState, normalizeState, parseInventory } from '~/utils/characterParts'

/**
 * Accès de la synchronisation à IndexedDB. Contrairement à `characterRepository`, les écritures
 * de ce module (données reçues du serveur) ne sont pas notées dans l'outbox.
 */

export async function getMeta<K extends keyof MetaValues>(key: K): Promise<MetaValues[K] | undefined> {
  const db = await openCodexDB()
  return await db.get('meta', key) as MetaValues[K] | undefined
}

export async function setMeta<K extends keyof MetaValues>(key: K, value: MetaValues[K]): Promise<void> {
  const db = await openCodexDB()
  await db.put('meta', value, key)
}

export async function deleteMeta(key: keyof MetaValues): Promise<void> {
  const db = await openCodexDB()
  await db.delete('meta', key)
}

/** Compte gardé sur l'appareil (ouverture hors ligne). */
export const getSessionCache = () => getMeta('session')
export async function setSessionCache(user: PublicUser | null): Promise<void> {
  if (user) await setMeta('session', user)
  else await deleteMeta('session')
}

export async function listOutbox(): Promise<OutboxEntry[]> {
  const db = await openCodexDB()
  return db.getAll('outbox')
}

export async function countOutbox(): Promise<number> {
  const db = await openCodexDB()
  return db.count('outbox')
}

/** Retire une modification envoyée, sauf si elle a changé depuis (nouvelle modification à envoyer). */
export async function settleOutbox(entry: OutboxEntry): Promise<void> {
  const db = await openCodexDB()
  const tx = db.transaction('outbox', 'readwrite')
  const key = outboxKey(entry.id, entry.part)
  const current = await tx.store.get(key)
  if (current?.changedAt === entry.changedAt) await tx.store.delete(key)
  await tx.done
}

/** Ajoute une modification à envoyer sans toucher aux données (fusion de la première connexion). */
export async function queueOutbox(entries: OutboxEntry[]): Promise<void> {
  const db = await openCodexDB()
  const tx = db.transaction('outbox', 'readwrite')
  await Promise.all([...entries.map(entry => tx.store.put(entry, outboxKey(entry.id, entry.part))), tx.done])
}

export async function getAllRemote(): Promise<Map<string, RemoteInfo>> {
  const db = await openCodexDB()
  const tx = db.transaction('remote')
  const [keys, values] = await Promise.all([tx.store.getAllKeys(), tx.store.getAll()])
  return new Map(keys.map((key, index) => [key, values[index]!]))
}

export async function setRemote(id: string, info: RemoteInfo): Promise<void> {
  const db = await openCodexDB()
  await db.put('remote', info, id)
  emitChange('remote', [id])
}

/** Retire une fiche de l'appareil sans rien envoyer (fiche absente du serveur, compte changé…). */
export async function removeLocal(ids: string[]): Promise<void> {
  if (!ids.length) return
  const db = await openCodexDB()
  const tx = db.transaction(['characters', 'states', 'inventories', 'remote', 'outbox'], 'readwrite')
  const outbox = tx.objectStore('outbox')
  await Promise.all([
    ...ids.flatMap(id => [
      tx.objectStore('characters').delete(id),
      tx.objectStore('states').delete(id),
      tx.objectStore('inventories').delete(id),
      tx.objectStore('remote').delete(id),
      ...(['sheet', 'state', 'inventory', 'delete'] as const).map(part => outbox.delete(outboxKey(id, part))),
    ]),
    tx.done,
  ])
  emitChange('remote', ids)
}

/**
 * Efface toutes les fiches et la synchronisation de l'appareil (déconnexion, autre compte).
 * `keepSession` : garde le compte connecté (données d'un autre compte trouvées à la synchronisation).
 */
export async function clearLocalData({ keepSession = false } = {}): Promise<void> {
  const db = await openCodexDB()
  const stores = ['characters', 'states', 'inventories', 'outbox', 'remote'] as const
  const tx = db.transaction([...stores, 'meta'], 'readwrite')
  await Promise.all([
    ...stores.map(store => tx.objectStore(store).clear()),
    tx.objectStore('meta').delete('sync'),
    ...(keepSession ? [] : [tx.objectStore('meta').delete('session')]),
    tx.done,
  ])
  emitChange('remote', [])
}

/** Fiche reçue du serveur, déjà lue strictement (fiche complète, portrait compris). */
export interface IncomingRow {
  row: SyncRow
  /** Fiche à écrire ; null : partie fiche inchangée (`sheetUnchanged`) ou illisible. */
  character: StoredCharacter | null
  /** La fiche locale est déjà celle du serveur (rien à écrire). */
  sheetUnchanged?: boolean
}

/**
 * Applique une fiche reçue du serveur, partie par partie : une partie qui a une modification
 * locale en attente (outbox) n'est pas touchée, elle partira au prochain envoi et le serveur
 * départagera. Met à jour l'affichage des PV et du sac s'ils sont à l'écran.
 */
export async function applyRemoteRow({ row, character, sheetUnchanged = false }: IncomingRow): Promise<void> {
  const db = await openCodexDB()
  const tx = db.transaction(['characters', 'states', 'inventories', 'remote', 'outbox'], 'readwrite')
  const outbox = tx.objectStore('outbox')
  const hasPending = async (part: OutboxEntry['part']) => Boolean(await outbox.getKey(outboxKey(row.id, part)))

  if (row.deletedAt) {
    // Fiche supprimée ailleurs ; une fiche renvoyée ici depuis (en attente) la fera revenir sur le serveur
    if (!(await hasPending('sheet'))) {
      await Promise.all([
        tx.objectStore('characters').delete(row.id),
        tx.objectStore('states').delete(row.id),
        tx.objectStore('inventories').delete(row.id),
        tx.objectStore('remote').delete(row.id),
        outbox.delete(outboxKey(row.id, 'state')),
        outbox.delete(outboxKey(row.id, 'inventory')),
      ])
    }
    await tx.done
    emitChange('remote', [row.id])
    return
  }

  const pendingDelete = await hasPending('delete')
  const pendingSheet = await hasPending('sheet')
  // Version du serveur notée seulement si l'appareil l'a vraiment (sinon elle serait crue reçue)
  const sheetApplied = !pendingDelete && !pendingSheet && (character !== null || sheetUnchanged)
  let shownState: unknown
  let shownInventory: unknown
  if (!pendingDelete) {
    if (character && !pendingSheet) await tx.objectStore('characters').put(character)
    const sheet = character ?? await tx.objectStore('characters').get(row.id)
    // Partie absente du serveur : la valeur locale (refusée ou jamais envoyée) est retirée
    if (!(await hasPending('state'))) {
      if (sheet && isValidState(row.state)) {
        shownState = normalizeState(sheet, row.state)
        await tx.objectStore('states').put(shownState as never, row.id)
      }
      else if (row.state === null) await tx.objectStore('states').delete(row.id)
    }
    if (!(await hasPending('inventory'))) {
      const inventory = parseInventory(row.inventory)
      if (inventory) {
        shownInventory = inventory
        await tx.objectStore('inventories').put(inventory, row.id)
      }
      else if (row.inventory === null) await tx.objectStore('inventories').delete(row.id)
    }
  }
  const known = await tx.objectStore('remote').get(row.id)
  await tx.objectStore('remote').put({
    ownerId: row.ownerId,
    portraitHash: sheetApplied ? row.portraitHash : known?.portraitHash ?? null,
    sheetAt: sheetApplied ? row.sheetAt : known?.sheetAt ?? null,
    stateAt: row.stateAt,
    inventoryAt: row.inventoryAt,
  }, row.id)
  await tx.done
  if (shownState !== undefined) applyExternal(`character-state:${row.id}`, shownState)
  if (shownInventory !== undefined) applyExternal(`inventory:${row.id}`, shownInventory)
  emitChange('remote', [row.id])
}
