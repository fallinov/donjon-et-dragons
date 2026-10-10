import { beforeEach, describe, expect, it } from 'vitest'
import { CHARACTER_SCHEMA_VERSION } from '~~/shared/types/character'
import { getCharacter, getInventory, getState, putInventory } from '~/db/characterRepository'
import { migrateLegacyStorage } from '~/db/legacy'
import { openCodexDB } from '~/db/schema'
import { darethBrumeval, darethSeed, zanna } from '../../helpers/characters'

const legacyState = {
  hpCurrent: 12, hpTemp: 0, inspiration: 1, hitDiceUsed: 2,
  deathSaves: { successes: 0, failures: 0 }, spellSlotsUsed: [1, 0], dailySpellsUsed: [],
}
const legacyInventory = { items: [{ id: 'a', name: 'Lanterne sourde', quantity: 1 }], coins: { cp: 0, sp: 0, ep: 0, gp: 400, pp: 0 }, notes: 'Phandaline' }

/** Fiche telle qu'enregistrée par la v0.11.0 : format v1, sac de départ dans la fiche. */
async function putV1(character: typeof darethBrumeval, inventory: typeof darethSeed.inventory | null = darethSeed.inventory): Promise<void> {
  const db = await openCodexDB()
  await db.put('characters', { ...character, schemaVersion: 1, ...(inventory ? { inventory } : {}) } as never)
}

describe('migrateLegacyStorage', () => {
  beforeEach(() => localStorage.clear())

  it('reprend état et sac du localStorage puis efface les clés', async () => {
    await putV1(darethBrumeval)
    localStorage.setItem('codex:dareth-brumeval:state', JSON.stringify(legacyState))
    localStorage.setItem('codex:dareth-brumeval:inventory', JSON.stringify(legacyInventory))

    const report = await migrateLegacyStorage()

    expect(report.states).toEqual(['dareth-brumeval'])
    expect(await getState('dareth-brumeval')).toMatchObject({ hpCurrent: 12, inspiration: 1 })
    expect(await getInventory('dareth-brumeval')).toEqual(legacyInventory)
    expect(localStorage.getItem('codex:dareth-brumeval:state')).toBeNull()
    expect(localStorage.getItem('codex:dareth-brumeval:inventory')).toBeNull()
  })

  it('reprend le sac de départ d\'une fiche v1 jamais ouverte et réécrit la fiche en v2', async () => {
    await putV1(darethBrumeval)

    const report = await migrateLegacyStorage()

    expect(report.upgraded).toEqual(['dareth-brumeval'])
    const inventory = await getInventory('dareth-brumeval') as { coins: { gp: number } }
    expect(inventory.coins.gp).toBe(360)
    const db = await openCodexDB()
    const raw = await db.get('characters', 'dareth-brumeval') as unknown as Record<string, unknown>
    expect(raw.schemaVersion).toBe(CHARACTER_SCHEMA_VERSION)
    expect(raw).not.toHaveProperty('inventory')
    expect((await getCharacter('dareth-brumeval'))?.firstName).toBe('Dareth')
  })

  it('n\'écrase pas un sac déjà enregistré par le sac de départ', async () => {
    await putV1(darethBrumeval)
    await putInventory('dareth-brumeval', legacyInventory)
    await migrateLegacyStorage()
    expect(await getInventory('dareth-brumeval')).toEqual(legacyInventory)
  })

  it('ignore et efface une sauvegarde localStorage abîmée', async () => {
    await putV1(zanna, null)
    localStorage.setItem('codex:zanna:state', '{pas du json')
    localStorage.setItem('codex:zanna:inventory', JSON.stringify({ items: 'non' }))

    const report = await migrateLegacyStorage()

    expect(report.states).toEqual([])
    expect(report.inventories).toEqual([])
    expect(await getState('zanna')).toBeUndefined()
    expect(localStorage.getItem('codex:zanna:state')).toBeNull()
  })

  it('ne fait rien sans ancienne donnée', async () => {
    const db = await openCodexDB()
    await db.put('characters', darethBrumeval)
    expect(await migrateLegacyStorage()).toEqual({ states: [], inventories: [], upgraded: [] })
  })

  it('aligne un état repris sur les emplacements actuels de la fiche', async () => {
    await putV1(darethBrumeval)
    localStorage.setItem('codex:dareth-brumeval:state', JSON.stringify({ ...legacyState, spellSlotsUsed: [9] }))
    await migrateLegacyStorage()
    expect((await getState('dareth-brumeval') as { spellSlotsUsed: number[] }).spellSlotsUsed).toEqual([4, 0])
  })
})
