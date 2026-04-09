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

export type SpellCost = 'cantrip' | 'slot' | 'daily'

export interface Spell {
  title: string
  description: string
  level: number
  cost: SpellCost
}

export interface Attack {
  name: string
  note: string
  attackBonus: string
  damage: string
  damageType: string
}

export interface SpellSlotLevel {
  level: number
  slots: number
}

export interface Spellcasting {
  saveDc: number
  attackBonus?: number
  slotLevels: SpellSlotLevel[]
  spells: Spell[]
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
  player: string
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
  spellcasting?: Spellcasting
  darkvision?: number
  languages: { name: string, rare?: boolean }[]
  rituals: Ritual[]
  colophon: string
}
