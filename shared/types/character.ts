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
  /** Avantages concrets en jeu, affichés en liste sous la description. */
  benefits?: string[]
}

export type SpellCost = 'cantrip' | 'slot' | 'daily'

export interface Spell {
  title: string
  /** Effet du sort, en une ou deux phrases. */
  description: string
  level: number
  cost: SpellCost
  /** Temps d'incantation (ex. « Action bonus »). */
  castingTime?: string
  /** Portée (ex. « 27 m », « Contact »). */
  range?: string
  /** Durée hors concentration (ex. « 1 heure », « Instantanée »). */
  duration?: string
  /** Le sort demande de la concentration : un seul à la fois. */
  concentration?: boolean
  /** Jet d'attaque ou sauvegarde demandée (ex. « Sauvegarde Dex DD 13 »). */
  check?: string
  /** Dégâts ou soins (ex. « 2d4 perçants », « 1d8 + 2 PV »). */
  effect?: string
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

/** Pièces de monnaie D&D : cuivre, argent, électrum, or, platine. */
export interface Coins {
  cp: number
  sp: number
  ep: number
  gp: number
  pp: number
}

export interface EquipmentItem {
  name: string
  quantity: number
}

/** Contenu de départ du sac d'une fiche livrée avec l'app. */
export interface StartingInventory {
  equipment: EquipmentItem[]
  coins: Coins
  notes?: string
}

/** Version du format de fiche. À incrémenter à chaque évolution du modèle, avec une migration. */
export const CHARACTER_SCHEMA_VERSION = 2

/**
 * Portrait embarqué dans la fiche. Octets bruts plutôt que Blob : clonables partout
 * (IndexedDB, Vitest) et convertibles en base64 pour l'export.
 */
export interface Portrait {
  data: ArrayBuffer
  mime: string
  alt: string
}

/** Champs communs aux fiches stockées et aux fiches de départ. */
interface CharacterFields {
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
  /** Rappel affiché sous les rites de combat (ex. règle de concentration). */
  ritualsNote?: string
  colophon: string
}

export interface Character extends CharacterFields {
  /** Slug pour les fiches intégrées, UUID pour les fiches créées sur l'appareil. */
  id: string
  portrait: Portrait
}

/** Provenance d'une fiche stockée sur l'appareil. */
export type CharacterOrigin = 'builtin' | 'user' | 'import'

/** Fiche telle qu'enregistrée dans IndexedDB. */
export interface StoredCharacter extends Character {
  schemaVersion: number
  origin: CharacterOrigin
  /** Dates ISO 8601. */
  createdAt: string
  updatedAt: string
}

/** Fiche de départ livrée avec l'app (`app/data/characters`), importée au premier lancement. */
export interface CharacterSeed extends CharacterFields {
  slug: string
  portrait: { src: string, alt: string }
  /** Équipement, argent et notes de départ, copiés dans le sac au premier lancement. Absent : sac vide. */
  inventory?: StartingInventory
}
