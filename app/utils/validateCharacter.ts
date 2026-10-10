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

  return errors
}

/** Message d'erreur d'un champ, s'il y en a un. */
export function errorFor(errors: ValidationError[], path: string): MessageKey | undefined {
  return errors.find(error => error.path === path)?.message
}
