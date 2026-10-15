import type { H3Event } from 'h3'
import type { SyncPart, SyncRow } from '~~/shared/types/sync'
import { ensureSchema, useSql, type Sql } from './database'
import { e2eTenant, tenantStore } from './e2eTenant'
import type { PortraitData } from './syncRules'

/** Fiche stockée : comme `SyncRow`, avec des dates. */
export interface CharacterRecord {
  id: string
  ownerId: string | null
  sheet: unknown | null
  sheetAt: Date | null
  state: unknown | null
  stateAt: Date | null
  inventory: unknown | null
  inventoryAt: Date | null
  portraitHash: string | null
  deletedAt: Date | null
  rev: number
}

/**
 * Stockage des fiches synchronisées. Chaque écriture est conditionnelle : elle n'a lieu que si
 * sa date est plus récente que celle de la partie stockée (et que la suppression éventuelle) ;
 * sinon `false` (modification périmée). Chaque écriture fait avancer `rev`.
 */
export interface SyncStore {
  get: (id: string) => Promise<CharacterRecord | null>
  /** Crée une fiche vide pour son propriétaire ; false si l'identifiant existe déjà. */
  create: (id: string, ownerId: string) => Promise<boolean>
  /** Fiche et portrait ; ramène une fiche supprimée plus anciennement. */
  writeSheet: (id: string, sheet: unknown, portrait: PortraitData, changedAt: Date, userId: string) => Promise<boolean>
  writePart: (id: string, part: Exclude<SyncPart, 'sheet'>, data: unknown, changedAt: Date, userId: string) => Promise<boolean>
  /** Suppression (fiche, état, sac et portrait effacés, la ligne reste pour les autres appareils). */
  remove: (id: string, changedAt: Date, userId: string) => Promise<boolean>
  /** Fiches modifiées après `since`, dans l'ordre de `rev`. */
  listSince: (since: number, limit: number) => Promise<CharacterRecord[]>
  getPortrait: (id: string) => Promise<PortraitData | null>
  /** Attribue une fiche (null : fiche du groupe, masters seulement) ; false si elle n'existe pas. */
  setOwner: (id: string, ownerId: string | null) => Promise<boolean>
  /** Compte supprimé : ses fiches reviennent au groupe. */
  releaseOwner: (ownerId: string) => Promise<void>
  /** Fiches non supprimées d'un compte (limite par joueur). */
  countOwned: (ownerId: string) => Promise<number>
}

export function toSyncRow(record: CharacterRecord): SyncRow {
  const iso = (date: Date | null) => date?.toISOString() ?? null
  return {
    id: record.id,
    ownerId: record.ownerId,
    sheet: record.sheet,
    sheetAt: iso(record.sheetAt),
    state: record.state,
    stateAt: iso(record.stateAt),
    inventory: record.inventory,
    inventoryAt: iso(record.inventoryAt),
    portraitHash: record.portraitHash,
    deletedAt: iso(record.deletedAt),
    rev: record.rev,
  }
}

const older = (stored: Date | null, changedAt: Date) => stored === null || stored < changedAt

