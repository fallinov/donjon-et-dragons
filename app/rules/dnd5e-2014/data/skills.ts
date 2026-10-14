import type { AbilityKey } from '~~/shared/types/character'
import type { SkillKey } from '~~/shared/types/rules'

/** Les 18 compétences et leur caractéristique. */
export const SKILLS: Record<SkillKey, AbilityKey> = {
  acrobatics: 'dexterity',
  animalHandling: 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  sleightOfHand: 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
}

export const SKILL_KEYS = Object.keys(SKILLS) as SkillKey[]
