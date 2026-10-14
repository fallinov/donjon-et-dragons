import type { AbilityKey, SpellSlotLevel } from '~~/shared/types/character'
import type { ArmorId, ClassId, RaceId, UnarmoredFormula, WeaponId } from '~~/shared/types/rules'
import { ARMORS, DEX_CAP, SHIELD_BONUS } from './data/armors'
import { CLASSES, THIRD_CASTER_ABILITY, THIRD_CASTER_CLASSES } from './data/classes'
import { RACES } from './data/races'
import { FULL_CASTER_SLOTS, PACT_SLOTS } from './data/slots'
import { WEAPONS, type DamageDice, type DamageType } from './data/weapons'

export const MIN_LEVEL = 1
export const MAX_LEVEL = 20

/** Ramène un niveau saisi dans les bornes des tables (1 à 20). */
export function clampLevel(level: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(level)))
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/** Bonus de maîtrise : +2 aux niveaux 1-4, puis +1 tous les 4 niveaux. */
export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((clampLevel(level) - 1) / 4)
}

export function savingThrow(abilityMod: number, pb: number, proficient: boolean, adjust = 0): number {
  return abilityMod + (proficient ? pb : 0) + adjust
}

/** Touche-à-tout du barde (niveau 2) : la moitié du bonus de maîtrise aux tests sans maîtrise. */
export function hasJackOfAllTrades(classId: ClassId, level: number): boolean {
  return classId === 'bard' && clampLevel(level) >= 2
}

export interface SkillInput {
  abilityMod: number
  pb: number
  proficient: boolean
  /** Expertise : double le bonus de maîtrise (suppose la maîtrise). */
  expertise: boolean
  jackOfAllTrades: boolean
  adjust?: number
}

export function skillBonus({ abilityMod, pb, proficient, expertise, jackOfAllTrades, adjust = 0 }: SkillInput): number {
  const proficiency = expertise ? pb * 2 : proficient ? pb : jackOfAllTrades ? Math.floor(pb / 2) : 0
  return abilityMod + proficiency + adjust
}

/** Valeur passive (Perception, Investigation…) : 10 + bonus du test. */
export function passiveScore(checkBonus: number): number {
  return 10 + checkBonus
}

/** Initiative : test de Dextérité (Touche-à-tout s'y applique). */
export function initiative(dexMod: number, pb: number, jackOfAllTrades: boolean, adjust = 0): number {
  return dexMod + (jackOfAllTrades ? Math.floor(pb / 2) : 0) + adjust
}

export interface ArmorClassInput {
  armorId: ArmorId | null
  shield: boolean
  unarmored: UnarmoredFormula
  mods: Pick<Record<AbilityKey, number>, 'dexterity' | 'constitution' | 'wisdom'>
  adjust?: number
}

/**
 * Classe d'armure. Avec une armure : base + Dex (plafonné à +2 en intermédiaire, ignoré en lourde, même négatif).
 * Sans armure : la formule choisie. La défense sans armure du moine ne fonctionne pas avec un bouclier.
 */
export function armorClass({ armorId, shield, unarmored, mods, adjust = 0 }: ArmorClassInput): number {
  const shieldBonus = shield ? SHIELD_BONUS : 0
  if (armorId) {
    const armor = ARMORS[armorId]
    const dex = armor.category === 'heavy' ? 0 : Math.min(mods.dexterity, DEX_CAP[armor.category])
    return armor.base + dex + shieldBonus + adjust
  }
  switch (unarmored) {
    case 'barbarian':
      return 10 + mods.dexterity + mods.constitution + shieldBonus + adjust
    case 'monk':
      return shield
        ? 10 + mods.dexterity + shieldBonus + adjust
        : 10 + mods.dexterity + mods.wisdom + adjust
    case 'draconic':
      return 13 + mods.dexterity + shieldBonus + adjust
    default:
      return 10 + mods.dexterity + shieldBonus + adjust
  }
}

/** Caractéristique d'incantation, ou undefined si la classe (et sa sous-classe) ne lance pas de sorts. */
export function spellcastingAbility(classId: ClassId, thirdCaster = false): AbilityKey | undefined {
  const rules = CLASSES[classId]
  if (rules.spellAbility) return rules.spellAbility
  return thirdCaster && THIRD_CASTER_CLASSES.includes(classId) ? THIRD_CASTER_ABILITY : undefined
}

export function spellSaveDc(pb: number, abilityMod: number, adjust = 0): number {
  return 8 + pb + abilityMod + adjust
}

export function spellAttackBonus(pb: number, abilityMod: number, adjust = 0): number {
  return pb + abilityMod + adjust
}

