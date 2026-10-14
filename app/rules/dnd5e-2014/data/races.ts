import type { ArmorCategory, RaceId, WeaponId } from '~~/shared/types/rules'

export interface RaceRules {
  /** Vitesse au sol en mètres (1,5 m par case). */
  speed: number
  /** Vision dans le noir en mètres, 0 si aucune. */
  darkvision: number
  size: 'small' | 'medium'
  weapons: WeaponId[]
  armor: ArmorCategory[]
  /** PV supplémentaires par niveau (Ténacité naine du nain des collines). */
  hpPerLevel: number
}

const DWARF_WEAPONS: WeaponId[] = ['battleaxe', 'handaxe', 'light-hammer', 'warhammer']
const ELF_WEAPONS: WeaponId[] = ['longsword', 'shortsword', 'shortbow', 'longbow']

const base = { darkvision: 0, size: 'medium', weapons: [], armor: [], hpPerLevel: 0 } as const

/** Races et sous-races du Manuel des joueurs 2014 (SRD 5.1 et PHB). */
export const RACES: Record<RaceId, RaceRules> = {
  'hill-dwarf': { ...base, speed: 7.5, darkvision: 18, weapons: DWARF_WEAPONS, hpPerLevel: 1 },
  'mountain-dwarf': { ...base, speed: 7.5, darkvision: 18, weapons: DWARF_WEAPONS, armor: ['light', 'medium'] },
  'high-elf': { ...base, speed: 9, darkvision: 18, weapons: ELF_WEAPONS },
  'wood-elf': { ...base, speed: 10.5, darkvision: 18, weapons: ELF_WEAPONS },
  'drow': { ...base, speed: 9, darkvision: 36, weapons: ['rapier', 'shortsword', 'hand-crossbow'] },
  'lightfoot-halfling': { ...base, speed: 7.5, size: 'small' },
  'stout-halfling': { ...base, speed: 7.5, size: 'small' },
  'human': { ...base, speed: 9 },
  'dragonborn': { ...base, speed: 9 },
  'forest-gnome': { ...base, speed: 7.5, darkvision: 18, size: 'small' },
  'rock-gnome': { ...base, speed: 7.5, darkvision: 18, size: 'small' },
  'half-elf': { ...base, speed: 9, darkvision: 18 },
  'half-orc': { ...base, speed: 9, darkvision: 18 },
  'tiefling': { ...base, speed: 9, darkvision: 18 },
}

export const RACE_IDS = Object.keys(RACES) as RaceId[]
