/**
 * Vérification complète de la structure d'une fiche venue de l'extérieur (fichier
 * importé) : chaque champ a le bon type. Une fiche mal formée ne doit jamais
 * atteindre l'affichage ou IndexedDB.
 */
type Guard = (value: unknown) => boolean

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const str: Guard = value => typeof value === 'string'
const num: Guard = value => typeof value === 'number' && Number.isFinite(value)
const bool: Guard = value => typeof value === 'boolean'
const optional = (guard: Guard): Guard => value => value === undefined || guard(value)
const oneOf = (...values: unknown[]): Guard => value => values.includes(value)
const list = (guard: Guard): Guard => value => Array.isArray(value) && value.every(guard)
const shape = (fields: Record<string, Guard>): Guard => value =>
  isObject(value) && Object.entries(fields).every(([key, guard]) => guard(value[key]))

const ability = shape({ label: str, score: num, modifier: num, saveModifier: num, proficient: bool })

const characterGuard = shape({
  id: str,
  player: str,
  firstName: str,
  lastName: optional(str),
  eyebrow: str,
  race: str,
  className: str,
  level: num,
  background: str,
  alignment: str,
  proficiencyBonus: num,
  maxHp: num,
  hitDice: shape({ die: oneOf(6, 8, 10, 12), total: num }),
  portrait: shape({ alt: str, mime: str }),
  vitals: list(shape({ label: str, value: str, unit: optional(str) })),
  abilities: shape({ strength: ability, dexterity: ability, constitution: ability, intelligence: ability, wisdom: ability, charisma: ability }),
  skills: list(shape({ name: str, ability: oneOf('For', 'Dex', 'Con', 'Int', 'Sag', 'Cha'), modifier: num, proficient: bool })),
  features: list(shape({ title: str, description: str, benefits: optional(list(str)) })),
  personality: shape({ trait: str, ideal: str, idealLabel: optional(str), bond: str, flaw: str }),
  attacks: list(shape({ name: str, note: str, attackBonus: str, damage: str, damageType: str })),
  spellcasting: optional(shape({
    saveDc: num,
    attackBonus: optional(num),
    shortRestRefresh: optional(bool),
    slotLevels: list(shape({ level: num, slots: num })),
    spells: list(shape({
      title: str,
      description: str,
      level: num,
      cost: oneOf('cantrip', 'slot', 'daily'),
      castingTime: optional(str),
      range: optional(str),
      duration: optional(str),
      concentration: optional(bool),
      check: optional(str),
      effect: optional(str),
    })),
  })),
  darkvision: optional(num),
  languages: list(shape({ name: str, rare: optional(bool) })),
  rituals: list(shape({
    number: str,
    title: str,
    steps: list(shape({ text: str, emphasis: optional(str) })),
    formulas: list(str),
    footnote: optional(str),
  })),
  ritualsNote: optional(str),
  colophon: str,
  schemaVersion: num,
  origin: oneOf('builtin', 'user', 'import'),
  createdAt: str,
  updatedAt: str,
})

export function hasCharacterShape(value: unknown): boolean {
  return characterGuard(value)
}
