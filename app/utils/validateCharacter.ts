import type { Character } from '~~/shared/types/character'
import type { MessageKey } from '~/composables/useT'

export interface ValidationError {
  /** Chemin du champ (ex. `abilities.strength.score`, `skills.2.name`). */
  path: string
  message: MessageKey
}

const HIT_DICE = [6, 8, 10, 12]

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

/**
 * Contrôles structurels uniquement : champs obligatoires, nombres valides,
 * noms uniques là où ils servent de clé. Aucune borne de règle D&D (phase 2).
 */
export function validateCharacter(character: Character): ValidationError[] {
  const errors: ValidationError[] = []
  const add = (path: string, message: MessageKey): void => { errors.push({ path, message }) }

  if (!character.firstName.trim()) add('firstName', 'validation.required')
  if (!isInteger(character.level) || character.level < 1) add('level', 'validation.positiveInteger')
  if (!isInteger(character.proficiencyBonus)) add('proficiencyBonus', 'validation.integer')
  if (!isInteger(character.maxHp) || character.maxHp < 1) add('maxHp', 'validation.positiveInteger')
  if (!HIT_DICE.includes(character.hitDice.die)) add('hitDice.die', 'validation.hitDie')
  if (!isInteger(character.hitDice.total) || character.hitDice.total < 1) add('hitDice.total', 'validation.positiveInteger')
  if (character.darkvision !== undefined && (!isInteger(character.darkvision) || character.darkvision < 0)) {
    add('darkvision', 'validation.positiveOrZero')
  }

  for (const [key, ability] of Object.entries(character.abilities)) {
    if (!isInteger(ability.score)) add(`abilities.${key}.score`, 'validation.integer')
    if (!isInteger(ability.modifier)) add(`abilities.${key}.modifier`, 'validation.integer')
    if (!isInteger(ability.saveModifier)) add(`abilities.${key}.saveModifier`, 'validation.integer')
  }

  const skillNames = new Set<string>()
  character.skills.forEach((skill, i) => {
    const name = skill.name.trim().toLowerCase()
    if (!name) add(`skills.${i}.name`, 'validation.required')
    else if (skillNames.has(name)) add(`skills.${i}.name`, 'validation.duplicate')
    skillNames.add(name)
    if (!isInteger(skill.modifier)) add(`skills.${i}.modifier`, 'validation.integer')
  })

  const languageNames = new Set<string>()
  character.languages.forEach((language, i) => {
    const name = language.name.trim().toLowerCase()
    if (!name) add(`languages.${i}.name`, 'validation.required')
    else if (languageNames.has(name)) add(`languages.${i}.name`, 'validation.duplicate')
    languageNames.add(name)
  })

  const requireUniqueNames = (items: { name: string, path: string }[]): void => {
    const seen = new Set<string>()
    for (const { name, path } of items) {
      const key = name.trim().toLowerCase()
      if (!key) add(path, 'validation.required')
      else if (seen.has(key)) add(path, 'validation.duplicate')
      seen.add(key)
    }
  }

  // Noms servant de clé d'affichage : non vides et uniques
  requireUniqueNames(character.features.map((f, i) => ({ name: f.title, path: `features.${i}.title` })))
  character.features.forEach((feature, i) => {
    requireUniqueNames((feature.benefits ?? []).map((b, j) => ({ name: b, path: `features.${i}.benefits.${j}` })))
  })
  requireUniqueNames(character.attacks.map((a, i) => ({ name: a.name, path: `attacks.${i}.name` })))
  requireUniqueNames(character.rituals.map((r, i) => ({ name: r.number, path: `rituals.${i}.number` })))

  const spellcasting = character.spellcasting
  if (spellcasting) {
    if (!isInteger(spellcasting.saveDc)) add('spellcasting.saveDc', 'validation.integer')
    if (spellcasting.attackBonus !== undefined && !isInteger(spellcasting.attackBonus)) add('spellcasting.attackBonus', 'validation.integer')
    const levels = new Set<number>()
    spellcasting.slotLevels.forEach((slot, i) => {
      if (!isInteger(slot.level) || slot.level < 1 || levels.has(slot.level)) add(`spellcasting.slotLevels.${i}.level`, 'validation.slotLevel')
      levels.add(slot.level)
      if (!isInteger(slot.slots) || slot.slots < 0) add(`spellcasting.slotLevels.${i}.slots`, 'validation.positiveOrZero')
    })
    // Les sorts quotidiens utilisés sont suivis par titre : titres uniques
    requireUniqueNames(spellcasting.spells.map((s, i) => ({ name: s.title, path: `spellcasting.spells.${i}.title` })))
    spellcasting.spells.forEach((spell, i) => {
      if (!isInteger(spell.level) || spell.level < 0) add(`spellcasting.spells.${i}.level`, 'validation.positiveOrZero')
    })
  }

  return errors
}

/** Message d'erreur d'un champ, s'il y en a un. */
export function errorFor(errors: ValidationError[], path: string): MessageKey | undefined {
  return errors.find(error => error.path === path)?.message
}