export function createMemorySyncStore(): SyncStore {
  const rows = new Map<string, CharacterRecord>()
  const portraits = new Map<string, PortraitData>()
  let rev = 0
  const touch = (record: CharacterRecord) => {
    record.rev = ++rev
    rows.set(record.id, record)
  }
  return {
    async get(id) {
      const record = rows.get(id)
      return record ? { ...record } : null
    },
    async create(id, ownerId) {
      if (rows.has(id)) return false
      touch({ id, ownerId, sheet: null, sheetAt: null, state: null, stateAt: null, inventory: null, inventoryAt: null, portraitHash: null, deletedAt: null, rev: 0 })
      return true
    },
    async writeSheet(id, sheet, portrait, changedAt) {
      const record = rows.get(id)
      if (!record || !older(record.sheetAt, changedAt) || !older(record.deletedAt, changedAt)) return false
      portraits.set(id, portrait)
      touch({ ...record, sheet, sheetAt: changedAt, portraitHash: portrait.hash, deletedAt: null })
      return true
    },
    async writePart(id, part, data, changedAt) {
      const record = rows.get(id)
      const at = part === 'state' ? record?.stateAt : record?.inventoryAt
      if (!record || record.deletedAt || !older(at ?? null, changedAt)) return false
      touch(part === 'state' ? { ...record, state: data, stateAt: changedAt } : { ...record, inventory: data, inventoryAt: changedAt })
      return true
    },
    async remove(id, changedAt) {
      const record = rows.get(id)
      if (!record || !older(record.sheetAt, changedAt) || !older(record.deletedAt, changedAt)) return false
      portraits.delete(id)
      touch({ ...record, sheet: null, state: null, stateAt: null, inventory: null, inventoryAt: null, portraitHash: null, deletedAt: changedAt })
      return true
    },
    async listSince(since, limit) {
      return [...rows.values()].filter(r => r.rev > since).sort((a, b) => a.rev - b.rev).slice(0, limit).map(r => ({ ...r }))
    },
    async getPortrait(id) {
      return portraits.get(id) ?? null
    },
    async setOwner(id, ownerId) {
      const record = rows.get(id)
      if (!record) return false
      touch({ ...record, ownerId })
      return true
    },
    async releaseOwner(ownerId) {
      for (const record of rows.values()) if (record.ownerId === ownerId) touch({ ...record, ownerId: null })
    },
    async countOwned(ownerId) {
      return [...rows.values()].filter(r => r.ownerId === ownerId && !r.deletedAt).length
    },
  }
}

interface CharacterRow {
  id: string
  owner_id: string | null
  sheet: unknown | null
  sheet_at: string | Date | null
  state: unknown | null
  state_at: string | Date | null
  inventory: unknown | null
  inventory_at: string | Date | null
  portrait_hash: string | null
  deleted_at: string | Date | null
  rev: string | number
}

const COLUMNS = 'id, owner_id, sheet, sheet_at, state, state_at, inventory, inventory_at, portrait_hash, deleted_at, rev'
const date = (value: string | Date | null) => value === null ? null : new Date(value)

const fromRow = (row: CharacterRow): CharacterRecord => ({
  id: row.id,
  ownerId: row.owner_id,
  sheet: row.sheet,
  sheetAt: date(row.sheet_at),
  state: row.state,
  stateAt: date(row.state_at),
  inventory: row.inventory,
  inventoryAt: date(row.inventory_at),
  portraitHash: row.portrait_hash,
  deletedAt: date(row.deleted_at),
  rev: Number(row.rev),
})

