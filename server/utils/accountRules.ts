import { randomInt } from 'node:crypto'

/** Règles des comptes, sans dépendance au serveur HTTP (testables seules). */

/** Session glissante : 90 jours sans visite avant de devoir se reconnecter (hypothèse à valider). */
export const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000
/** Prolongation d'une session au plus une fois par jour, pour ne pas écrire à chaque requête. */
export const SESSION_REFRESH_MS = 24 * 60 * 60 * 1000

/** Mot de passe : 8 caractères minimum (hypothèse à valider), 128 maximum (coût du hachage). */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

/**
 * Tentatives par heure : connexion par adresse IP et identifiant, par adresse IP seule, et par
 * identifiant toutes adresses confondues (contre un essai réparti sur de nombreuses adresses) ;
 * code d'installation par adresse IP ; mot de passe actuel par compte.
 */
export const LOGIN_LIMITS = { account: 10, ip: 30, username: 100, setup: 10, password: 10 } as const

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** Identifiant de compte (UUID) : un autre format ne peut correspondre à aucun compte. */
export function isUserId(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

/** Longueur maximale acceptée avant hachage (scrypt est coûteux). */
export const PASSWORD_INPUT_MAX = PASSWORD_MAX_LENGTH * 4

const USERNAME_PATTERN = /^[\p{L}\p{N}._-]{2,32}$/u

/** Identifiant saisi → forme enregistrée : sans espaces autour, minuscules, accents composés (NFC). */
export function normalizeUsername(input: string): string {
  return input.trim().normalize('NFC').toLocaleLowerCase('fr')
}

/** 2 à 32 lettres (accents compris), chiffres, points, tirets ou soulignés. */
export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username)
}

export function isValidPassword(password: unknown): password is string {
  return typeof password === 'string'
    && [...password].length >= PASSWORD_MIN_LENGTH
    && [...password].length <= PASSWORD_MAX_LENGTH
}

/** Alphabet base32 de Crockford : sans I, L, O ni U, pour éviter les confusions à la lecture. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** Mot de passe provisoire lisible : « K7P4-QX9M-3HDE » (60 bits). */
export function generatePassword(random: (max: number) => number = randomInt): string {
  const chars = Array.from({ length: 12 }, () => ALPHABET[random(ALPHABET.length)])
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8)].map(group => group.join('')).join('-')
}

export type Credentials = { ok: true, username: string, password: string } | { ok: false }

/** Corps `{ username, password }` : identifiant normalisé, mot de passe brut (vérifié ensuite). */
export function readCredentials(body: unknown): Credentials {
  if (typeof body !== 'object' || body === null) return { ok: false }
  const { username, password } = body as Record<string, unknown>
  if (typeof username !== 'string' || typeof password !== 'string') return { ok: false }
  if (password.length > PASSWORD_INPUT_MAX) return { ok: false }
  return { ok: true, username: normalizeUsername(username), password }
}
