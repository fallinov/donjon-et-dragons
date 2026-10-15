import { useSyncStore, type SyncStore } from './syncStore'

/** Fiches synchronisées disponibles, sinon 503 (base non configurée en production). */
export function requireSyncStore(): SyncStore {
  const store = useSyncStore()
  if (!store) throw createError({ statusCode: 503, statusMessage: 'Synchronisation indisponible' })
  return store
}
