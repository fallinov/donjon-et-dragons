import type { ArmorCategory, ArmorId } from '~~/shared/types/rules'

export interface ArmorRules {
  category: ArmorCategory
  /** CA de base, avant le modificateur de Dextérité. */
  base: number
  /** Force minimale pour ne pas perdre 3 m de vitesse. */
  strength?: number
  stealthDisadvantage: boolean
}

/** Armures du Manuel des joueurs 2014 (SRD 5.1). */
export const ARMORS: Record<ArmorId, ArmorRules> = {
  'padded': { category: 'light', base: 11, stealthDisadvantage: true },
  'leather': { category: 'light', base: 11, stealthDisadvantage: false },
  'studded-leather': { category: 'light', base: 12, stealthDisadvantage: false },
  'hide': { category: 'medium', base: 12, stealthDisadvantage: false },
  'chain-shirt': { category: 'medium', base: 13, stealthDisadvantage: false },
  'scale-mail': { category: 'medium', base: 14, stealthDisadvantage: true },
  'breastplate': { category: 'medium', base: 14, stealthDisadvantage: false },
  'half-plate': { category: 'medium', base: 15, stealthDisadvantage: true },
  'ring-mail': { category: 'heavy', base: 14, stealthDisadvantage: true },
  'chain-mail': { category: 'heavy', base: 16, strength: 13, stealthDisadvantage: true },
  'splint': { category: 'heavy', base: 17, strength: 15, stealthDisadvantage: true },
  'plate': { category: 'heavy', base: 18, strength: 15, stealthDisadvantage: true },
}

export const ARMOR_IDS = Object.keys(ARMORS) as ArmorId[]

export const SHIELD_BONUS = 2

/** Plafond du modificateur de Dextérité ajouté à la CA (l'armure lourde l'ignore entièrement). */
export const DEX_CAP: Record<Exclude<ArmorCategory, 'heavy'>, number> = { light: Infinity, medium: 2 }
