export type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'

export interface Ability {
  label: string
  score: number
  modifier: number
  saveModifier: number
  proficient: boolean
}

export interface Skill {
  name: string
  ability: 'For' | 'Dex' | 'Con' | 'Int' | 'Sag' | 'Cha'
  modifier: number
  proficient: boolean
}

export interface Vital {
  label: string
  value: string
  unit?: string
}

export interface Trait {
  title: string
  description: string
}

export interface Attack {
  name: string
  note: string
  attackBonus: string
  damage: string
  damageType: string
}

export interface SpellLevel {
  level: number
  slots: number
  spells: Trait[]
  saveDc: number
  /** Les emplacements se rechargent lors d'un repos court (occultiste) */
  shortRestRefresh?: boolean
}

export type HitDieSize = 6 | 8 | 10 | 12

export interface HitDice {
  die: HitDieSize
  total: number
}

export interface Personality {
  trait: string
  ideal: string
  idealLabel?: string
  bond: string
  flaw: string
}

export interface RitualStep {
  text: string
  emphasis?: string
}

export interface Ritual {
  number: string
  title: string
  steps: RitualStep[]
  formulas: string[]
  footnote?: string
}

export interface Character {
  slug: string
  firstName: string
  lastName?: string
  eyebrow: string
  race: string
  className: string
  level: number
  background: string
  alignment: string
  proficiencyBonus: number
  maxHp: number
  hitDice: HitDice
  portrait: { src: string, alt: string }
  vitals: Vital[]
  abilities: Record<AbilityKey, Ability>
  skills: Skill[]
  features: Trait[]
  personality: Personality
  attacks: Attack[]
  spellcasting?: SpellLevel
  languages: { name: string, rare?: boolean }[]
  rituals: Ritual[]
  colophon: string
}
