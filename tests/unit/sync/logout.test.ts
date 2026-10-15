import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PublicUser } from '~~/shared/types/account'
import { useAuth } from '~/composables/useAuth'
import { startSync, stopSync, syncNow } from '~/composables/useSync'

const master: PublicUser = { id: '00000000-0000-4000-8000-000000000001', username: 'mj', role: 'master', mustChangePassword: false }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Réponse retenue jusqu'à `release` : la requête reste en cours. */
function held() {
  let release!: (response: Response) => void
  const response = new Promise<Response>((resolve) => { release = resolve })
  return { response, release }
}

/**
 * Serveur simulé : la première lecture de la synchronisation et la déconnexion restent en cours
 * jusqu'à leur libération ; après la déconnexion reçue, la synchronisation est refusée (401).
 */
function fakeServer() {
  const firstPull = held()
  const logout = held()
  const requests: string[] = []
  let signedOut = false
  const fetchMock: typeof fetch = async (input, init) => {
    const url = new URL(String(input), 'http://localhost')
    const request = `${init?.method ?? 'GET'} ${url.pathname}`
    requests.push(request)
    if (request === 'POST /api/auth/logout') {
      signedOut = true
      return logout.response
    }
    if (url.pathname === '/api/sync' || url.pathname === '/api/members') {
      if (signedOut) return json({}, 401)
      if (requests.filter(r => r === 'GET /api/sync').length === 1 && url.pathname === '/api/sync') return firstPull.response
      return url.pathname === '/api/members' ? json({ members: [] }) : json({ rows: [], cursor: 0, more: false })
    }
    return json({}, 404)
  }
  return { fetchMock, requests, firstPull, logout }
}

afterEach(async () => {
  await stopSync()
  vi.unstubAllGlobals()
})

describe('déconnexion', () => {
  it('la synchronisation s\'arrête avant : aucun envoi refusé ne passe pour une session expirée', async () => {
    const server = fakeServer()
    vi.stubGlobal('fetch', server.fetchMock)
    vi.stubGlobal('clearNuxtState', () => undefined)
    const { user, logout } = useAuth()
    user.value = master
    const onUnauthorized = vi.fn()
    startSync(master, onUnauthorized)
    await vi.waitFor(() => expect(server.requests).toContain('GET /api/sync'))

    const done = logout()
    // La synchronisation en cours se termine pendant la déconnexion
    server.firstPull.release(json({ rows: [], cursor: 0, more: false }))
    await vi.waitFor(() => expect(server.requests).toContain('POST /api/auth/logout'))
    await new Promise(resolve => setTimeout(resolve, 20))
    server.logout.release(json({ ok: true }))

    expect(await done).toEqual({ ok: true, value: undefined })
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(server.requests.slice(server.requests.indexOf('POST /api/auth/logout') + 1)).toEqual([])
    expect(user.value).toBeNull()
  })

  it('déconnexion refusée (hors ligne) : la synchronisation reprend', async () => {
    const requests: string[] = []
    vi.stubGlobal('fetch', (async (input, init) => {
      const url = new URL(String(input), 'http://localhost')
      requests.push(`${init?.method ?? 'GET'} ${url.pathname}`)
      if (url.pathname === '/api/auth/logout') throw new TypeError('Failed to fetch')
      return json({ rows: [], cursor: 0, more: false })
    }) as typeof fetch)
    const { user, logout } = useAuth()
    user.value = master
    startSync(master, () => undefined)
    await vi.waitFor(() => expect(requests).toContain('GET /api/sync'))

    expect(await logout()).toMatchObject({ ok: false, error: 'auth.error.offline' })
    // Boucle toujours active : une synchronisation demandée part
    const before = requests.length
    await syncNow()
    expect(requests.slice(before)).toContain('GET /api/sync')
    expect(user.value).toEqual(master)
  })
})
