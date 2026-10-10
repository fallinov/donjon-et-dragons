import { CHARACTER_SCHEMA_VERSION, type StoredCharacter } from '~~/shared/types/character'

type RawDocument = Record<string, unknown>
type Migration = (doc: RawDocument) => RawDocument

/**
 * Migrations du format de fiche : la clé N transforme un document de version N
 * en version N + 1. Vide tant que le format n'a pas évolué.
 */
export const migrations: Record<number, Migration> = {}

function isRecord(value: unknown): value is RawDocument {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Vérification structurelle minimale d'une fiche à la version courante. */
function isStoredCharacter(doc: RawDocument): boolean {
  const portrait = doc.portrait
  return (
    typeof doc.id === 'string' && doc.id.length > 0
    && typeof doc.firstName === 'string'
    && typeof doc.level === 'number'
    && typeof doc.maxHp === 'number'
    && isRecord(doc.abilities)
    && isRecord(doc.hitDice)
    && Array.isArray(doc.skills)
    && isRecord(portrait)
    && portrait.data instanceof ArrayBuffer
    && typeof portrait.mime === 'string'
  )
}

/**
 * Amène un document à la version courante du format.
 * Retourne null si le document est illisible ou vient d'une version future de l'app.
 */
export function migrateDocument(
  input: unknown,
  steps: Record<number, Migration> = migrations,
  target: number = CHARACTER_SCHEMA_VERSION,
): StoredCharacter | null {
  if (!isRecord(input)) return null
  let doc = input
  let version = doc.schemaVersion
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1 || version > target) return null
  while (version < target) {
    const step = steps[version]
    if (!step) return null
    doc = { ...step(doc), schemaVersion: version + 1 }
    version += 1
  }
  return isStoredCharacter(doc) ? (doc as unknown as StoredCharacter) : null
}
