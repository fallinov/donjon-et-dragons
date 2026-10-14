import type { AbilityKey } from '~~/shared/types/character'
import type { ArmorCategory, CasterProgression, ClassId, UnarmoredFormula, WeaponCategory, WeaponId } from '~~/shared/types/rules'

export interface ClassRules {
  hitDie: 6 | 8 | 10 | 12
  saves: [AbilityKey, AbilityKey]
  /** Caractéristique d'incantation, absente pour les classes sans sorts (le guerrier et le roublard l'obtiennent par leur sous-classe). */
  spellAbility?: AbilityKey
  progression: CasterProgression
  armor: ArmorCategory[]
  shields: boolean
  weaponCategories: WeaponCategory[]
  weapons: WeaponId[]
  /** Défense sans armure de la classe. */
  unarmored?: Extract<UnarmoredFormula, 'barbarian' | 'monk'>
}

/** Classes du Manuel des joueurs 2014 (SRD 5.1). */
export const CLASSES: Record<ClassId, ClassRules> = {
  barbarian: {
    hitDie: 12, saves: ['strength', 'constitution'], progression: 'none',
    armor: ['light', 'medium'], shields: true, weaponCategories: ['simple', 'martial'], weapons: [],
    unarmored: 'barbarian',
  },
  bard: {
    hitDie: 8, saves: ['dexterity', 'charisma'], spellAbility: 'charisma', progression: 'full',
    armor: ['light'], shields: false, weaponCategories: ['simple'],
    weapons: ['hand-crossbow', 'longsword', 'rapier', 'shortsword'],
  },
  cleric: {
    hitDie: 8, saves: ['wisdom', 'charisma'], spellAbility: 'wisdom', progression: 'full',
    armor: ['light', 'medium'], shields: true, weaponCategories: ['simple'], weapons: [],
  },
  druid: {
    hitDie: 8, saves: ['intelligence', 'wisdom'], spellAbility: 'wisdom', progression: 'full',
    armor: ['light', 'medium'], shields: true, weaponCategories: [],
    weapons: ['club', 'dagger', 'dart', 'javelin', 'mace', 'quarterstaff', 'scimitar', 'sickle', 'sling', 'spear'],
  },
  fighter: {
    hitDie: 10, saves: ['strength', 'constitution'], progression: 'none',
    armor: ['light', 'medium', 'heavy'], shields: true, weaponCategories: ['simple', 'martial'], weapons: [],
  },
  monk: {
    hitDie: 8, saves: ['strength', 'dexterity'], progression: 'none',
    armor: [], shields: false, weaponCategories: ['simple'], weapons: ['shortsword'],
    unarmored: 'monk',
  },
  paladin: {
    hitDie: 10, saves: ['wisdom', 'charisma'], spellAbility: 'charisma', progression: 'half',
    armor: ['light', 'medium', 'heavy'], shields: true, weaponCategories: ['simple', 'martial'], weapons: [],
  },
  ranger: {
    hitDie: 10, saves: ['strength', 'dexterity'], spellAbility: 'wisdom', progression: 'half',
    armor: ['light', 'medium'], shields: true, weaponCategories: ['simple', 'martial'], weapons: [],
  },
  rogue: {
    hitDie: 8, saves: ['dexterity', 'intelligence'], progression: 'none',
    armor: ['light'], shields: false, weaponCategories: ['simple'],
    weapons: ['hand-crossbow', 'longsword', 'rapier', 'shortsword'],
  },
  sorcerer: {
    hitDie: 6, saves: ['constitution', 'charisma'], spellAbility: 'charisma', progression: 'full',
    armor: [], shields: false, weaponCategories: [],
    weapons: ['dagger', 'dart', 'sling', 'quarterstaff', 'light-crossbow'],
  },
  warlock: {
    hitDie: 8, saves: ['wisdom', 'charisma'], spellAbility: 'charisma', progression: 'pact',
    armor: ['light'], shields: false, weaponCategories: ['simple'], weapons: [],
  },
  wizard: {
    hitDie: 6, saves: ['intelligence', 'wisdom'], spellAbility: 'intelligence', progression: 'full',
    armor: [], shields: false, weaponCategories: [],
    weapons: ['dagger', 'dart', 'sling', 'quarterstaff', 'light-crossbow'],
  },
}

export const CLASS_IDS = Object.keys(CLASSES) as ClassId[]

/**
 * Sous-classes lanceuses de sorts (tiers de la progression complète, Intelligence) :
 * Chevalier occulte (guerrier) et Escroc arcanique (roublard).
 */
export const THIRD_CASTER_CLASSES: ClassId[] = ['fighter', 'rogue']
export const THIRD_CASTER_ABILITY: AbilityKey = 'intelligence'
