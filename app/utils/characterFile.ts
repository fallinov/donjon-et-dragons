import { CHARACTER_SCHEMA_VERSION, type StoredCharacter } from '~~/shared/types/character'
import { isValidState, normalizeState, type CharacterState } from '~/composables/useCharacterState'
import { parseInventory, type InventoryState } from '~/composables/useInventory'
import type { MessageKey } from '~/composables/useT'
import { migrateDocument } from '~/db/migrations'
import { arrayBufferToBase64, base64ToArrayBuffer } from '~/utils/base64'
import { hasCharacterShape } from '~/utils/characterShape'
import { validateCharacter } from '~/utils/validateCharacter'

/** Identifiant du format de fichier d'une fiche exportée. */
export const CHARACTER_FILE_FORMAT = 'codex-dnd/character'
/** Fichier importé refusé au-delà (portrait de 1024 px en base64 ≈ 0,5 Mo). */
export const CHARACTER_FILE_MAX_BYTES = 15 * 1024 * 1024
const PORTRAIT_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

/** Fichier JSON d'une fiche : fiche complète, portrait en base64, état de jeu et sac. */
export interface CharacterFile {
  format: typeof CHARACTER_FILE_FORMAT
  /** Version du format de la fiche (`CHARACTER_SCHEMA_VERSION`), pour les migrations. */
  schemaVersion: number
  exportedAt: string
  character: Omit<StoredCharacter, 'portrait'> & { portrait: { alt: string, mime: string, base64: string } }
  state?: CharacterState
  inventory?: InventoryState
}

export interface ImportedCharacter {
  character: StoredCharacter
  state?: CharacterState
  inventory?: InventoryState
}

export type ParseResult = { ok: true, value: ImportedCharacter } | { ok: false, error: MessageKey }

export function serializeCharacter(character: StoredCharacter, extras: { state?: CharacterState, inventory?: InventoryState } = {}, now: Date = new Date()): CharacterFile {
  const { portrait, ...rest } = character
  return {
    format: CHARACTER_FILE_FORMAT,
    schemaVersion: character.schemaVersion,
    exportedAt: now.toISOString(),
    character: { ...rest, portrait: { alt: portrait.alt, mime: portrait.mime, base64: arrayBufferToBase64(portrait.data) } },
    ...(extras.state ? { state: extras.state } : {}),
    ...(extras.inventory ? { inventory: extras.inventory } : {}),
  }
}

/** Nom de fichier lisible et sûr : « dareth-brumeval.codex.json ». */
export function characterFileName(character: Pick<StoredCharacter, 'firstName' | 'lastName' | 'id'>): string {
  const base = `${character.firstName} ${character.lastName ?? ''}`
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${base || character.id}.codex.json`
}

const fail = (error: MessageKey): ParseResult => ({ ok: false, error })

/**
 * Lit un fichier de fiche (déjà décodé en JSON). Refuse tout ce qui n'est pas une
 * fiche valide ; migre une fiche d'un format antérieur ; ignore un état de jeu ou
 * un sac abîmé plutôt que de refuser la fiche.
 */
export function parseCharacterFile(input: unknown): ParseResult {
  if (typeof input !== 'object' || input === null) return fail('import.error.notCodex')
  const file = input as Record<string, unknown>
  if (file.format !== CHARACTER_FILE_FORMAT) return fail('import.error.notCodex')
  if (typeof file.schemaVersion !== 'number' || file.schemaVersion > CHARACTER_SCHEMA_VERSION) return fail('import.error.newer')

  const raw = file.character
  if (typeof raw !== 'object' || raw === null) return fail('import.error.invalid')
  const { portrait, ...rest } = raw as Record<string, unknown>
  if (typeof portrait !== 'object' || portrait === null) return fail('import.error.invalid')
  const { base64, mime, alt } = portrait as Record<string, unknown>
  if (typeof base64 !== 'string' || typeof mime !== 'string' || typeof alt !== 'string' || !PORTRAIT_MIMES.includes(mime)) {
    return fail('import.error.invalid')
  }
  let data: ArrayBuffer
  try {
    data = base64ToArrayBuffer(base64)
  }
  catch {
    return fail('import.error.invalid')
  }

  const character = migrateDocument({ ...rest, schemaVersion: file.schemaVersion, portrait: { data, mime, alt } })
  if (!character || !hasCharacterShape(character) || validateCharacter(character).length) return fail('import.error.invalid')

  const value: ImportedCharacter = { character }
  if (isValidState(file.state)) value.state = normalizeState(character, file.state)
  const inventory = parseInventory(file.inventory)
  if (inventory) value.inventory = inventory
  return { ok: true, value }
}

/** Lit un fichier choisi par l'utilisateur. */
export async function readCharacterFile(file: File): Promise<ParseResult> {
  if (file.size > CHARACTER_FILE_MAX_BYTES) return fail('import.error.tooLarge')
  let json: unknown
  try {
    json = JSON.parse(await file.text())
  }
  catch {
    return fail('import.error.notCodex')
  }
  return parseCharacterFile(json)
}
