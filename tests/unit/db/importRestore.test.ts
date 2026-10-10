import { describe, expect, it } from 'vitest'
import { importCharacter } from '~/composables/useCharacterImport'
import { seeds } from '~/data/characters'
import { getCharacter, getInventory, getState, putCharacter, putState, replaceCharacterData } from '~/db/characterRepository'
import { restoreBuiltin } from '~/db/seed'
import { darethBrumeval, fakePortrait } from '../../helpers/characters'

const state = { hpCurrent: 5, hpTemp: 0, inspiration: 0, hitDiceUsed: 0, deathSaves: { successes: 0, failures: 0 }, spellSlotsUsed: [0, 0], dailySpellsUsed: [] }
const inventory = { items: [], coins: { cp: 1, sp: 0, ep: 0, gp: 0, pp: 0 }, notes: '' }
const now = new Date('2026-10-11T12:00:00.000Z')
const never = async (): Promise<never> => { throw new Error('pas de conflit attendu') }

describe('importCharacter', () => {
  it('nouvelle fiche : enregistrée comme importée, avec état et sac', async () => {
    const id = await importCharacter({ character: darethBrumeval, state, inventory }, never, now)
    expect(id).toBe('dareth-brumeval')
    expect(await getCharacter(id!)).toMatchObject({ origin: 'import', createdAt: now.toISOString() })
    expect(await getState(id!)).toMatchObject({ hpCurrent: 5 })
    expect(await getInventory(id!)).toEqual(inventory)
  })

  it('conflit → remplacer : garde provenance et date de création de l\'appareil', async () => {
    await putCharacter({ ...darethBrumeval, createdAt: '2026-01-01T00:00:00.000Z' })
    const id = await importCharacter({ character: { ...darethBrumeval, level: 9, origin: 'import' } }, async () => 'replace', now)
    expect(await getCharacter(id!)).toMatchObject({ level: 9, origin: 'builtin', createdAt: '2026-01-01T00:00:00.000Z' })
  })

  it('conflit → copie : nouvel identifiant et nom marqué « (copie) », original intact', async () => {
    await putCharacter(darethBrumeval)
    const id = await importCharacter({ character: { ...darethBrumeval, level: 9 } }, async () => 'copy', now)
    expect(id).not.toBe('dareth-brumeval')
    expect(await getCharacter(id!)).toMatchObject({ firstName: 'Dareth (copie)', level: 9, origin: 'import' })
    expect((await getCharacter('dareth-brumeval'))?.level).toBe(6)
  })

  it('conflit → annuler : rien n\'est écrit', async () => {
    await putCharacter(darethBrumeval)
    expect(await importCharacter({ character: { ...darethBrumeval, level: 9 } }, async () => 'cancel', now)).toBeNull()
    expect((await getCharacter('dareth-brumeval'))?.level).toBe(6)
  })
})

describe('replaceCharacterData', () => {
  it('efface l\'état et le sac absents du remplacement', async () => {
    await replaceCharacterData(darethBrumeval, state, inventory)
    await replaceCharacterData(darethBrumeval)
    expect(await getState('dareth-brumeval')).toBeUndefined()
    expect(await getInventory('dareth-brumeval')).toBeUndefined()
  })
})

describe('restoreBuiltin', () => {
  it('remet la fiche, le portrait et le sac de départ, efface l\'état de jeu', async () => {
    await putCharacter({ ...darethBrumeval, level: 12, firstName: 'Autre', createdAt: '2026-01-01T00:00:00.000Z' })
    await putState('dareth-brumeval', state)
    const restored = await restoreBuiltin(seeds[0]!, async () => fakePortrait(4), now)
    expect(restored).toMatchObject({ firstName: 'Dareth', level: 6, origin: 'builtin', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: now.toISOString() })
    expect([...new Uint8Array((await getCharacter('dareth-brumeval'))!.portrait.data)]).toEqual([4, 4, 4])
    expect(await getState('dareth-brumeval')).toBeUndefined()
    expect((await getInventory('dareth-brumeval') as { coins: { gp: number } }).coins.gp).toBe(360)
  })

  it('recrée une fiche de départ supprimée', async () => {
    await restoreBuiltin(seeds[2]!, async () => fakePortrait(), now)
    expect(await getCharacter('zanna')).toMatchObject({ firstName: 'Zanna', createdAt: now.toISOString() })
  })
})
