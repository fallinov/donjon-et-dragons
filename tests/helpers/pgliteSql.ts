import { PGlite } from '@electric-sql/pglite'
import type { Sql } from '~~/server/utils/database'

interface PendingQuery extends PromiseLike<unknown[]> {
  text: string
  params: unknown[]
}

/**
 * Client Neon simulé sur PGlite (Postgres embarqué) : mêmes `query(text, params)` et
 * `transaction([...])`, pour exécuter les vraies requêtes SQL des stores dans les tests unitaires.
 */
export async function createTestSql(): Promise<{ sql: Sql, db: PGlite }> {
  const db = await PGlite.create()
  const run = async (text: string, params: unknown[]) => (await db.query(text, params)).rows
  const query = (text: string, params: unknown[] = []): PendingQuery => ({
    text,
    params,
    then: (resolve, reject) => run(text, params).then(resolve, reject),
  })
  const transaction = (queries: PendingQuery[]) => db.transaction(async (tx) => {
    const results: unknown[][] = []
    for (const q of queries) results.push((await tx.query(q.text, q.params)).rows)
    return results
  })
  return { sql: { query, transaction } as unknown as Sql, db }
}
