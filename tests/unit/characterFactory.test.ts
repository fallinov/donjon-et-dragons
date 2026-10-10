import { describe, expect, it } from 'vitest'
import { CHARACTER_SCHEMA_VERSION } from '~~/shared/types/character'
import { createBlankCharacter, toStoredFromDraft } from '~/utils/characterFactory'
import { validateCharacter } from '~/utils/validateCharacter'
import { findVital } from '~/utils/vitals'
import { darethBrumeval, fakePortrait } from '../helpers/characters'

describe('createBlankCharacter', () => {
  const blank = createBlankCharacter('id-1', fakePortrait())

  it('reprend les valeurs neutres validées pour le niveau 1', () => {
    expect(blank).toMatchObject({ id: 'id-1', level: 1, proficiencyBonus: 2, maxHp: 8, hitDice: { die: 8, total: 1 } })
    expect(blank.spellcasting).toBeUndefined()
    for (const ability of Object.values(blank.abilities)) {
      expect(ability).toMatchObject({ score: 10, modifier: 0, saveModifier: 0, proficient: false })
    }
    expect(blank.abilities.wisdom.label).toBe('Sagesse')
  })

  it('liste les 18 compétences de D&D 5e, sans doublon, à 0', () => {
    expect(blank.skills).toHaveLength(18)
    expect(new Set(blank.skills.map(s => s.name)).size).toBe(18)
    expect(blank.skills.every(s => s.modifier === 0 && !s.proficient)).toBe(true)
    expect(blank.skills.find(s => s.name === 'Perspicacité')?.ability).toBe('Sag')
  })

  it('prépare CA, initiative et vitesse avec les libellés lus par l\'en-tête', () => {
    expect(findVital(blank, 'armorClass')?.value).toBe('10')
    expect(findVital(blank, 'initiative')?.value).toBe('+0')
    expect(findVital(blank, 'speed')).toMatchObject({ value: '9', unit: 'm' })
  })

  it('n\'est valide qu\'une fois le prénom saisi', () => {
    expect(validateCharacter(blank).map(e => e.path)).toEqual(['firstName'])
    expect(validateCharacter({ ...blank, firstName: 'Ilda' })).toEqual([])
  })
})

describe('toStoredFromDraft', () => {
  const now = new Date('2026-10-11T08:00:00.000Z')

  it('crée une fiche « user » datée pour une nouvelle fiche', () => {
    const stored = toStoredFromDraft({ ...createBlankCharacter('id-2', fakePortrait()), firstName: 'Ilda' }, undefined, now)
    expect(stored).toMatchObject({
      id: 'id-2', origin: 'user', schemaVersion: CHARACTER_SCHEMA_VERSION,
      createdAt: now.toISOString(), updatedAt: now.toISOString(),
    })
  })

  it('conserve provenance, identifiant et date de création d\'une fiche existante', () => {
    const stored = toStoredFromDraft({ ...darethBrumeval, level: 7 }, darethBrumeval, now)
    expect(stored).toMatchObject({ id: 'dareth-brumeval', origin: 'builtin', createdAt: darethBrumeval.createdAt, level: 7 })
    expect(stored.updatedAt).toBe(now.toISOString())
  })
})
