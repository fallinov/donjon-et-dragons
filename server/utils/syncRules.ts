import { createHash } from 'node:crypto'
import type { Role } from '~~/shared/types/account'
import type { SyncChange } from '~~/shared/types/sync'
import { isValidState, parseInventory, type CharacterState } from '~/utils/characterParts'
import { CHARACTER_FILE_FORMAT, parseCharacterFile, serializeCharacter } from '~/utils/characterFile'
import { seeds } from '~/data/characters'

/** Règles de la synchronisation, sans dépendance au serveur HTTP (testables seules). */

/** Modifications par envoi ; l'appareil envoie les fiches (portrait compris) une par une. */
export const SYNC_MAX_CHANGES = 50
/**
 * Fiches renvoyées par page de téléchargement : 20 × (fiche ≤ 100 Ko + état et sac ≤ 50 Ko)
 * reste sous la limite de 4,5 Mo d'une réponse de fonction Vercel.
 */
export const SYNC_PAGE_SIZE = 20
/** Fiche sans portrait : 100 Ko au plus (les fiches de départ font moins de 8 Ko). */
export const SHEET_MAX_BYTES = 100_000
/** Portrait : 1,5 Mo au plus (photo réduite à 1024 px : 0,5 Mo environ). */
export const PORTRAIT_MAX_BYTES = 1_500_000
/** Sac : 50 Ko au plus. */
export const PART_MAX_BYTES = 50_000
/** Fiches par joueur (les masters n'ont pas de limite). */
export const PLAYER_MAX_SHEETS = 20
/** Envois de modifications par heure et par compte (une partie en envoie quelques centaines). */
export const SYNC_PUSH_LIMIT = 1200
/**
 * Une date de modification dans le futur (horloge du téléphone en avance) est ramenée à l'heure
 * du serveur au-delà d'une minute : sinon cette modification gagnerait contre toutes les suivantes.
 */
export const MAX_CLOCK_SKEW_MS = 60 * 1000

/** Fiches de départ : seul un master peut les créer sur le serveur (sinon le premier joueur qui synchronise en deviendrait propriétaire). */
export const BUILTIN_IDS: ReadonlySet<string> = new Set(seeds.map(seed => seed.slug))

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** Identifiant de fiche : slug d'une fiche de départ ou UUID. */
export function isCharacterId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value)
}

const PARTS = new Set(['sheet', 'state', 'inventory', 'delete'])

/** Corps `{ changes: [...] }` ; null s'il n'a pas la bonne forme (400). */
export function readChanges(body: unknown): SyncChange[] | null {
  if (typeof body !== 'object' || body === null) return null
  const { changes } = body as { changes?: unknown }
  if (!Array.isArray(changes) || changes.length === 0 || changes.length > SYNC_MAX_CHANGES) return null
  const result: SyncChange[] = []
  for (const entry of changes) {
    if (typeof entry !== 'object' || entry === null) return null
    const { id, part, data, changedAt } = entry as Record<string, unknown>
    if (typeof id !== 'string' || typeof part !== 'string' || !PARTS.has(part) || typeof changedAt !== 'string') return null
    result.push({ id, part: part as SyncChange['part'], data, changedAt })
  }
  return result
}

/** Date de modification lue ; null si illisible ; ramenée à `now` si trop loin dans le futur. */
export function readChangedAt(value: string, now: Date): Date | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.getTime() > now.getTime() + MAX_CLOCK_SKEW_MS ? now : date
}

export interface Writer {
  id: string
  role: Role
}

/**
 * Droit d'écriture : un master modifie toutes les fiches ; un joueur, les siennes. Fiche absente
 * du serveur (`ownerId` undefined) : un joueur ne crée que des fiches à identifiant UUID (fiches
 * créées dans l'app) ; les slugs (fiches de départ, actuelles ou futures) sont réservés aux masters.
 */
