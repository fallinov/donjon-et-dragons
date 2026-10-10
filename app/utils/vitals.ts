import type { Character, Vital } from '~~/shared/types/character'

/**
 * Libellés des vitals affichés dans l'en-tête de la fiche. Ce sont des clés de
 * données (identiques dans les fiches de départ), pas des textes d'interface.
 */
export const VITAL_LABELS = {
  armorClass: "Classe d'armure",
  initiative: 'Initiative',
  speed: 'Vitesse',
} as const

export type VitalKey = keyof typeof VITAL_LABELS

export function findVital(character: Pick<Character, 'vitals'>, key: VitalKey): Vital | undefined {
  return character.vitals.find(vital => vital.label === VITAL_LABELS[key])
}

/** Retourne le vital, créé à vide s'il manque (éditeur). */
export function ensureVital(character: Pick<Character, 'vitals'>, key: VitalKey): Vital {
  const existing = findVital(character, key)
  if (existing) return existing
  const created: Vital = { label: VITAL_LABELS[key], value: '' }
  character.vitals.push(created)
  return character.vitals[character.vitals.length - 1]!
}
