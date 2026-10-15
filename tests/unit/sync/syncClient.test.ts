import { describe, expect, it } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import type { PublicUser } from '~~/shared/types/account'
import type { StoredCharacter } from '~~/shared/types/character'
import { runSync } from '~/composables/useSync'
import { getCharacter, getState, listCharacters, putCharacter, putState, deleteCharacter } from '~/db/characterRepository'
import { closeCodexDB } from '~/db/schema'
import { getAllRemote, listOutbox, queueOutbox, settleOutbox } from '~/db/syncRepository'
import { toStoredCharacter } from '~/db/seed'
import { darethSeed, zannaSeed } from '../../helpers/characters'
import { createFakeSyncServer } from '../../helpers/fakeSyncServer'

const master: PublicUser = { id: '00000000-0000-4000-8000-000000000001', username: 'mj', role: 'master', mustChangePassword: false }
const myriam: PublicUser = { id: '00000000-0000-4000-8000-000000000002', username: 'myriam', role: 'player', mustChangePassword: false }

/** Portrait commençant comme un vrai JPEG (le serveur vérifie les premiers octets). */
const jpeg = () => ({ data: new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 7, 7, 7]).buffer, mime: 'image/jpeg' })
const seeded = (seed: typeof zannaSeed): StoredCharacter => toStoredCharacter(seed, jpeg(), '2026-10-10T10:00:00.000Z')
const state = (hp: number) => ({ hpCurrent: hp, hpTemp: 0, inspiration: 0, hitDiceUsed: 0, deathSaves: { successes: 0, failures: 0 }, spellSlotsUsed: [], dailySpellsUsed: [] })

/** Chaque appareil a sa propre base IndexedDB ; `use` bascule sur l'appareil indiqué. */
function devices() {
  const bases = new Map<string, IDBFactory>()
  return async (name: string) => {
    await closeCodexDB()
    if (!bases.has(name)) bases.set(name, new IDBFactory())
    globalThis.indexedDB = bases.get(name)!
  }
}

/** Fiches de départ telles que l'app les importe au premier lancement (sans outbox). */
async function seedDevice(...characters: StoredCharacter[]): Promise<void> {
  for (const character of characters) await putCharacter(character)
  for (const entry of await listOutbox()) await settleOutbox(entry)
}

describe('outbox', () => {
  it('chaque écriture de l\'utilisateur est notée, une entrée par fiche et par partie', async () => {
    await putCharacter(seeded(zannaSeed))
    await putState('zanna', state(10))
    await putState('zanna', state(9))
    expect((await listOutbox()).map(e => e.part).sort()).toEqual(['sheet', 'state'])
    await deleteCharacter('zanna')
    expect((await listOutbox()).map(e => e.part)).toEqual(['delete'])
  })

  it('une modification envoyée n\'est retirée que si elle n\'a pas changé entre-temps', async () => {
    await putState('zanna', state(10))
    const [sent] = await listOutbox()
    await new Promise(resolve => setTimeout(resolve, 2))
    await putState('zanna', state(8))
    await settleOutbox(sent!)
    expect(await listOutbox()).toHaveLength(1)
  })
})

