import type { H3Event } from 'h3'
import { randomUUID } from 'node:crypto'
import type { AccountSummary, PublicUser, Role } from '~~/shared/types/account'
import { ensureSchema, hitRateLimit, useSql, type Sql } from './database'
import { e2eTenant, tenantStore } from './e2eTenant'
import { rateWindow } from './rateLimit'

export interface StoredUser extends PublicUser {
  passwordHash: string
  createdAt: Date
}

export interface NewUser {
  username: string
  passwordHash: string
  role: Role
  mustChangePassword: boolean
}

export interface UserChanges {
  username?: string
  role?: Role
}

export interface StoredSession {
  user: StoredUser
  expiresAt: Date
  lastSeenAt: Date
}

/** Stockage des comptes et des sessions (le jeton de session n'est jamais enregistré, seulement son hachage). */
export interface AccountStore {
  hasUsers: () => Promise<boolean>
  /** Premier compte master ; null si un compte existe déjà (installation déjà faite). */
  createFirstMaster: (user: Omit<NewUser, 'role' | 'mustChangePassword'>) => Promise<StoredUser | null>
  /** null si l'identifiant est déjà pris. */
  createUser: (user: NewUser) => Promise<StoredUser | null>
  findByUsername: (username: string) => Promise<StoredUser | null>
  getUser: (id: string) => Promise<StoredUser | null>
  listUsers: () => Promise<AccountSummary[]>
  setPassword: (id: string, passwordHash: string, mustChangePassword: boolean) => Promise<boolean>
  deleteUser: (id: string) => Promise<boolean>
  /**
   * Renomme et/ou change le rôle. `taken` : identifiant déjà pris ; `lastMaster` : le groupe
   * garderait zéro master ; null : compte introuvable.
   */
  updateUser: (id: string, changes: UserChanges) => Promise<StoredUser | 'taken' | 'lastMaster' | null>
  createSession: (tokenHash: string, userId: string, expiresAt: Date) => Promise<void>
  /** Session non expirée et son compte, ou null. */
  findSession: (tokenHash: string, now: Date) => Promise<StoredSession | null>
  extendSession: (tokenHash: string, expiresAt: Date, now: Date) => Promise<void>
  deleteSession: (tokenHash: string) => Promise<void>
  /** Ferme les sessions d'un compte, sauf éventuellement la session courante. */
  deleteSessions: (userId: string, keepTokenHash?: string) => Promise<void>
  /** Supprime les sessions expirées et les compteurs de limitation des heures passées. */
  deleteExpired: (now: Date) => Promise<void>
  /** Incrémente le compteur de la fenêtre courante (une heure) et renvoie sa nouvelle valeur. */
  hit: (key: string, now: Date) => Promise<number>
}

const summary = (user: StoredUser): AccountSummary => ({
  id: user.id,
  username: user.username,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
  createdAt: user.createdAt.toISOString(),
})

