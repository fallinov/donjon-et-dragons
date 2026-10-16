import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { rateWindow } from './rateLimit'

export type Sql = NeonQueryFunction<false, false>

/**
 * Migrations du schéma, dans l'ordre : la version N est l'élément N - 1. Ne jamais modifier une
 * migration publiée, en ajouter une nouvelle. Chaque instruction doit pouvoir être rejouée
 * (IF NOT EXISTS) : deux fonctions démarrées en même temps peuvent appliquer la même version.
 */
export const MIGRATIONS: readonly (readonly string[])[] = [
  // 1. Relais de transfert (tables créées avant l'existence des migrations ; `transfers` supprimée en 4)
  [
    `CREATE TABLE IF NOT EXISTS transfers (
      id text PRIMARY KEY,
      data text NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS rate_limits (
      key text NOT NULL,
      window_start timestamptz NOT NULL,
      count integer NOT NULL,
      PRIMARY KEY (key, window_start)
    )`,
  ],
  // 2. Comptes et sessions
  [
    `CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY,
      username text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      role text NOT NULL CHECK (role IN ('master', 'player')),
      must_change_password boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      token_hash text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL,
      last_seen_at timestamptz NOT NULL DEFAULT now()
    )`,
    'CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions (user_id)',
  ],
  // 3. Fiches synchronisées : une ligne par fiche, trois parties datées (fiche, état de jeu, sac),
  // portrait à part ; `rev` croissant sert de curseur de synchronisation
  [
    'CREATE SEQUENCE IF NOT EXISTS character_rev',
    `CREATE TABLE IF NOT EXISTS characters (
      id text PRIMARY KEY,
      owner_id uuid REFERENCES users (id) ON DELETE SET NULL,
      sheet jsonb,
      sheet_at timestamptz,
      state jsonb,
      state_at timestamptz,
      inventory jsonb,
      inventory_at timestamptz,
      portrait_hash text,
      deleted_at timestamptz,
      updated_by uuid,
      rev bigint NOT NULL DEFAULT nextval('character_rev')
    )`,
    'CREATE INDEX IF NOT EXISTS characters_rev ON characters (rev)',
    `CREATE TABLE IF NOT EXISTS portraits (
      character_id text PRIMARY KEY REFERENCES characters (id) ON DELETE CASCADE,
      hash text NOT NULL,
      mime text NOT NULL,
      base64 text NOT NULL
    )`,
  ],  // 4. Transfert par code retiré (la synchronisation le remplace, #56)
  ['DROP TABLE IF EXISTS transfers'],
]

/** Verrou pris pendant chaque migration : une seule fonction à la fois modifie le schéma. */
const MIGRATION_LOCK = 4_247_001

async function runMigrations(sql: Sql): Promise<void> {
  await sql.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version integer PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`)
  const rows = await sql.query('SELECT version FROM schema_migrations') as { version: number }[]
  const applied = new Set(rows.map(row => Number(row.version)))
  for (const [index, statements] of MIGRATIONS.entries()) {
    const version = index + 1
    if (applied.has(version)) continue
    await sql.transaction([
      sql.query('SELECT pg_advisory_xact_lock($1)', [MIGRATION_LOCK]),
      ...statements.map(statement => sql.query(statement)),
      sql.query('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING', [version]),
    ])
  }
}

const schemas = new WeakMap<Sql, Promise<void>>()

/** Schéma à jour, une seule fois par instance de fonction (nouvel essai après un échec). */
export function ensureSchema(sql: Sql): Promise<void> {
  let ready = schemas.get(sql)
  if (!ready) {
    ready = runMigrations(sql).catch((error: unknown) => {
      schemas.delete(sql)
      throw error
    })
    schemas.set(sql, ready)
  }
  return ready
}

let client: Sql | undefined

/** Client Neon partagé, ou null sans `DATABASE_URL` (variable injectée par Vercel, jamais lue ailleurs). */
export function useSql(): Sql | null {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) return null
  return client ??= neon(databaseUrl)
}

/** Incrémente un compteur de limitation (fenêtre d'une heure) et renvoie sa nouvelle valeur. */
export async function hitRateLimit(sql: Sql, key: string, now: Date): Promise<number> {
  await ensureSchema(sql)
  const rows = await sql.query(
    `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, $2, 1)
     ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
     RETURNING count`,
    [key, rateWindow(now).toISOString()],
  )
  return Number((rows[0] as { count: number }).count)
}