export function createNeonSyncStore(sql: Sql): SyncStore {
  const schema = () => ensureSchema(sql)
  const changed = (rows: unknown[]) => rows.length === 1
  return {
    async get(id) {
      await schema()
      const rows = await sql.query(`SELECT ${COLUMNS} FROM characters WHERE id = $1`, [id]) as CharacterRow[]
      return rows[0] ? fromRow(rows[0]) : null
    },
    async create(id, ownerId) {
      await schema()
      return changed(await sql.query('INSERT INTO characters (id, owner_id) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING id', [id, ownerId]))
    },
    async writeSheet(id, sheet, portrait, changedAt, userId) {
      await schema()
      const at = changedAt.toISOString()
      const [rows] = await sql.transaction([
        sql.query(
          `UPDATE characters SET sheet = $2::jsonb, sheet_at = $3, portrait_hash = $4, deleted_at = NULL,
             updated_by = $5, rev = nextval('character_rev')
           WHERE id = $1 AND (sheet_at IS NULL OR sheet_at < $3) AND (deleted_at IS NULL OR deleted_at < $3)
           RETURNING id`,
          [id, JSON.stringify(sheet), at, portrait.hash, userId],
        ),
        // Portrait écrit seulement si la fiche l'a été (même condition, après la mise à jour : empreinte égale)
        sql.query(
          `INSERT INTO portraits (character_id, hash, mime, base64)
           SELECT $1, $2, $3, $4 WHERE EXISTS (SELECT 1 FROM characters WHERE id = $1 AND sheet_at = $5 AND portrait_hash = $2)
           ON CONFLICT (character_id) DO UPDATE SET hash = EXCLUDED.hash, mime = EXCLUDED.mime, base64 = EXCLUDED.base64
           WHERE portraits.hash <> EXCLUDED.hash`,
          [id, portrait.hash, portrait.mime, portrait.base64, at],
        ),
      ]) as [unknown[], unknown[]]
      return changed(rows)
    },
    async writePart(id, part, data, changedAt, userId) {
      await schema()
      // Nom de colonne choisi dans une liste fermée, jamais tiré de la requête
      const column = part === 'state' ? 'state' : 'inventory'
      return changed(await sql.query(
        `UPDATE characters SET ${column} = $2::jsonb, ${column}_at = $3, updated_by = $4, rev = nextval('character_rev')
         WHERE id = $1 AND deleted_at IS NULL AND (${column}_at IS NULL OR ${column}_at < $3)
         RETURNING id`,
        [id, JSON.stringify(data), changedAt.toISOString(), userId],
      ))
    },
    async remove(id, changedAt, userId) {
      await schema()
      const at = changedAt.toISOString()
      const [rows] = await sql.transaction([
        sql.query(
          `UPDATE characters SET sheet = NULL, state = NULL, state_at = NULL, inventory = NULL, inventory_at = NULL,
             portrait_hash = NULL, deleted_at = $2, updated_by = $3, rev = nextval('character_rev')
           WHERE id = $1 AND (sheet_at IS NULL OR sheet_at < $2) AND (deleted_at IS NULL OR deleted_at < $2)
           RETURNING id`,
          [id, at, userId],
        ),
        sql.query('DELETE FROM portraits WHERE character_id = $1 AND EXISTS (SELECT 1 FROM characters WHERE id = $1 AND deleted_at = $2)', [id, at]),
      ]) as [unknown[], unknown[]]
      return changed(rows)
    },
    async listSince(since, limit) {
      await schema()
      const rows = await sql.query(`SELECT ${COLUMNS} FROM characters WHERE rev > $1 ORDER BY rev LIMIT $2`, [since, limit]) as CharacterRow[]
      return rows.map(fromRow)
    },
    async getPortrait(id) {
      await schema()
      const rows = await sql.query('SELECT hash, mime, base64 FROM portraits WHERE character_id = $1', [id]) as PortraitData[]
      return rows[0] ?? null
    },
    async setOwner(id, ownerId) {
      await schema()
      return changed(await sql.query(`UPDATE characters SET owner_id = $2, rev = nextval('character_rev') WHERE id = $1 RETURNING id`, [id, ownerId]))
    },
    async releaseOwner(ownerId) {
      await schema()
      await sql.query(`UPDATE characters SET owner_id = NULL, rev = nextval('character_rev') WHERE owner_id = $1`, [ownerId])
    },
    async countOwned(ownerId) {
      await schema()
      const rows = await sql.query('SELECT count(*)::int AS n FROM characters WHERE owner_id = $1 AND deleted_at IS NULL', [ownerId]) as { n: number }[]
      return Number(rows[0]?.n ?? 0)
    },
  }
}

let store: SyncStore | null | undefined
const tenants = new Map<string, SyncStore>()

/** Même règle que les comptes : Neon si `DATABASE_URL`, null sur Vercel sans base (503), mémoire sinon. */
export function useSyncStore(event?: H3Event): SyncStore | null {
  const tenant = e2eTenant(event)
  if (tenant) return tenantStore(tenants, tenant, createMemorySyncStore)
  if (store !== undefined) return store
  const sql = useSql()
  if (sql) store = createNeonSyncStore(sql)
  else if (process.env.VERCEL) store = null
  else store = createMemorySyncStore()
  return store
}
