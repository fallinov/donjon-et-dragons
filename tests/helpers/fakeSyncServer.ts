import type { PublicUser } from '~~/shared/types/account'
import type { SyncChange } from '~~/shared/types/sync'
import { applyChange } from '~~/server/utils/syncApply'
import { readChanges, SYNC_PAGE_SIZE } from '~~/server/utils/syncRules'
import { createMemorySyncStore, toSyncRow } from '~~/server/utils/syncStore'

/**
 * Serveur de synchronisation en mémoire pour les tests unitaires : mêmes règles que l'API
 * (`applyChange`, `readChanges`), stockage mémoire du serveur. `fetchAs(user)` simule l'appareil
 * de ce compte ; `offline` coupe le réseau.
 */
export function createFakeSyncServer() {
  const store = createMemorySyncStore()
  const server = {
    store,
    offline: false,
    fetchAs(user: PublicUser): typeof fetch {
      return async (input, init) => {
        if (server.offline) throw new TypeError('Failed to fetch')
        const url = new URL(String(input), 'http://localhost')
        const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
        if (url.pathname === '/api/sync' && (init?.method ?? 'GET') === 'GET') {
          const records = await store.listSince(Number(url.searchParams.get('since') ?? 0), SYNC_PAGE_SIZE)
          return json({ rows: records.map(toSyncRow), cursor: records.at(-1)?.rev ?? Number(url.searchParams.get('since') ?? 0), more: records.length === SYNC_PAGE_SIZE })
        }
        if (url.pathname === '/api/sync' && init?.method === 'POST') {
          const changes = readChanges(JSON.parse(String(init.body)))
          if (!changes) return json({}, 400)
          const results = []
          for (const change of changes as SyncChange[]) results.push({ id: change.id, part: change.part, status: await applyChange(store, user, change, new Date()) })
          return json({ results })
        }
        const portrait = url.pathname.match(/^\/api\/portraits\/(.+)$/)
        if (portrait) {
          const found = await store.getPortrait(decodeURIComponent(portrait[1]!))
          return found ? new Response(Buffer.from(found.base64, 'base64'), { headers: { 'Content-Type': found.mime } }) : json({}, 404)
        }
        return json({}, 404)
      }
    },
  }
  return server
}