export function createMemoryAccountStore(): AccountStore {
  const users = new Map<string, StoredUser>()
  const sessions = new Map<string, { userId: string, expiresAt: Date, lastSeenAt: Date }>()
  const counters = new Map<string, number>()
  const byUsername = (username: string) => [...users.values()].find(u => u.username === username) ?? null
  const insert = (user: NewUser): StoredUser => {
    const stored = { ...user, id: randomUUID(), createdAt: new Date() }
    users.set(stored.id, stored)
    return stored
  }
  return {
    async hasUsers() {
      return users.size > 0
    },
    async createFirstMaster(user) {
      return users.size > 0 ? null : insert({ ...user, role: 'master', mustChangePassword: false })
    },
    async createUser(user) {
      return byUsername(user.username) ? null : insert(user)
    },
    async findByUsername(username) {
      return byUsername(username)
    },
    async getUser(id) {
      return users.get(id) ?? null
    },
    async listUsers() {
      return [...users.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map(summary)
    },
    async setPassword(id, passwordHash, mustChangePassword) {
      const user = users.get(id)
      if (!user) return false
      users.set(id, { ...user, passwordHash, mustChangePassword })
      return true
    },
    async deleteUser(id) {
      for (const [hash, session] of sessions) if (session.userId === id) sessions.delete(hash)
      return users.delete(id)
    },
    async updateUser(id, changes) {
      const user = users.get(id)
      if (!user) return null
      if (changes.username !== undefined && changes.username !== user.username && byUsername(changes.username)) return 'taken'
      const masters = [...users.values()].filter(u => u.role === 'master').length
      if (user.role === 'master' && changes.role === 'player' && masters <= 1) return 'lastMaster'
      const updated = { ...user, ...changes }
      users.set(id, updated)
      return updated
    },
    async createSession(tokenHash, userId, expiresAt) {
      sessions.set(tokenHash, { userId, expiresAt, lastSeenAt: new Date() })
    },
    async findSession(tokenHash, now) {
      const session = sessions.get(tokenHash)
      const user = session && users.get(session.userId)
      if (!session || !user || session.expiresAt <= now) return null
      return { user, expiresAt: session.expiresAt, lastSeenAt: session.lastSeenAt }
    },
    async extendSession(tokenHash, expiresAt, now) {
      const session = sessions.get(tokenHash)
      if (session) sessions.set(tokenHash, { ...session, expiresAt, lastSeenAt: now })
    },
    async deleteSession(tokenHash) {
      sessions.delete(tokenHash)
    },
    async deleteSessions(userId, keepTokenHash) {
      for (const [hash, session] of sessions) if (session.userId === userId && hash !== keepTokenHash) sessions.delete(hash)
    },
    async deleteExpired(now) {
      for (const [hash, session] of sessions) if (session.expiresAt <= now) sessions.delete(hash)
      const current = rateWindow(now).getTime()
      for (const key of counters.keys()) if (Number(key.split('|').at(-1)) < current) counters.delete(key)
    },
    async hit(key, now) {
      const bucket = `${key}|${rateWindow(now).getTime()}`
      const count = (counters.get(bucket) ?? 0) + 1
      counters.set(bucket, count)
      return count
    },
  }
}

interface UserRow {
  id: string
  username: string
  password_hash: string
  role: Role
  must_change_password: boolean
  created_at: string | Date
}

const USER_COLUMNS = 'id, username, password_hash, role, must_change_password, created_at'

const fromRow = (row: UserRow): StoredUser => ({
  id: row.id,
  username: row.username,
  passwordHash: row.password_hash,
  role: row.role,
  mustChangePassword: row.must_change_password,
  createdAt: new Date(row.created_at),
})

/** Verrou de la création du premier master : deux installations simultanées n'en créent qu'un. */
const SETUP_LOCK = 4_247_002
/** Verrou des changements de rôle : le groupe garde toujours au moins un master. */
const ROLE_LOCK = 4_247_003

export function createNeonAccountStore(sql: Sql): AccountStore {
  const schema = () => ensureSchema(sql)
  const one = async (text: string, params: unknown[]): Promise<StoredUser | null> => {
    await schema()
    const rows = await sql.query(text, params) as UserRow[]
    return rows[0] ? fromRow(rows[0]) : null
  }
  return {
    async hasUsers() {
      await schema()
      return (await sql.query('SELECT 1 FROM users LIMIT 1')).length > 0
    },
    async createFirstMaster(user) {
      await schema()
      const [, rows] = await sql.transaction([
        sql.query('SELECT pg_advisory_xact_lock($1)', [SETUP_LOCK]),
        sql.query(
          `INSERT INTO users (id, username, password_hash, role)
           SELECT $1, $2, $3, 'master' WHERE NOT EXISTS (SELECT 1 FROM users)
           RETURNING ${USER_COLUMNS}`,
          [randomUUID(), user.username, user.passwordHash],
        ),
      ]) as [unknown, UserRow[]]
      return rows[0] ? fromRow(rows[0]) : null
    },
    async createUser(user) {
      return one(
        `INSERT INTO users (id, username, password_hash, role, must_change_password) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (username) DO NOTHING RETURNING ${USER_COLUMNS}`,
        [randomUUID(), user.username, user.passwordHash, user.role, user.mustChangePassword],
      )
    },
    async findByUsername(username) {
      return one(`SELECT ${USER_COLUMNS} FROM users WHERE username = $1`, [username])
    },
    async getUser(id) {
      return one(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id])
    },
    async listUsers() {
      await schema()
      const rows = await sql.query(`SELECT ${USER_COLUMNS} FROM users ORDER BY created_at`) as UserRow[]
      return rows.map(row => summary(fromRow(row)))
    },
    async setPassword(id, passwordHash, mustChangePassword) {
      return (await one(
        `UPDATE users SET password_hash = $2, must_change_password = $3 WHERE id = $1 RETURNING ${USER_COLUMNS}`,
        [id, passwordHash, mustChangePassword],
      )) !== null
    },
    async deleteUser(id) {
      await schema()
      // Les sessions du compte disparaissent avec lui (ON DELETE CASCADE)
      return (await sql.query('DELETE FROM users WHERE id = $1 RETURNING id', [id])).length === 1
    },
    async updateUser(id, changes) {
      await schema()
      try {
        const [, rows] = await sql.transaction([
          // Deux masters qui se rétrogradent en même temps : l'un attend l'autre, il en reste un
          sql.query('SELECT pg_advisory_xact_lock($1)', [ROLE_LOCK]),
          sql.query(
            `UPDATE users SET username = COALESCE($2, username), role = COALESCE($3, role)
             WHERE id = $1 AND NOT (
               -- COALESCE : sans changement de rôle, $3 est NULL et la garde doit valoir faux, pas NULL
               role = 'master' AND COALESCE($3, '') = 'player'
               AND (SELECT count(*) FROM users WHERE role = 'master') <= 1
             )
             RETURNING ${USER_COLUMNS}`,
            [id, changes.username ?? null, changes.role ?? null],
          ),
        ]) as [unknown, UserRow[]]
        if (rows[0]) return fromRow(rows[0])
        return (await one(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id])) ? 'lastMaster' : null
      }
      catch (error) {
        // Contrainte UNIQUE sur l'identifiant
        if ((error as { code?: string }).code === '23505') return 'taken'
        throw error
      }
    },
    async createSession(tokenHash, userId, expiresAt) {
      await schema()
      await sql.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [tokenHash, userId, expiresAt.toISOString()])
    },
    async findSession(tokenHash, now) {
      await schema()
      const rows = await sql.query(
        `SELECT s.expires_at AS session_expires_at, s.last_seen_at, ${USER_COLUMNS.split(', ').map(c => `u.${c}`).join(', ')}
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1 AND s.expires_at > $2`,
        [tokenHash, now.toISOString()],
      ) as (UserRow & { session_expires_at: string | Date, last_seen_at: string | Date })[]
      const row = rows[0]
      return row ? { user: fromRow(row), expiresAt: new Date(row.session_expires_at), lastSeenAt: new Date(row.last_seen_at) } : null
    },
    async extendSession(tokenHash, expiresAt, now) {
      await schema()
      await sql.query('UPDATE sessions SET expires_at = $2, last_seen_at = $3 WHERE token_hash = $1', [tokenHash, expiresAt.toISOString(), now.toISOString()])
    },
    async deleteSession(tokenHash) {
      await schema()
      await sql.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash])
    },
    async deleteSessions(userId, keepTokenHash) {
      await schema()
      await sql.query('DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2', [userId, keepTokenHash ?? ''])
    },
    async deleteExpired(now) {
      await schema()
      await sql.transaction([
        sql.query('DELETE FROM sessions WHERE expires_at <= $1', [now.toISOString()]),
        sql.query('DELETE FROM rate_limits WHERE window_start < $1', [rateWindow(now).toISOString()]),
      ])
    },
    async hit(key, now) {
      return hitRateLimit(sql, key, now)
    },
  }
}

let store: AccountStore | null | undefined
const tenants = new Map<string, AccountStore>()

/** Même règle que le relais : Neon si `DATABASE_URL`, null sur Vercel sans base (503), mémoire sinon. */
export function useAccountStore(event?: H3Event): AccountStore | null {
  const tenant = e2eTenant(event)
  if (tenant) return tenantStore(tenants, tenant, createMemoryAccountStore)
  if (store !== undefined) return store
  const sql = useSql()
  if (sql) store = createNeonAccountStore(sql)
  else if (process.env.VERCEL) store = null
  else store = createMemoryAccountStore()
  return store
}
