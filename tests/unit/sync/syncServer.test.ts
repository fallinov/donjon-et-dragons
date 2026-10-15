// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { ensureSchema } from '~~/server/utils/database'
import {
  BUILTIN_IDS, canWrite, isAcceptedPortrait, isCharacterId, MAX_CLOCK_SKEW_MS, PORTRAIT_MAX_BYTES, readChangedAt, readChanges,
  SHEET_MAX_BYTES, SYNC_MAX_CHANGES, validatePart, validateSheet, type PortraitData,
} from '~~/server/utils/syncRules'
import { createMemorySyncStore, createNeonSyncStore, toSyncRow, type SyncStore } from '~~/server/utils/syncStore'
import { serializeCharacter } from '~/utils/characterFile'
import { createTestSql } from '../../helpers/pgliteSql'
import { darethBrumeval, zanna } from '../../helpers/characters'

const master = { id: '00000000-0000-4000-8000-000000000001', role: 'master' as const }
const myriam = { id: '00000000-0000-4000-8000-000000000002', role: 'player' as const }
const juan = { id: '00000000-0000-4000-8000-000000000003', role: 'player' as const }

/** Fiche avec un portrait d'en-tête JPEG réel (les fiches de test ont un portrait factice de 3 octets). */
const withJpeg = <T extends { portrait: { data: ArrayBuffer, mime: string, alt: string } }>(character: T, mime = 'image/jpeg', bytes = [0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3]): T =>
  ({ ...character, portrait: { ...character.portrait, mime, data: new Uint8Array(bytes).buffer } })
const zannaJpeg = withJpeg(zanna)

const at = (minutes: number) => new Date(Date.UTC(2026, 9, 15, 12, minutes))
const portrait = (hash = 'h1'): PortraitData => ({ hash, mime: 'image/jpeg', base64: 'AAAA' })
const state = (hp: number) => ({ hpCurrent: hp, hpTemp: 0, inspiration: 0, hitDiceUsed: 0, deathSaves: { successes: 0, failures: 0 }, spellSlotsUsed: [], dailySpellsUsed: [] })

