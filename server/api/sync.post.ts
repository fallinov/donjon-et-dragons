import type { SyncResult } from '~~/shared/types/sync'
import { applyChange } from '../utils/syncApply'
import { readChanges, SYNC_PUSH_LIMIT } from '../utils/syncRules'
import { requireSyncStore } from '../utils/syncGuard'
import { enforceAccountLimit, requireAccountStore, requireSession } from '../utils/session'

/**
 * Modifications d'un appareil `{ changes: [{ id, part, data, changedAt }] }` → `{ results }`.
 * Chaque modification est traitée seule, dans l'ordre (la fiche avant son état et son sac) :
 * un refus n'empêche pas les suivantes. La dernière modification gagne, partie par partie.
 */
export default defineEventHandler(async (event) => {
  const accounts = requireAccountStore(event)
  const { user } = await requireSession(event, accounts)
  await enforceAccountLimit(accounts, 'sync', user.id, SYNC_PUSH_LIMIT)
  const store = requireSyncStore(event)
  const changes = readChanges(await readBody(event))
  if (!changes) throw createError({ statusCode: 400, statusMessage: 'Modifications invalides' })
  const now = new Date()
  const results: SyncResult[] = []
  for (const change of changes) {
    results.push({ id: change.id, part: change.part, status: await applyChange(store, user, change, now) })
  }
  return { results }
})
