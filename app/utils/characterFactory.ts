import {
  CHARACTER_SCHEMA_VERSION,
  type AbilityKey,
  type Character,
  type Skill,
  type StoredCharacter,
} from '~~/shared/types/character'
import { t, type MessageKey } from '~/composables/useT'
import { toPlain } from '~/utils/toPlain'
import { VITAL_LABELS } from '~/utils/vitals'
import type { PortraitBytes } from '~/db/seed'

export const ABILITY_KEYS: AbilityKey[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

/** Les 18 compétences de D&D 5e (PHB 2014), avec leur caractéristique. */
const SKILLS: { key: MessageKey, ability: Skill['ability'] }[] = [
  { key: 'skill.acrobatics', ability: 'Dex' },
  { key: 'skill.arcana', ability: 'Int' },
  { key: 'skill.athletics', ability: 'For' },
  { key: 'skill.stealth', ability: 'Dex' },
  { key: 'skill.animalHandling', ability: 'Sag' },
  { key: 'skill.sleightOfHand', ability: 'Dex' },
  { key: 'skill.history', ability: 'Int' },
  { key: 'skill.intimidation', ability: 'Cha' },
  { key: 'skill.investigation', ability: 'Int' },
  { key: 'skill.medicine', ability: 'Sag' },
  { key: 'skill.nature', ability: 'Int' },
  { key: 'skill.perception', ability: 'Sag' },
  { key: 'skill.insight', ability: 'Sag' },
  { key: 'skill.persuasion', ability: 'Cha' },
  { key: 'skill.religion', ability: 'Int' },
  { key: 'skill.performance', ability: 'Cha' },
  { key: 'skill.survival', ability: 'Sag' },
  { key: 'skill.deception', ability: 'Cha' },
]

/** Portrait par défaut d'une nouvelle fiche (silhouette), à télécharger avec `fetchPortrait`. */
export const PLACEHOLDER_PORTRAIT_SRC = '/img/portrait-placeholder.svg'

/**
 * Fiche vierge : valeurs neutres d'un personnage de niveau 1 en D&D 5e
 * (validées par Steve le 10.10.2026) — maîtrise +2, caractéristiques à 10,
 * les 18 compétences à 0, d8 ×1, 8 PV, sans sorts.
 */
export function createBlankCharacter(id: string, portrait: PortraitBytes): Character {
  return {
    id,
    player: '',
    firstName: '',
    lastName: '',
    eyebrow: '',
    race: '',
    className: '',
    level: 1,
    background: '',
    alignment: '',
    proficiencyBonus: 2,
    maxHp: 8,
    hitDice: { die: 8, total: 1 },
    portrait: { data: portrait.data, mime: portrait.mime, alt: '' },
    vitals: [
      { label: VITAL_LABELS.armorClass, value: '10' },
      { label: VITAL_LABELS.initiative, value: '+0' },
      { label: VITAL_LABELS.speed, value: '9', unit: 'm' },
    ],
    abilities: Object.fromEntries(ABILITY_KEYS.map(key => [
      key,
      { label: t(`ability.${key}` as MessageKey), score: 10, modifier: 0, saveModifier: 0, proficient: false },
    ])) as Character['abilities'],
    skills: SKILLS.map(skill => ({ name: t(skill.key), ability: skill.ability, modifier: 0, proficient: false })),
    features: [],
    personality: { trait: '', ideal: '', bond: '', flaw: '' },
    attacks: [],
    languages: [],
    rituals: [],
    colophon: '',
  }
}

/**
 * Fiche prête à enregistrer depuis un brouillon : nouvelle fiche (`existing` absent)
 * ou mise à jour d'une fiche existante (provenance et date de création conservées).
 */
export function toStoredFromDraft(draft: Character, existing: StoredCharacter | undefined, now: Date = new Date()): StoredCharacter {
  const plain = toPlain(draft)
  const timestamp = now.toISOString()
  return {
    ...plain,
    id: existing?.id ?? plain.id,
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    origin: existing?.origin ?? 'user',
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}
