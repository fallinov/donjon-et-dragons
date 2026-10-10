import { describe, expect, it, vi } from 'vitest'
import { CHARACTER_SCHEMA_VERSION } from '~~/shared/types/character'
import { seeds } from '~/data/characters'
import { deleteCharacter, getCharacter, listCharacters } from '~/db/characterRepository'
import { seedBuiltins, toStoredCharacter } from '~/db/seed'
import { fakePortrait } from '../../helpers/characters'

const loader = vi.fn(async () => fakePortrait())
const now = new Date('2026-10-10T10:00:00.000Z')

describe('toStoredCharacter', () => {
  it('reprend le slug comme identifiant et marque la fiche comme intégrée', () => {
    const stored = toStoredCharacter(seeds[0]!, fakePortrait(), now.toISOString())
    expect(stored.id).toBe('dareth-brumeval')
    expect(stored).not.toHaveProperty('slug')
    expect(stored.origin).toBe('builtin')
    expect(stored.schemaVersion).toBe(CHARACTER_SCHEMA_VERSION)
    expect(stored.portrait.alt).toBe(seeds[0]!.portrait.alt)
    expect(stored.createdAt).toBe(stored.updatedAt)
  })

  it('ne partage aucune référence avec la fiche de départ', () => {
    const stored = toStoredCharacter(seeds[0]!, fakePortrait(), now.toISOString())
    stored.skills[0]!.modifier = 99
    expect(seeds[0]!.skills[0]!.modifier).not.toBe(99)
  })
})

describe('seedBuiltins', () => {
  it('importe les 6 fiches dans l\'ordre des seeds', async () => {
    const imported = await seedBuiltins(seeds, loader, now)
    expect(imported).toHaveLength(6)
    expect((await listCharacters()).map(c => c.id)).toEqual(seeds.map(s => s.slug))
    expect(loader).toHaveBeenCalledWith('/img/dareth-brumeval.jpg')
  })

  it('n\'est pas rejoué : une fiche supprimée ne revient pas', async () => {
    await seedBuiltins(seeds, loader, now)
    await deleteCharacter('zanna')
    expect(await seedBuiltins(seeds, loader, now)).toEqual([])
    expect(await getCharacter('zanna')).toBeUndefined()
  })

  it('reprend après un échec sans écraser les fiches déjà importées', async () => {
    const failing = vi.fn(async (src: string) => {
      if (src.includes('zanna')) throw new Error('réseau')
      return fakePortrait(7)
    })
    await expect(seedBuiltins(seeds, failing, now)).rejects.toThrow('réseau')
    expect((await listCharacters()).map(c => c.id)).toEqual(['dareth-brumeval', 'skamos-aurum'])

    const imported = await seedBuiltins(seeds, loader, now)
    expect(imported).toEqual(['zanna', 'maera-vifbois', 'thunon', 'kael-draven'])
    const dareth = await getCharacter('dareth-brumeval')
    expect([...new Uint8Array(dareth!.portrait.data)]).toEqual([7, 7, 7])
  })
})
