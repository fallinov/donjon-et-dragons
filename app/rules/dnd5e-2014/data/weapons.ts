import type { WeaponCategory, WeaponId } from '~~/shared/types/rules'

export type DamageType = 'bludgeoning' | 'piercing' | 'slashing'

export type WeaponProperty =
  | 'ammunition' | 'finesse' | 'heavy' | 'light' | 'loading' | 'reach'
  | 'special' | 'thrown' | 'two-handed' | 'versatile'

/** Dés de dégâts : `count` dés à `die` faces, ou valeur fixe si `die` vaut 1. */
export interface DamageDice {
  count: number
  die: 1 | 4 | 6 | 8 | 10 | 12
}

export interface WeaponRules {
  category: WeaponCategory
  ranged: boolean
  /** Absent : arme sans dégâts (filet). */
  damage?: DamageDice
  damageType?: DamageType
  /** Dégâts à deux mains d'une arme polyvalente. */
  versatile?: DamageDice
  /** Portée normale / longue en mètres (armes à distance ou de lancer). */
  range?: [number, number]
  properties: WeaponProperty[]
}

const d = (count: number, die: DamageDice['die']): DamageDice => ({ count, die })

/** Armes du Manuel des joueurs 2014 (SRD 5.1). */
export const WEAPONS: Record<WeaponId, WeaponRules> = {
  // Armes courantes de corps à corps
  'club': { category: 'simple', ranged: false, damage: d(1, 4), damageType: 'bludgeoning', properties: ['light'] },
  'dagger': { category: 'simple', ranged: false, damage: d(1, 4), damageType: 'piercing', range: [6, 18], properties: ['finesse', 'light', 'thrown'] },
  'greatclub': { category: 'simple', ranged: false, damage: d(1, 8), damageType: 'bludgeoning', properties: ['two-handed'] },
  'handaxe': { category: 'simple', ranged: false, damage: d(1, 6), damageType: 'slashing', range: [6, 18], properties: ['light', 'thrown'] },
  'javelin': { category: 'simple', ranged: false, damage: d(1, 6), damageType: 'piercing', range: [9, 36], properties: ['thrown'] },
  'light-hammer': { category: 'simple', ranged: false, damage: d(1, 4), damageType: 'bludgeoning', range: [6, 18], properties: ['light', 'thrown'] },
  'mace': { category: 'simple', ranged: false, damage: d(1, 6), damageType: 'bludgeoning', properties: [] },
  'quarterstaff': { category: 'simple', ranged: false, damage: d(1, 6), damageType: 'bludgeoning', versatile: d(1, 8), properties: ['versatile'] },
  'sickle': { category: 'simple', ranged: false, damage: d(1, 4), damageType: 'slashing', properties: ['light'] },
  'spear': { category: 'simple', ranged: false, damage: d(1, 6), damageType: 'piercing', versatile: d(1, 8), range: [6, 18], properties: ['thrown', 'versatile'] },
  // Armes courantes à distance
  'light-crossbow': { category: 'simple', ranged: true, damage: d(1, 8), damageType: 'piercing', range: [24, 96], properties: ['ammunition', 'loading', 'two-handed'] },
  'dart': { category: 'simple', ranged: true, damage: d(1, 4), damageType: 'piercing', range: [6, 18], properties: ['finesse', 'thrown'] },
  'shortbow': { category: 'simple', ranged: true, damage: d(1, 6), damageType: 'piercing', range: [24, 96], properties: ['ammunition', 'two-handed'] },
  'sling': { category: 'simple', ranged: true, damage: d(1, 4), damageType: 'bludgeoning', range: [9, 36], properties: ['ammunition'] },
  // Armes de guerre de corps à corps
  'battleaxe': { category: 'martial', ranged: false, damage: d(1, 8), damageType: 'slashing', versatile: d(1, 10), properties: ['versatile'] },
  'flail': { category: 'martial', ranged: false, damage: d(1, 8), damageType: 'bludgeoning', properties: [] },
  'glaive': { category: 'martial', ranged: false, damage: d(1, 10), damageType: 'slashing', properties: ['heavy', 'reach', 'two-handed'] },
  'greataxe': { category: 'martial', ranged: false, damage: d(1, 12), damageType: 'slashing', properties: ['heavy', 'two-handed'] },
  'greatsword': { category: 'martial', ranged: false, damage: d(2, 6), damageType: 'slashing', properties: ['heavy', 'two-handed'] },
  'halberd': { category: 'martial', ranged: false, damage: d(1, 10), damageType: 'slashing', properties: ['heavy', 'reach', 'two-handed'] },
  'lance': { category: 'martial', ranged: false, damage: d(1, 12), damageType: 'piercing', properties: ['reach', 'special'] },
  'longsword': { category: 'martial', ranged: false, damage: d(1, 8), damageType: 'slashing', versatile: d(1, 10), properties: ['versatile'] },
  'maul': { category: 'martial', ranged: false, damage: d(2, 6), damageType: 'bludgeoning', properties: ['heavy', 'two-handed'] },
  'morningstar': { category: 'martial', ranged: false, damage: d(1, 8), damageType: 'piercing', properties: [] },
  'pike': { category: 'martial', ranged: false, damage: d(1, 10), damageType: 'piercing', properties: ['heavy', 'reach', 'two-handed'] },
  'rapier': { category: 'martial', ranged: false, damage: d(1, 8), damageType: 'piercing', properties: ['finesse'] },
  'scimitar': { category: 'martial', ranged: false, damage: d(1, 6), damageType: 'slashing', properties: ['finesse', 'light'] },
  'shortsword': { category: 'martial', ranged: false, damage: d(1, 6), damageType: 'piercing', properties: ['finesse', 'light'] },
  'trident': { category: 'martial', ranged: false, damage: d(1, 6), damageType: 'piercing', versatile: d(1, 8), range: [6, 18], properties: ['thrown', 'versatile'] },
  'war-pick': { category: 'martial', ranged: false, damage: d(1, 8), damageType: 'piercing', properties: [] },
  'warhammer': { category: 'martial', ranged: false, damage: d(1, 8), damageType: 'bludgeoning', versatile: d(1, 10), properties: ['versatile'] },
  'whip': { category: 'martial', ranged: false, damage: d(1, 4), damageType: 'slashing', properties: ['finesse', 'reach'] },
  // Armes de guerre à distance
  'blowgun': { category: 'martial', ranged: true, damage: d(1, 1), damageType: 'piercing', range: [7.5, 30], properties: ['ammunition', 'loading'] },
  'hand-crossbow': { category: 'martial', ranged: true, damage: d(1, 6), damageType: 'piercing', range: [9, 36], properties: ['ammunition', 'light', 'loading'] },
  'heavy-crossbow': { category: 'martial', ranged: true, damage: d(1, 10), damageType: 'piercing', range: [30, 120], properties: ['ammunition', 'heavy', 'loading', 'two-handed'] },
  'longbow': { category: 'martial', ranged: true, damage: d(1, 8), damageType: 'piercing', range: [45, 180], properties: ['ammunition', 'heavy', 'two-handed'] },
  'net': { category: 'martial', ranged: true, range: [1.5, 4.5], properties: ['special', 'thrown'] },
}

export const WEAPON_IDS = Object.keys(WEAPONS) as WeaponId[]
