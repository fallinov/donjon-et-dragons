import { SYNC_PAGE_SIZE } from '../utils/syncRules'
import { toSyncRow } from '../utils/syncStore'
import { requireSyncStore } from '../utils/syncGuard'
import { requireAccountStore, requireSession } from '../utils/session'

/**
 * Fiches modifiées depuis le curseur `since` (0 : toutes), par pages : `{ rows, cursor, more }`.
 * Tout compte connecté lit toutes les fiches (lecture seule pour celles des autres).
 */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  await requireSession(event, requireAccountStore())
  const store = requireSyncStore()
  const since = Number(getQuery(event).since ?? 0)
  if (!Number.isSafeInteger(since) || since < 0) throw createError({ statusCode: 400, statusMessage: 'Curseur invalide' })
  const records = await store.listSince(since, SYNC_PAGE_SIZE)
  return {
    rows: records.map(toSyncRow),
    cursor: records.at(-1)?.rev ?? since,
    more: records.length === SYNC_PAGE_SIZE,
  }
})
