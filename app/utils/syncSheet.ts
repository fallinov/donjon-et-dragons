import type { StoredCharacter } from '~~/shared/types/character'
import { serializeCharacter, type CharacterFile } from '~/utils/characterFile'

/** Fichier de fiche tel que le serveur le garde : sans date d'export, portrait réduit à `{ alt, mime }`. */
export function sheetOf(character: StoredCharacter): Record<string, unknown> {
  const { exportedAt: _exportedAt, ...file } = serializeCharacter(character, {}, new Date(0))
  const { base64: _base64, ...portrait } = file.character.portrait
  return { ...file, character: { ...file.character, portrait } }
}

/** JSON aux clés triées : Postgres (jsonb) ne garde pas l'ordre des clés. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

/** Fiche reçue (sans portrait) complétée par le portrait en base64, prête pour `parseCharacterFile`. */
export function withPortrait(sheet: unknown, base64: string): CharacterFile | null {
  if (typeof sheet !== 'object' || sheet === null) return null
  const file = sheet as CharacterFile
  if (typeof file.character !== 'object' || file.character === null) return null
  return { ...file, exportedAt: new Date(0).toISOString(), character: { ...file.character, portrait: { ...file.character.portrait, base64 } } }
}

/** Empreinte d'un portrait, calculée comme le serveur (type et contenu). */
export async function portraitHash(mime: string, base64: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${mime}\n${base64}`))
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}
