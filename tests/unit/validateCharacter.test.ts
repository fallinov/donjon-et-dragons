import { describe, expect, it } from 'vitest'
import type { HitDieSize } from '~~/shared/types/character'
import { errorFor, validateCharacter } from '~/utils/validateCharacter'
import { darethBrumeval } from '../helpers/characters'

const paths = (c: typeof darethBrumeval) => validateCharacter(c).map(e => `${e.path}:${e.message}`)

describe('validateCharacter', () => {
  it('accepte les fiches de départ', () => {
    expect(validateCharacter(darethBrumeval)).toEqual([])
  })

  it('exige un prénom non vide', () => {
    expect(paths({ ...darethBrumeval, firstName: '   ' })).toEqual(['firstName:validation.required'])
  })

  it('refuse les nombres invalides (champ vide = NaN, décimal, négatif)', () => {
    expect(paths({ ...darethBrumeval, level: Number.NaN })).toEqual(['level:validation.positiveInteger'])
    expect(paths({ ...darethBrumeval, maxHp: 0 })).toEqual(['maxHp:validation.positiveInteger'])
    expect(paths({ ...darethBrumeval, proficiencyBonus: 2.5 })).toEqual(['proficiencyBonus:validation.integer'])
    expect(paths({ ...darethBrumeval, hitDice: { die: 8, total: 0 } })).toEqual(['hitDice.total:validation.positiveInteger'])
    expect(paths({ ...darethBrumeval, darkvision: -1 })).toEqual(['darkvision:validation.positiveOrZero'])
  })

  it('accepte une vision nocturne absente', () => {
    expect(validateCharacter({ ...darethBrumeval, darkvision: undefined })).toEqual([])
  })

  it('refuse un dé de vie hors d6, d8, d10, d12', () => {
    expect(paths({ ...darethBrumeval, hitDice: { die: 20 as HitDieSize, total: 6 } })).toEqual(['hitDice.die:validation.hitDie'])
  })

  it('signale une caractéristique non entière', () => {
    const abilities = { ...darethBrumeval.abilities, wisdom: { ...darethBrumeval.abilities.wisdom, modifier: Number.NaN } }
    expect(paths({ ...darethBrumeval, abilities })).toEqual(['abilities.wisdom.modifier:validation.integer'])
  })

  it('signale les compétences et langues vides ou en double (insensible à la casse)', () => {
    const skills = [...darethBrumeval.skills, { name: 'discrétion', ability: 'Dex' as const, modifier: 1, proficient: false }, { name: '', ability: 'Dex' as const, modifier: 0, proficient: false }]
    const languages = [{ name: 'Commun' }, { name: 'commun ' }, { name: '' }]
    const errors = paths({ ...darethBrumeval, skills, languages })
    expect(errors).toContain(`skills.${skills.length - 2}.name:validation.duplicate`)
    expect(errors).toContain(`skills.${skills.length - 1}.name:validation.required`)
    expect(errors).toContain('languages.1.name:validation.duplicate')
    expect(errors).toContain('languages.2.name:validation.required')
  })

  it('errorFor retrouve le message d\'un champ', () => {
    const errors = validateCharacter({ ...darethBrumeval, firstName: '' })
    expect(errorFor(errors, 'firstName')).toBe('validation.required')
    expect(errorFor(errors, 'level')).toBeUndefined()
  })
})