function fromFullTable(casterLevel: number): SpellSlotLevel[] {
  return (FULL_CASTER_SLOTS[casterLevel - 1] ?? []).map((slots, i) => ({ level: i + 1, slots }))
}

/**
 * Emplacements de sorts d'une classe unique. Les demi-lanceurs commencent au niveau 2,
 * les tiers-lanceurs (sous-classe lanceuse de sorts) au niveau 3.
 */
export function spellSlots(classId: ClassId, level: number, thirdCaster = false): SpellSlotLevel[] {
  const lvl = clampLevel(level)
  switch (CLASSES[classId].progression) {
    case 'full':
      return fromFullTable(lvl)
    case 'half':
      return lvl < 2 ? [] : fromFullTable(Math.ceil(lvl / 2))
    case 'pact': {
      const pact = PACT_SLOTS[lvl - 1]!
      return [{ level: pact.level, slots: pact.slots }]
    }
    default:
      return thirdCaster && THIRD_CASTER_CLASSES.includes(classId) && lvl >= 3
        ? fromFullTable(Math.ceil(lvl / 3))
        : []
  }
}

/** La magie de pacte récupère ses emplacements au repos court. */
export function slotsRefreshOnShortRest(classId: ClassId): boolean {
  return CLASSES[classId].progression === 'pact'
}

export function hitDice(classId: ClassId, level: number): { die: 6 | 8 | 10 | 12, total: number } {
  return { die: CLASSES[classId].hitDie, total: clampLevel(level) }
}

/**
 * PV max à la moyenne : maximum du dé au niveau 1, puis moyenne arrondie au-dessus (dé / 2 + 1)
 * à chaque niveau suivant, plus le modificateur de Constitution et le bonus racial à chaque niveau.
 */
export function averageMaxHp(classId: ClassId, level: number, conMod: number, raceId: RaceId | null = null): number {
  const lvl = clampLevel(level)
  const die = CLASSES[classId].hitDie
  const perLevel = (raceId ? RACES[raceId].hpPerLevel : 0) + conMod
  return die + (lvl - 1) * (die / 2 + 1) + lvl * perLevel
}

export function isWeaponProficient(weaponId: WeaponId, classId: ClassId, raceId: RaceId | null = null): boolean {
  const cls = CLASSES[classId]
  return cls.weaponCategories.includes(WEAPONS[weaponId].category)
    || cls.weapons.includes(weaponId)
    || (raceId !== null && RACES[raceId].weapons.includes(weaponId))
}

/** Armes de moine : épée courte et armes courantes de corps à corps sans les propriétés lourde ou à deux mains. */
export function isMonkWeapon(weaponId: WeaponId): boolean {
  const weapon = WEAPONS[weaponId]
  if (weaponId === 'shortsword') return true
  return weapon.category === 'simple' && !weapon.ranged
    && !weapon.properties.includes('heavy') && !weapon.properties.includes('two-handed')
}

export interface WeaponAttackInput {
  weaponId: WeaponId
  classId: ClassId
  level: number
  mods: Pick<Record<AbilityKey, number>, 'strength' | 'dexterity'>
  pb: number
  proficient: boolean
  attackAdjust?: number
  damageAdjust?: number
}

export interface WeaponAttackResult {
  attackBonus: number
  /** Absent pour une arme sans dégâts (filet). */
  damage?: DamageDice & { bonus: number }
  versatile?: DamageDice & { bonus: number }
  damageType?: DamageType
  ability: Extract<AbilityKey, 'strength' | 'dexterity'>
}

/**
 * Jet d'attaque et dégâts d'une arme. Finesse (ou arme de moine pour un moine) : la meilleure
 * de Force et Dextérité ; arme à distance : Dextérité ; sinon Force (y compris les armes de lancer).
 */
export function weaponAttack(input: WeaponAttackInput): WeaponAttackResult {
  const { weaponId, classId, mods, pb, proficient, attackAdjust = 0, damageAdjust = 0 } = input
  const weapon = WEAPONS[weaponId]
  const best = mods.dexterity >= mods.strength ? 'dexterity' : 'strength'
  const martialArts = classId === 'monk' && isMonkWeapon(weaponId)
  const ability = weapon.properties.includes('finesse') || martialArts
    ? best
    : weapon.ranged ? 'dexterity' : 'strength'
  const mod = mods[ability]
  const withBonus = (dice?: DamageDice) => dice && { ...dice, bonus: mod + damageAdjust }
  return {
    attackBonus: mod + (proficient ? pb : 0) + attackAdjust,
    damage: withBonus(weapon.damage),
    versatile: withBonus(weapon.versatile),
    damageType: weapon.damageType,
    ability,
  }
}