describe('règles de synchronisation', () => {
  it('identifiants de fiche : slug ou UUID', () => {
    for (const ok of ['zanna', 'dareth-brumeval', '0b5c5d3e-8f1a-4c2b-9d7e-1a2b3c4d5e6f']) expect(isCharacterId(ok)).toBe(true)
    for (const ko of ['', 'Zanna', '-x', 'a b', 'x'.repeat(65), '../etc', 1]) expect(isCharacterId(ko)).toBe(false)
  })

  it('lecture des modifications : forme et nombre', () => {
    const change = { id: 'zanna', part: 'state', data: state(10), changedAt: at(0).toISOString() }
    expect(readChanges({ changes: [change] })).toEqual([change])
    for (const body of [null, {}, { changes: [] }, { changes: [{ ...change, part: 'portrait' }] }, { changes: [{ ...change, changedAt: 1 }] }, { changes: Array(SYNC_MAX_CHANGES + 1).fill(change) }]) {
      expect(readChanges(body)).toBeNull()
    }
  })

  it('date de modification : illisible refusée, futur lointain ramené à maintenant', () => {
    const now = at(30)
    expect(readChangedAt('pas une date', now)).toBeNull()
    expect(readChangedAt(at(10).toISOString(), now)).toEqual(at(10))
    expect(readChangedAt(new Date(now.getTime() + MAX_CLOCK_SKEW_MS).toISOString(), now)).toEqual(new Date(now.getTime() + MAX_CLOCK_SKEW_MS))
    expect(readChangedAt(at(59).toISOString(), now)).toEqual(now)
  })

  it('droits : le master partout, le joueur sur ses fiches, fiches de départ créées par un master seulement', () => {
    expect(BUILTIN_IDS.has('zanna')).toBe(true)
    expect(canWrite(master, 'zanna', null)).toBe(true)
    expect(canWrite(master, 'zanna', undefined)).toBe(true)
    expect(canWrite(myriam, 'zanna', myriam.id)).toBe(true)
    expect(canWrite(juan, 'zanna', myriam.id)).toBe(false)
    expect(canWrite(myriam, 'zanna', null)).toBe(false)
    expect(canWrite(myriam, 'zanna', undefined)).toBe(false)
    expect(canWrite(myriam, '0b5c5d3e-8f1a-4c2b-9d7e-1a2b3c4d5e6f', undefined)).toBe(true)
    // Slug libre (future fiche de départ) : réservé aux masters
    expect(canWrite(myriam, 'nouveau-heros', undefined)).toBe(false)
    expect(canWrite(master, 'nouveau-heros', undefined)).toBe(true)
  })

  it('fiche reçue : lecture stricte, identifiant vérifié, portrait séparé par son empreinte', () => {
    const file = serializeCharacter(zannaJpeg, { state: state(3) })
    const valid = validateSheet('zanna', file)!
    expect(valid.portrait).toMatchObject({ mime: 'image/jpeg' })
    expect(valid.portrait.hash).toMatch(/^[0-9a-f]{64}$/)
    const character = valid.sheet.character as { portrait: Record<string, unknown>, firstName: string }
    expect(character.firstName).toBe('Zanna')
    expect(character.portrait).toEqual({ alt: zanna.portrait.alt, mime: zanna.portrait.mime })
    expect(valid.sheet).not.toHaveProperty('state')
    expect(JSON.stringify(valid.sheet)).not.toContain(valid.portrait.base64.slice(0, 40))
    expect(validateSheet('dareth-brumeval', file)).toBeNull()
    expect(validateSheet('zanna', { ...file, character: { ...file.character, firstName: '' } })).toBeNull()
    expect(validateSheet('zanna', { format: 'autre' })).toBeNull()
  })

  it('portrait : SVG refusé, contenu différent du type annoncé refusé, PNG et WebP acceptés', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    expect(validateSheet('zanna', serializeCharacter(withJpeg(zanna, 'image/svg+xml', [...Buffer.from(svg)])))).toBeNull()
    expect(validateSheet('zanna', serializeCharacter(withJpeg(zanna, 'image/png')))).toBeNull()
    expect(validateSheet('zanna', serializeCharacter(withJpeg(zanna, 'image/jpeg', [...Buffer.from(svg)])))).toBeNull()
    expect(validateSheet('zanna', serializeCharacter(zanna))).toBeNull()
    const png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0]
    expect(validateSheet('zanna', serializeCharacter(withJpeg(zanna, 'image/png', png)))).not.toBeNull()
    const webp = [...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WEBPVP8 ')]
    expect(validateSheet('zanna', serializeCharacter(withJpeg(zanna, 'image/webp', webp)))).not.toBeNull()
    expect(isAcceptedPortrait('image/jpeg', 'A'.repeat(Math.ceil(PORTRAIT_MAX_BYTES / 3) * 4 + 4))).toBe(false)
  })

  it('fiche trop lourde refusée (plus de 100 Ko sans le portrait)', () => {
    expect(validateSheet('zanna', serializeCharacter({ ...zannaJpeg, colophon: 'x'.repeat(SHEET_MAX_BYTES / 2) }))).not.toBeNull()
    expect(validateSheet('zanna', serializeCharacter({ ...zannaJpeg, colophon: 'x'.repeat(SHEET_MAX_BYTES) }))).toBeNull()
  })

  it('état de jeu et sac reçus : validés, sac nettoyé', () => {
    expect(validatePart('state', state(5))).toEqual(state(5))
    expect(validatePart('state', { hpCurrent: 'x' })).toBeNull()
    // Clés inconnues retirées, nombres et listes bornés
    expect(validatePart('state', { ...state(-1e308), evil: 'x'.repeat(10), deathSaves: { successes: 9, failures: -2 }, spellSlotsUsed: Array(50).fill(1e9), dailySpellsUsed: ['a', 3, 'b'] }))
      .toEqual({ ...state(-1000), deathSaves: { successes: 3, failures: 0 }, spellSlotsUsed: Array(20).fill(100), dailySpellsUsed: ['a', 'b'] })
    expect(validatePart('inventory', { items: Array(2000).fill({ name: 'objet au nom long '.repeat(3), quantity: 1 }), coins: {}, notes: '' })).toBeNull()
    expect(validatePart('inventory', { items: [{ name: 'Corde', quantity: -2 }, { name: '' }], coins: { gp: 3 }, notes: 'n' }))
      .toMatchObject({ items: [{ name: 'Corde', quantity: 1 }], coins: { gp: 3, sp: 0 }, notes: 'n' })
    expect(validatePart('inventory', 'x')).toBeNull()
  })
})

// Mêmes règles de stockage sur la mémoire (dev, e2e) et sur les vraies requêtes SQL (PGlite)
const databases: PGlite[] = []
afterAll(async () => {
  for (const db of databases) await db.close()
})

async function neonStore(): Promise<SyncStore> {
  const { sql, db } = await createTestSql()
  databases.push(db)
  // Comptes réels : la clé étrangère owner_id exige des utilisateurs existants
  await ensureSchema(sql)
  for (const [id, username] of [[master.id, 'mj'], [myriam.id, 'myriam'], [juan.id, 'juan']] as const) {
    await sql.query(`INSERT INTO users (id, username, password_hash, role) VALUES ($1, $2, 'h', 'player')`, [id, username])
  }
  return createNeonSyncStore(sql)
}

