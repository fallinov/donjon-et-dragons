import type { H3Event } from 'h3'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { PublicUser } from '~~/shared/types/account'
import { LOGIN_LIMITS, SESSION_REFRESH_MS, SESSION_TTL_MS } from './accountRules'
import { useAccountStore, type AccountStore, type StoredUser } from './accountStore'

export const SESSION_COOKIE = 'codex_session'

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

/** Comptes disponibles, sinon 503 (base non configurée en production). */
export function requireAccountStore(): AccountStore {
  const store = useAccountStore()
  if (!store) throw createError({ statusCode: 503, statusMessage: 'Comptes indisponibles' })
  return store
}

export const publicUser = (user: StoredUser): PublicUser => ({
  id: user.id,
  username: user.username,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
})

function writeCookie(event: H3Event, token: string, expiresAt: Date): void {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // En local (http://localhost) le navigateur refuserait un cookie Secure ; en ligne, toujours https
    secure: getRequestProtocol(event, { xForwardedProto: true }) === 'https',
    path: '/',
    expires: expiresAt,
  })
}

/** Ouvre une session : jeton aléatoire dans un cookie httpOnly, seul son hachage est enregistré. */
export async function startSession(event: H3Event, store: AccountStore, user: StoredUser, now = new Date()): Promise<void> {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS)
  await store.createSession(sha256(token), user.id, expiresAt)
  writeCookie(event, token, expiresAt)
}

export interface CurrentSession {
  user: StoredUser
  tokenHash: string
}

/** Session du cookie, prolongée au plus une fois par jour ; null si absente ou expirée. */
export async function readSession(event: H3Event, store: AccountStore, now = new Date()): Promise<CurrentSession | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null
  const tokenHash = sha256(token)
  const session = await store.findSession(tokenHash, now)
  if (!session) {
    deleteCookie(event, SESSION_COOKIE, { path: '/' })
    return null
  }
  if (now.getTime() - session.lastSeenAt.getTime() >= SESSION_REFRESH_MS) {
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS)
    await store.extendSession(tokenHash, expiresAt, now)
    writeCookie(event, token, expiresAt)
  }
  return { user: session.user, tokenHash }
}

export async function endSession(event: H3Event, store: AccountStore): Promise<void> {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) await store.deleteSession(sha256(token))
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

/**
 * Compte connecté, sinon 401. Un mot de passe provisoire bloque tout le reste (403) tant qu'il
 * n'est pas changé, sauf pour les routes qui le permettent (session, changement de mot de passe).
 */
export async function requireSession(event: H3Event, store: AccountStore, options: { allowMustChange?: boolean } = {}): Promise<CurrentSession> {
  const session = await readSession(event, store)
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Connexion requise' })
  if (session.user.mustChangePassword && !options.allowMustChange) {
    throw createError({ statusCode: 403, statusMessage: 'Mot de passe à changer' })
  }
  return session
}

export async function requireMaster(event: H3Event, store: AccountStore): Promise<CurrentSession> {
  const session = await requireSession(event, store)
  if (session.user.role !== 'master') throw createError({ statusCode: 403, statusMessage: 'Réservé au master' })
  return session
}

/** Limites désactivées seulement en développement pour les tests e2e (127.0.0.1 partagé par tous les navigateurs). */
const limitsDisabled = () => import.meta.dev && process.env.NUXT_E2E === 'true'

const clientIp = (event: H3Event) => getRequestIP(event, { xForwardedFor: true }) ?? 'inconnue'

async function enforce(store: AccountStore, counts: [string, number][], now: Date): Promise<void> {
  if (limitsDisabled()) return
  const hits = await Promise.all(counts.map(([key]) => store.hit(key, now)))
  if (hits.some((count, index) => count > counts[index]![1])) {
    throw createError({ statusCode: 429, statusMessage: 'Trop d\'essais, réessayez plus tard' })
  }
}

/** Limite les essais de connexion par adresse IP et identifiant, par IP, et par identifiant ; 429 au-delà. */
export async function enforceLoginLimit(event: H3Event, store: AccountStore, username: string, now = new Date()): Promise<void> {
  const ip = clientIp(event)
  await enforce(store, [
    [`login:${sha256(`codex-login:account:${ip}:${username}`)}`, LOGIN_LIMITS.account],
    [`login:${sha256(`codex-login:ip:${ip}`)}`, LOGIN_LIMITS.ip],
    [`login:${sha256(`codex-login:username:${username}`)}`, LOGIN_LIMITS.username],
  ], now)
}

/** Limite les essais du code d'installation par adresse IP. */
export async function enforceSetupLimit(event: H3Event, store: AccountStore, now = new Date()): Promise<void> {
  await enforce(store, [[`setup:${sha256(`codex-setup:ip:${clientIp(event)}`)}`, LOGIN_LIMITS.setup]], now)
}

/** Limite par compte et par heure d'une action (ex. envois de synchronisation) ; 429 au-delà. */
export async function enforceAccountLimit(store: AccountStore, action: string, userId: string, limit: number, now = new Date()): Promise<void> {
  await enforce(store, [[`${action}:${sha256(`codex-${action}:${userId}`)}`, limit]], now)
}

/** Limite les essais du mot de passe actuel par compte (session volée). */
export async function enforcePasswordLimit(store: AccountStore, userId: string, now = new Date()): Promise<void> {
  await enforce(store, [[`password:${sha256(`codex-password:${userId}`)}`, LOGIN_LIMITS.password]], now)
}

/**
 * Code d'installation : variable `SETUP_CODE` (Vercel). Sans elle, l'installation n'est possible
 * qu'en développement local ; un serveur de production sans code refuse (503), où qu'il tourne.
 */
export function checkSetupCode(input: unknown): boolean {
  const expected = process.env.SETUP_CODE
  if (!expected) {
    if (!import.meta.dev) throw createError({ statusCode: 503, statusMessage: 'Installation non configurée' })
    return true
  }
  if (typeof input !== 'string') return false
  return timingSafeEqual(Buffer.from(sha256(input.trim())), Buffer.from(sha256(expected)))
}

export const setupCodeRequired = (): boolean => Boolean(process.env.SETUP_CODE) || !import.meta.dev
