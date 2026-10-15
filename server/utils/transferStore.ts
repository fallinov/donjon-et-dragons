import { createHash } from 'node:crypto'
import { ensureSchema, hitRateLimit, useSql, type Sql } from './database'
import { rateWindow, type RateAction } from './transferRules'

export interface StoredTransfer {
  data: string
  expiresAt: Date
}

/** Stockage du relais : transferts chiffrés et compteurs de limitation. */
export interface TransferStore {
  /** Enregistre ; false si l'identifiant existe déjà et n'a pas expiré. */
  put: (id: string, data: string, expiresAt: Date) => Promise<boolean>
  /** Transfert non expiré, ou null. */
  get: (id: string, now: Date) => Promise<StoredTransfer | null>
  /** Supprime transferts expirés et anciens compteurs. */
  deleteExpired: (now: Date) => Promise<void>
  /** Incrémente le compteur de la fenêtre courante et renvoie sa nouvelle valeur. */
  hit: (key: string, now: Date) => Promise<number>
}

/** Adresse IP pseudonymisée pour les compteurs (l'adresse n'est jamais enregistrée). */
export function rateKey(action: RateAction, ip: string): string {
  return `${action}:${createHash('sha256').update(`codex-transfer:ip:${ip}`).digest('hex')}`
}

export function createMemoryStore(): TransferStore {
  const transfers = new Map<string, StoredTransfer>()
  const counters = new Map<string, number>()
  return {
    async put(id, data, expires) {
      const existing = transfers.get(id)
      if (existing && existing.expiresAt > new Date()) return false
      transfers.set(id, { data, expiresAt: expires })
      return true
    },
    async get(id, now) {
      const transfer = transfers.get(id)
      return transfer && transfer.expiresAt > now ? transfer : null
    },
    async deleteExpired(now) {
      for (const [id, transfer] of transfers) if (transfer.expiresAt <= now) transfers.delete(id)
      const current = rateWindow(now).getTime()
      for (const key of counters.keys()) if (Number(key.split('|')[1]) < current) counters.delete(key)
    },
    async hit(key, now) {
      const bucket = `${key}|${rateWindow(now).getTime()}`
      const count = (counters.get(bucket) ?? 0) + 1
      counters.set(bucket, count)
      return count
    },
  }
}

export function createNeonStore(sql: Sql): TransferStore {
  const schema = () => ensureSchema(sql)

  return {
    async put(id, data, expires) {
      await schema()
      // Un identifiant expiré peut être réutilisé ; un identifiant vivant, non
      const rows = await sql.query(
        `INSERT INTO transfers (id, data, expires_at) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at, created_at = now()
         WHERE transfers.expires_at <= now()
         RETURNING id`,
        [id, data, expires.toISOString()],
      )
      return rows.length === 1
    },
    async get(id, now) {
      await schema()
      const rows = await sql.query('SELECT data, expires_at FROM transfers WHERE id = $1 AND expires_at > $2', [id, now.toISOString()])
      const row = rows[0] as { data: string, expires_at: string | Date } | undefined
      return row ? { data: row.data, expiresAt: new Date(row.expires_at) } : null
    },
    async deleteExpired(now) {
      await schema()
      await sql.transaction([
        sql.query('DELETE FROM transfers WHERE expires_at <= $1', [now.toISOString()]),
        sql.query('DELETE FROM rate_limits WHERE window_start < $1', [rateWindow(now).toISOString()]),
      ])
    },
    async hit(key, now) {
      return hitRateLimit(sql, key, now)
    },
  }
}

let store: TransferStore | null | undefined

/**
 * Stockage selon l'environnement : Neon si `DATABASE_URL` est défini (injecté par l'intégration
 * Vercel), mémoire en local et pour les tests e2e. En production sans base : null (réponse 503),
 * jamais de repli silencieux sur la mémoire, propre à chaque instance de fonction.
 */
export function useTransferStore(): TransferStore | null {
  if (store !== undefined) return store
  const sql = useSql()
  if (sql) store = createNeonStore(sql)
  else if (process.env.VERCEL) store = null
  else store = createMemoryStore()
  return store
}
