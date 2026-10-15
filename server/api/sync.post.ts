import type { SyncChange, SyncResult, SyncStatus } from '~~/shared/types/sync'
import { canWrite, isCharacterId, PLAYER_MAX_SHEETS, readChangedAt, readChanges, SYNC_PUSH_LIMIT, validatePart, validateSheet } from '../utils/syncRules'
import type { SyncStore } from '../utils/syncStore'
import { requireSyncStore } from '../utils/syncGuard'
import { enforceAccountLimit, requireAccountStore, requireSession } from '../utils/session'

interface Writer { id: string, role: 'master' | 'player' }

async function apply(store: SyncStore, user: Writer, change: SyncChange, now: Date): Promise<SyncStatus> {
  const changedAt = readChangedAt(change.changedAt, now)
  if (!isCharacterId(change.id) || !changedAt) return 'invalid'
  const record = await store.get(change.id)
  if (!canWrite(user, change.id, record ? record.ownerId : undefined)) return 'forbidden'

  if (change.part === 'sheet') {
    const valid = validateSheet(change.id, change.data)
    if (!valid) return 'invalid'
    // Nouvelle fiche : elle appartient à celui qui l'envoie (création concurrente : l'autre gagne la course, droits revérifiés)
    if (!record && user.role === 'player' && await store.countOwned(user.id) >= PLAYER_MAX_SHEETS) return 'forbidden'
    if (!record && !(await store.create(change.id, user.id))) {
      const created = await store.get(change.id)
      if (!created || !canWrite(user, change.id, created.ownerId)) return 'forbidden'
    }
    return await store.writeSheet(change.id, valid.sheet, valid.portrait, changedAt, user.id) ? 'applied' : 'stale'
  }
  if (!record) return change.part === 'delete' ? 'applied' : 'notFound'
  if (change.part === 'delete') return await store.remove(change.id, changedAt, user.id) ? 'applied' : 'stale'
  const data = validatePart(change.part, change.data)
  if (data === null) return 'invalid'
  return await store.writePart(change.id, change.part, data, changedAt, user.id) ? 'applied' : 'stale'
}

/**
 * Modifications d'un appareil `{ changes: [{ id, part, data, changedAt }] }` → `{ results }`.
 * Chaque modification est traitée seule, dans l'ordre (la fiche avant son état et son sac) :
 * un refus n'empêche pas les suivantes. La dernière modification gagne, partie par partie.
 */
export default defineEventHandler(async (event) => {
  const accounts = requireAccountStore()
  const { user } = await requireSession(event, accounts)
  await enforceAccountLimit(accounts, 'sync', user.id, SYNC_PUSH_LIMIT)
  const store = requireSyncStore()
  const changes = readChanges(await readBody(event))
  if (!changes) throw createError({ statusCode: 400, statusMessage: 'Modifications invalides' })
  const now = new Date()
  const results: SyncResult[] = []
  for (const change of changes) {
    results.push({ id: change.id, part: change.part, status: await apply(store, user, change, now) })
  }
  return { results }
})
