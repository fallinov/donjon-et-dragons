import { describe, expect, it } from 'vitest'
import type { HitDieSize } from '~~/shared/types/character'
import { errorFor, validateCharacter } from '~/utils/validateCharacter'
import { seeds } from '~/data/characters'
import { useCharacterDraft } from '~/composables/useCharacterDraft'
import { darethBrumeval, storedFromSeed } from '../helpers/characters'

const paths = (c: typeof darethBrumeval) => validateCharacter(c).map(e => `${e.path}:${e.message}`)

describe('validateCharacter', () => {
  it.each(seeds.map(seed => [seed.slug, seed] as const))('accepte la fiche de départ %s, telle quelle et une fois ouverte dans l\'éditeur', (_slug, seed) => {
    const stored = storedFromSeed(seed)
    expect(validateCharacter(stored)).toEqual([])
    const { draft, start } = useCharacterDraft()
    start(stored)
    expect(validateCharacter(draft.value!)).toEqual([])
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

describe('validateCharacter — sections avancées', () => {
  const caster = darethBrumeval.spellcasting!

  it('exige des noms uniques pour les aptitudes, avantages, attaques et rites', () => {
    const features = [{ title: 'Ruse', description: '' }, { title: 'ruse', description: '', benefits: ['A', 'a', ''] }]
    const attacks = [{ ...darethBrumeval.attacks[0]!, name: '' }]
    const rituals = [darethBrumeval.rituals[0]!, { ...darethBrumeval.rituals[1]!, number: darethBrumeval.rituals[0]!.number }]
    const errors = paths({ ...darethBrumeval, features, attacks, rituals })
    expect(errors).toEqual(expect.arrayContaining([
      'features.1.title:validation.duplicate',
      'features.1.benefits.1:validation.duplicate',
      'features.1.benefits.2:validation.required',
      'attacks.0.name:validation.required',
      'rituals.1.number:validation.duplicate',
    ]))
  })

  it('exige un DD entier et un bonus d\'attaque entier s\'il est renseigné', () => {
    expect(paths({ ...darethBrumeval, spellcasting: { ...caster, saveDc: Number.NaN } })).toEqual(['spellcasting.saveDc:validation.integer'])
    expect(paths({ ...darethBrumeval, spellcasting: { ...caster, attackBonus: 1.5 } })).toEqual(['spellcasting.attackBonus:validation.integer'])
    expect(validateCharacter({ ...darethBrumeval, spellcasting: { ...caster, attackBonus: undefined } })).toEqual([])
  })

  it('refuse un niveau d\'emplacement absent, nul ou en double', () => {
    const slotLevels = [{ level: 1, slots: 4 }, { level: 1, slots: 2 }, { level: Number.NaN, slots: 1 }, { level: 3, slots: -1 }]
    expect(paths({ ...darethBrumeval, spellcasting: { ...caster, slotLevels } })).toEqual([
      'spellcasting.slotLevels.1.level:validation.slotLevel',
      'spellcasting.slotLevels.2.level:validation.slotLevel',
      'spellcasting.slotLevels.3.slots:validation.positiveOrZero',
    ])
  })

  it('exige des titres de sorts uniques (suivi des sorts quotidiens par titre)', () => {
    const spells = [...caster.spells, { ...caster.spells[0]!, title: caster.spells[0]!.title.toUpperCase() }]
    expect(paths({ ...darethBrumeval, spellcasting: { ...caster, spells } })).toEqual([`spellcasting.spells.${spells.length - 1}.title:validation.duplicate`])
  })
})