export function canWrite(user: Writer, characterId: string, ownerId: string | null | undefined): boolean {
  if (user.role === 'master') return true
  if (ownerId === undefined) return UUID_PATTERN.test(characterId) && !BUILTIN_IDS.has(characterId)
  return ownerId === user.id
}

export interface PortraitData {
  hash: string
  mime: string
  base64: string
}

export interface ValidSheet {
  /** Fichier de fiche normalisé (migré, validé), sans le portrait en base64. */
  sheet: Record<string, unknown>
  portrait: PortraitData
}

/**
 * Types d'image acceptés pour un portrait synchronisé, reconnus à leurs premiers octets. Pas de SVG :
 * servi depuis le site, il pourrait exécuter un script avec la session de celui qui l'ouvre.
 */
const PORTRAIT_SIGNATURES: Record<string, (bytes: Buffer) => boolean> = {
  'image/jpeg': b => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF,
  'image/png': b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])),
  'image/webp': b => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
}

/** Portrait reçu : type autorisé, contenu conforme au type annoncé, taille bornée. */
export function isAcceptedPortrait(mime: string, base64: string): boolean {
  const check = PORTRAIT_SIGNATURES[mime]
  if (!check || base64.length > Math.ceil(PORTRAIT_MAX_BYTES / 3) * 4) return false
  return check(Buffer.from(base64.slice(0, 24), 'base64'))
}

/**
 * Fiche reçue : même lecture stricte qu'un fichier importé (forme, migration, validation).
 * L'identifiant doit correspondre ; l'état et le sac éventuels du fichier sont ignorés (parties à part).
 */
export function validateSheet(id: string, data: unknown): ValidSheet | null {
  const parsed = parseCharacterFile(data)
  if (!parsed.ok || parsed.value.character.id !== id) return null
  const file = serializeCharacter(parsed.value.character, {}, new Date(0))
  const { base64, mime, alt } = file.character.portrait
  if (!isAcceptedPortrait(mime, base64)) return null
  const { exportedAt: _exportedAt, ...rest } = file
  const sheet = { ...rest, format: CHARACTER_FILE_FORMAT, character: { ...file.character, portrait: { alt, mime } } }
  if (JSON.stringify(sheet).length > SHEET_MAX_BYTES) return null
  return {
    sheet,
    // Empreinte du type et du contenu : un changement de l'un ou de l'autre remplace le portrait
    portrait: { hash: createHash('sha256').update(`${mime}\n${base64}`).digest('hex'), mime, base64 },
  }
}

const finite = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.trunc(value))) : min

/** État de jeu reconstruit champ par champ (aucune clé inconnue), nombres et listes bornés. */
function cleanState(data: unknown): CharacterState | null {
  if (!isValidState(data)) return null
  const raw = data as unknown as Record<string, unknown>
  const deathSaves = data.deathSaves as unknown as Record<string, unknown>
  const daily = Array.isArray(raw.dailySpellsUsed) ? raw.dailySpellsUsed : []
  return {
    hpCurrent: finite(data.hpCurrent, -1000, 10_000),
    hpTemp: finite(data.hpTemp, 0, 10_000),
    inspiration: finite(data.inspiration, 0, 100),
    hitDiceUsed: finite(data.hitDiceUsed, 0, 100),
    deathSaves: { successes: finite(deathSaves.successes, 0, 3), failures: finite(deathSaves.failures, 0, 3) },
    spellSlotsUsed: data.spellSlotsUsed.slice(0, 20).map(n => finite(n, 0, 100)),
    dailySpellsUsed: daily.filter((v): v is string => typeof v === 'string').slice(0, 200).map(v => v.slice(0, 200)),
  }
}

/** État de jeu ou sac reçu, nettoyé et borné ; null s'il est refusé. */
export function validatePart(part: 'state' | 'inventory', data: unknown): unknown | null {
  if (part === 'state') return cleanState(data)
  const inventory = parseInventory(data)
  return inventory && JSON.stringify(inventory).length <= PART_MAX_BYTES ? inventory : null
}