describe('synchronisation entre appareils', () => {
  it('premier master : ses fiches partent ; un joueur reçoit tout, ses fiches de départ non modifiées sont remplacées', async () => {
    const server = createFakeSyncServer()
    const use = devices()
    await use('mj')
    await seedDevice(seeded(zannaSeed), seeded(darethSeed))
    expect(await runSync(master, { fetch: server.fetchAs(master) })).toBe('done')
    expect(await listOutbox()).toEqual([])
    expect((await server.store.listSince(0, 100)).map(r => [r.id, r.ownerId]).sort()).toEqual([['dareth-brumeval', master.id], ['zanna', master.id]])

    await use('myriam')
    await seedDevice(seeded(zannaSeed))
    expect(await runSync(myriam, { fetch: server.fetchAs(myriam) })).toBe('done')
    expect((await listCharacters()).map(c => c.id).sort()).toEqual(['dareth-brumeval', 'zanna'])
    expect(await listOutbox()).toEqual([])
    expect(new Uint8Array((await getCharacter('dareth-brumeval'))!.portrait.data)[0]).toBe(0xFF)
    expect((await getAllRemote()).get('zanna')).toMatchObject({ ownerId: master.id })
  })

  it('le propriétaire modifie ses PV, le master les reçoit ; un joueur ne peut pas modifier la fiche d\'un autre', async () => {
    const server = createFakeSyncServer()
    const use = devices()
    await use('mj')
    await seedDevice(seeded(zannaSeed))
    await runSync(master, { fetch: server.fetchAs(master) })
    await server.store.setOwner('zanna', myriam.id)

    await use('myriam')
    await runSync(myriam, { fetch: server.fetchAs(myriam) })
    await putState('zanna', state(4))
    await runSync(myriam, { fetch: server.fetchAs(myriam) })

    await use('mj')
    await runSync(master, { fetch: server.fetchAs(master) })
    // État aligné sur la fiche (emplacements de Zanna complétés) : seuls les PV comptent ici
    expect(await getState('zanna')).toMatchObject({ hpCurrent: 4 })
    expect((await getAllRemote()).get('zanna')).toMatchObject({ ownerId: myriam.id })

    // Myriam ne possède pas Dareth : sa modification est refusée et l'appareil reprend la version du serveur
    await seedDevice(seeded(darethSeed))
    await putCharacter(seeded(darethSeed))
    await runSync(master, { fetch: server.fetchAs(master) })
    await use('myriam')
    await runSync(myriam, { fetch: server.fetchAs(myriam) })
    await putState('dareth-brumeval', state(1))
    expect(await runSync(myriam, { fetch: server.fetchAs(myriam) })).toBe('done')
    expect(await getState('dareth-brumeval')).not.toMatchObject({ hpCurrent: 1 })
    expect(await listOutbox()).toEqual([])
  })

  it('hors ligne : rien n\'est perdu, tout part au retour du réseau ; une modification locale en attente n\'est pas écrasée', async () => {
    const server = createFakeSyncServer()
    const use = devices()
    await use('mj')
    await seedDevice(seeded(zannaSeed))
    await runSync(master, { fetch: server.fetchAs(master) })

    server.offline = true
    await putState('zanna', state(2))
    expect(await runSync(master, { fetch: server.fetchAs(master) })).toBe('offline')
    expect(await listOutbox()).toHaveLength(1)

    // Pendant ce temps, un autre appareil du master change les PV plus tôt dans le temps : le local gagne
    server.offline = false
    expect(await runSync(master, { fetch: server.fetchAs(master) })).toBe('done')
    expect((await server.store.get('zanna'))!.state).toEqual(state(2))
    expect(await getState('zanna')).toMatchObject({ hpCurrent: 2 })
  })

  it('suppression propagée aux autres appareils', async () => {
    const server = createFakeSyncServer()
    const use = devices()
    await use('mj')
    await seedDevice(seeded(zannaSeed))
    await runSync(master, { fetch: server.fetchAs(master) })
    await use('tablette')
    await runSync(master, { fetch: server.fetchAs(master) })
    expect(await getCharacter('zanna')).toBeDefined()

    await use('mj')
    await deleteCharacter('zanna')
    await runSync(master, { fetch: server.fetchAs(master) })
    await use('tablette')
    await runSync(master, { fetch: server.fetchAs(master) })
    expect(await getCharacter('zanna')).toBeUndefined()
  })

  it('première connexion d\'un joueur : sa fiche de départ modifiée ici, qui ne lui appartient pas, devient une copie à lui', async () => {
    const server = createFakeSyncServer()
    const use = devices()
    await use('mj')
    await seedDevice(seeded(zannaSeed))
    await runSync(master, { fetch: server.fetchAs(master) })

    await use('myriam')
    await seedDevice({ ...seeded(zannaSeed), level: 9, updatedAt: '2026-10-12T10:00:00.000Z' })
    await runSync(myriam, { fetch: server.fetchAs(myriam) })
    const characters = await listCharacters()
    const copy = characters.find(c => c.id !== 'zanna')!
    expect(copy).toMatchObject({ firstName: 'Zanna (copie)', level: 9, origin: 'import' })
    expect((await getCharacter('zanna'))!.level).not.toBe(9)
    expect((await server.store.get(copy.id))!.ownerId).toBe(myriam.id)
  })

  it('première connexion : la fiche modifiée ici et attribuée au joueur part vers le serveur', async () => {
    const server = createFakeSyncServer()
    const use = devices()
    await use('mj')
    await seedDevice(seeded(zannaSeed))
    await runSync(master, { fetch: server.fetchAs(master) })
    await server.store.setOwner('zanna', myriam.id)

    await use('myriam')
    await seedDevice({ ...seeded(zannaSeed), level: 9, updatedAt: '2026-10-12T10:00:00.000Z' })
    await runSync(myriam, { fetch: server.fetchAs(myriam) })
    expect((await server.store.get('zanna'))!.sheet).toMatchObject({ character: { level: 9 } })
    expect(await listCharacters()).toHaveLength(1)
  })

  it('un autre compte se connecte sur l\'appareil : les fiches du précédent sont effacées', async () => {
    const server = createFakeSyncServer()
    await seedDevice(seeded(zannaSeed))
    await runSync(master, { fetch: server.fetchAs(master) })
    await putState('zanna', state(3))
    await runSync(myriam, { fetch: server.fetchAs(myriam) })
    expect(await listOutbox()).toEqual([])
    expect((await server.store.get('zanna'))!.state).toBeNull()
  })

  it('première connexion : les PV joués avant les comptes, sur une fiche attribuée au joueur, partent sur le serveur', async () => {
    const server = createFakeSyncServer()
    const use = devices()
    await use('mj')
    await seedDevice(seeded(zannaSeed))
    await runSync(master, { fetch: server.fetchAs(master) })
    await server.store.setOwner('zanna', myriam.id)

    await use('myriam')
    await seedDevice(seeded(zannaSeed))
    await putState('zanna', state(3))
    for (const entry of await listOutbox()) await settleOutbox(entry)
    await runSync(myriam, { fetch: server.fetchAs(myriam) })
    expect((await server.store.get('zanna'))!.state).toMatchObject({ hpCurrent: 3 })
    expect(await getState('zanna')).toMatchObject({ hpCurrent: 3 })
  })

  it('nouvel appareil du master : une fiche de départ supprimée sur le serveur ne revient pas', async () => {
    const server = createFakeSyncServer()
    const use = devices()
    await use('mj')
    await seedDevice(seeded(zannaSeed), seeded(darethSeed))
    await runSync(master, { fetch: server.fetchAs(master) })
    await deleteCharacter('zanna')
    await runSync(master, { fetch: server.fetchAs(master) })

    await use('tablette')
    await seedDevice(seeded(zannaSeed), seeded(darethSeed))
    await runSync(master, { fetch: server.fetchAs(master) })
    expect((await listCharacters()).map(c => c.id)).toEqual(['dareth-brumeval'])
    expect((await server.store.get('zanna'))!.deletedAt).not.toBeNull()
  })

  it('fiche locale en attente pendant une réception : la version du serveur reste à recevoir', async () => {
    const server = createFakeSyncServer()
    const use = devices()
    await use('mj')
    await seedDevice(seeded(zannaSeed))
    await runSync(master, { fetch: server.fetchAs(master) })
    await use('tablette')
    await runSync(master, { fetch: server.fetchAs(master) })
    await use('mj')
    await putCharacter({ ...seeded(zannaSeed), level: 8 })
    await runSync(master, { fetch: server.fetchAs(master) })

    // Sur la tablette, une modification plus ancienne que celle du serveur arrive juste avant la réception
    await use('tablette')
    const old = '2026-10-01T10:00:00.000Z'
    const editDuringSync: typeof fetch = async (input, init) => {
      if (String(input).startsWith('/api/sync?') && !(await listOutbox()).length) {
        await putCharacter({ ...seeded(zannaSeed), level: 3 })
        await queueOutbox([{ id: 'zanna', part: 'sheet', changedAt: old }])
      }
      return server.fetchAs(master)(input, init)
    }
    await runSync(master, { fetch: editDuringSync })
    expect((await getCharacter('zanna'))!.level).toBe(3)
    // Envoi suivant : plus ancien que le serveur (stale), la tablette doit alors recevoir la version du serveur
    await runSync(master, { fetch: server.fetchAs(master) })
    expect((await getCharacter('zanna'))!.level).toBe(8)
  })

  it('synchronisation arrêtée (déconnexion) : plus rien n\'est écrit sur l\'appareil', async () => {
    const server = createFakeSyncServer()
    const use = devices()
    await use('mj')
    await seedDevice(seeded(zannaSeed))
    await runSync(master, { fetch: server.fetchAs(master) })
    await use('tablette')
    let alive = true
    const fetchThenStop: typeof fetch = async (input, init) => {
      const response = await server.fetchAs(master)(input, init)
      alive = false
      return response
    }
    expect(await runSync(master, { fetch: fetchThenStop, alive: () => alive })).toBe('error')
    expect(await listCharacters()).toEqual([])
  })
})
