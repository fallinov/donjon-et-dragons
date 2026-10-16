// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { createNeonAccountStore } from '~~/server/utils/accountStore'
import { ensureSchema, MIGRATIONS } from '~~/server/utils/database'
import { createTestSql } from '../../helpers/pgliteSql'

// Vraies requêtes SQL des stores Neon, exécutées sur PGlite (Postgres embarqué)
let db: PGlite | undefined
afterEach(async () => {
  await db?.close()
  db = undefined
})

async function setup() {
  const test = await createTestSql()
  db = test.db
  return test.sql
}

const player = (username: string) => ({ username, passwordHash: 'h', role: 'player' as const, mustChangePassword: true })

describe('migrations sur Postgres', () => {
  it('appliquées une fois, rejouables sans erreur', async () => {
    const sql = await setup()
    await ensureSchema(sql)
    const versions = await sql.query('SELECT version FROM schema_migrations ORDER BY version') as { version: number }[]
    expect(versions.map(v => v.version)).toEqual(MIGRATIONS.map((_, i) => i + 1))
    // Base existante créée avant les migrations (tables du relais déjà là) : rejouer ne casse rien
    await sql.query('DELETE FROM schema_migrations')
    const again = await createTestSql()
    await db!.close()
    db = again.db
    await again.sql.query('CREATE TABLE transfers (id text PRIMARY KEY, data text NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now())')
    await ensureSchema(again.sql)
    expect((await again.sql.query('SELECT count(*)::int AS n FROM schema_migrations') as { n: number }[])[0]!.n).toBe(MIGRATIONS.length)
  })
})

describe('comptes sur Postgres', () => {
  it('premier master unique, identifiant unique, liste', async () => {
    const store = createNeonAccountStore(await setup())
    expect(await store.hasUsers()).toBe(false)
    expect(await store.createFirstMaster({ username: 'steve', passwordHash: 'h' })).toMatchObject({ username: 'steve', role: 'master' })
    expect(await store.createFirstMaster({ username: 'autre', passwordHash: 'h' })).toBeNull()
    expect(await store.createUser(player('myriam'))).toMatchObject({ username: 'myriam', role: 'player', mustChangePassword: true })
    expect(await store.createUser(player('myriam'))).toBeNull()
    expect((await store.listUsers()).map(u => u.username)).toEqual(['steve', 'myriam'])
  })

  it('renommer sans changer le rôle, y compris le seul master', async () => {
    const store = createNeonAccountStore(await setup())
    const steve = (await store.createFirstMaster({ username: 'mj', passwordHash: 'h' }))!
    await store.createUser(player('juan'))
    expect(await store.updateUser(steve.id, { username: 'steve' })).toMatchObject({ username: 'steve', role: 'master' })
    expect(await store.updateUser(steve.id, { username: 'juan' })).toBe('taken')
    expect(await store.updateUser('00000000-0000-4000-8000-000000000000', { username: 'x' })).toBeNull()
  })

  it('le groupe garde toujours au moins un master', async () => {
    const store = createNeonAccountStore(await setup())
    const steve = (await store.createFirstMaster({ username: 'steve', passwordHash: 'h' }))!
    const myriam = (await store.createUser(player('myriam')))!
    expect(await store.updateUser(steve.id, { role: 'player' })).toBe('lastMaster')
    expect(await store.updateUser(myriam.id, { role: 'master' })).toMatchObject({ role: 'master' })
    expect(await store.updateUser(steve.id, { role: 'player' })).toMatchObject({ role: 'player' })
    expect(await store.updateUser(myriam.id, { role: 'player' })).toBe('lastMaster')
  })

  it('sessions : expiration, prolongation, autres sessions fermées, cascade à la suppression', async () => {
    const store = createNeonAccountStore(await setup())
    const user = (await store.createUser(player('sandra')))!
    const now = new Date('2026-10-15T10:00:00Z')
    const later = new Date(now.getTime() + 1000)
    await store.createSession('a', user.id, later)
    await store.createSession('b', user.id, later)
    expect((await store.findSession('a', now))?.user.username).toBe('sandra')
    expect(await store.findSession('a', later)).toBeNull()
    await store.extendSession('a', new Date(now.getTime() + 5000), now)
    expect(await store.findSession('a', later)).not.toBeNull()
    await store.deleteSessions(user.id, 'a')
    expect(await store.findSession('b', now)).toBeNull()
    await store.deleteSessions(user.id)
    expect(await store.findSession('a', now)).toBeNull()

    await store.createSession('c', user.id, later)
    expect(await store.setPassword(user.id, 'h2', false)).toBe(true)
    expect(await store.getUser(user.id)).toMatchObject({ passwordHash: 'h2', mustChangePassword: false })
    expect(await store.deleteUser(user.id)).toBe(true)
    expect(await store.findSession('c', now)).toBeNull()
    expect(await store.deleteUser(user.id)).toBe(false)
  })

  it('compteurs de limitation par heure, purgés avec les sessions expirées', async () => {
    const store = createNeonAccountStore(await setup())
    const now = new Date('2026-10-15T10:20:00Z')
    expect(await store.hit('k', now)).toBe(1)
    expect(await store.hit('k', now)).toBe(2)
    expect(await store.hit('k', new Date('2026-10-15T11:00:00Z'))).toBe(1)
    await store.deleteExpired(new Date('2026-10-15T11:30:00Z'))
    expect(await store.hit('k', now)).toBe(1)
  })

  it('migration 4 : la table du transfert par code est supprimée', async () => {
    const sql = await setup()
    await ensureSchema(sql)
    const tables = await sql.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`) as { table_name: string }[]
    expect(tables.map(t => t.table_name)).not.toContain('transfers')
    expect(tables.map(t => t.table_name)).toEqual(expect.arrayContaining(['users', 'sessions', 'characters', 'portraits', 'rate_limits']))
  })
})