describe.each([
  ['mémoire', async () => createMemorySyncStore()],
  ['Postgres (PGlite)', neonStore],
])('stockage des fiches — %s', (_name, makeStore) => {
  it('création, fiche, portrait, lecture par curseur', async () => {
    const store = await makeStore()
    expect(await store.create('zanna', myriam.id)).toBe(true)
    expect(await store.create('zanna', juan.id)).toBe(false)
    expect(await store.writeSheet('zanna', { v: 1 }, portrait(), at(1), myriam.id)).toBe(true)
    expect(await store.getPortrait('zanna')).toEqual(portrait())
    const record = (await store.get('zanna'))!
    expect(record).toMatchObject({ ownerId: myriam.id, sheet: { v: 1 }, sheetAt: at(1), portraitHash: 'h1', deletedAt: null })
    const rows = await store.listSince(0, 100)
    expect(rows.map(r => r.id)).toEqual(['zanna'])
    expect(await store.listSince(rows[0]!.rev, 100)).toEqual([])
    expect(toSyncRow(record)).toMatchObject({ id: 'zanna', sheetAt: at(1).toISOString(), stateAt: null })
  })

  it('la dernière modification gagne, partie par partie', async () => {
    const store = await makeStore()
    await store.create('zanna', myriam.id)
    await store.writeSheet('zanna', { v: 2 }, portrait(), at(10), myriam.id)
    // Fiche modifiée plus tôt sur un autre appareil : périmée ; PV joués entre-temps : acceptés
    expect(await store.writeSheet('zanna', { v: 1 }, portrait('h0'), at(5), master.id)).toBe(false)
    expect(await store.writePart('zanna', 'state', state(20), at(6), myriam.id)).toBe(true)
    expect(await store.writePart('zanna', 'state', state(25), at(4), myriam.id)).toBe(false)
    expect(await store.writePart('zanna', 'inventory', { items: [] }, at(4), myriam.id)).toBe(true)
    const record = (await store.get('zanna'))!
    expect(record).toMatchObject({ sheet: { v: 2 }, portraitHash: 'h1', state: state(20), stateAt: at(6), inventoryAt: at(4) })
    expect(await store.getPortrait('zanna')).toEqual(portrait('h1'))
  })

  it('suppression : parties effacées, modification plus ancienne refusée, fiche plus récente la ramène', async () => {
    const store = await makeStore()
    await store.create('zanna', myriam.id)
    await store.writeSheet('zanna', { v: 1 }, portrait(), at(1), myriam.id)
    await store.writePart('zanna', 'state', state(9), at(2), myriam.id)
    expect(await store.remove('zanna', at(0), master.id)).toBe(false)
    expect(await store.remove('zanna', at(3), master.id)).toBe(true)
    expect(await store.get('zanna')).toMatchObject({ sheet: null, state: null, portraitHash: null, deletedAt: at(3) })
    expect(await store.getPortrait('zanna')).toBeNull()
    expect(await store.writePart('zanna', 'state', state(9), at(4), myriam.id)).toBe(false)
    expect(await store.writeSheet('zanna', { v: 1 }, portrait(), at(2), myriam.id)).toBe(false)
    expect(await store.writeSheet('zanna', { v: 3 }, portrait(), at(5), myriam.id)).toBe(true)
    expect(await store.get('zanna')).toMatchObject({ sheet: { v: 3 }, deletedAt: null })
  })

  it('attribution et compte supprimé : chaque changement fait avancer le curseur', async () => {
    const store = await makeStore()
    await store.create('zanna', myriam.id)
    await store.create('dareth-brumeval', myriam.id)
    const before = Math.max(...(await store.listSince(0, 100)).map(r => r.rev))
    expect(await store.setOwner('zanna', juan.id)).toBe(true)
    expect(await store.setOwner('inconnue', juan.id)).toBe(false)
    await store.releaseOwner(myriam.id)
    const changed = await store.listSince(before, 100)
    expect(changed.map(r => [r.id, r.ownerId])).toEqual([['zanna', juan.id], ['dareth-brumeval', null]])
  })

  it('fiches non supprimées comptées par propriétaire', async () => {
    const store = await makeStore()
    for (const id of ['a', 'b', 'c']) await store.create(id, myriam.id)
    await store.create('d', juan.id)
    await store.remove('c', at(1), myriam.id)
    expect(await store.countOwned(myriam.id)).toBe(2)
    expect(await store.countOwned(juan.id)).toBe(1)
  })

  it('pages dans l\'ordre du curseur', async () => {
    const store = await makeStore()
    for (const id of ['a', 'b', 'c']) await store.create(id, myriam.id)
    const first = await store.listSince(0, 2)
    expect(first.map(r => r.id)).toEqual(['a', 'b'])
    expect((await store.listSince(first[1]!.rev, 2)).map(r => r.id)).toEqual(['c'])
  })
})

describe('fiche complète', () => {
  it('une vraie fiche validée passe dans le stockage et revient identique', async () => {
    const store = createMemorySyncStore()
    const valid = validateSheet('dareth-brumeval', serializeCharacter(withJpeg(darethBrumeval)))!
    await store.create('dareth-brumeval', master.id)
    await store.writeSheet('dareth-brumeval', valid.sheet, valid.portrait, at(1), master.id)
    expect((await store.get('dareth-brumeval'))!.sheet).toEqual(valid.sheet)
  })
})
