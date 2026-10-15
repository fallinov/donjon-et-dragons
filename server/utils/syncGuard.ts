import type { H3Event } from 'h3'
import { useSyncStore, type SyncStore } from './syncStore'

/** Fiches synchronisées disponibles, sinon 503 (base non configurée en production). */
export function requireSyncStore(event?: H3Event): SyncStore {
  const store = useSyncStore(event)
  if (!store) throw createError({ statusCode: 503, statusMessage: 'Synchronisation indisponible' })
  return store
}
