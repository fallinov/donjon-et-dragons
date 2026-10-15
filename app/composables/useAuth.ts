import type { AccountSummary, PublicUser, Role } from '~~/shared/types/account'
import type { MessageKey } from '~/composables/useT'
import { resetPersistedStates } from '~/composables/persistState'
import { stopSync } from '~/composables/useSync'
import { clearLocalData, getMeta, getSessionCache, setSessionCache } from '~/db/syncRepository'

export type AuthResult<T = undefined> = { ok: true, value: T } | { ok: false, error: MessageKey, status?: number }

const fail = (error: MessageKey, status?: number) => ({ ok: false as const, error, status })

/** Erreurs HTTP communes aux comptes ; les cas propres à une route sont traités par l'appelant. */
function httpError(status: number): MessageKey {
  if (status === 401) return 'auth.error.invalid'
  if (status === 429) return 'auth.error.tooMany'
  if (status === 503) return 'auth.error.unavailable'
  return 'auth.error.failed'
}

/** Appel JSON à l'API des comptes (cookie de session envoyé par le navigateur). */
export async function callApi<T>(path: string, method = 'GET', body?: unknown): Promise<AuthResult<T>> {
  let response: Response
  try {
    response = await fetch(path, {
      method,
      cache: 'no-store',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  }
  catch {
    return fail('auth.error.offline')
  }
  if (!response.ok) return fail(httpError(response.status), response.status)
  try {
    return { ok: true, value: await response.json() as T }
  }
  catch {
    return fail('auth.error.failed', response.status)
  }
}

/**
 * Compte connecté : `undefined` tant qu'il n'est pas connu, `null` sans session. Le compte est gardé
 * sur l'appareil : l'app s'ouvre hors ligne avec le dernier compte connu, puis le serveur confirme.
 */
export function useAuth() {
  const user = useState<PublicUser | null | undefined>('auth:user', () => undefined)
  const loading = useState<Promise<void> | null>('auth:loading', () => null)

  async function remember(value: PublicUser | null): Promise<void> {
    user.value = value
    await setSessionCache(value).catch(console.error)
  }

  /** Demande le compte au serveur ; hors ligne, le compte gardé sur l'appareil reste valable. */
  async function fetchUser(): Promise<void> {
    const result = await callApi<{ user: PublicUser | null }>('/api/auth/me')
    if (result.ok) await remember(result.value.user)
    else if (user.value === undefined) user.value = null
  }

  /** Charge le compte une seule fois (appels simultanés regroupés) : d'abord l'appareil, puis le serveur. */
  function ensureUser(): Promise<void> {
    if (user.value !== undefined) return Promise.resolve()
    return loading.value ??= (async () => {
      const cached = await getSessionCache().catch(() => undefined)
      if (cached) {
        user.value = cached
        void fetchUser()
      }
      else {
        await fetchUser()
      }
    })().finally(() => { loading.value = null })
  }

  /** Efface les fiches de l'appareil et les états en mémoire (autre compte, déconnexion). */
  async function forgetDevice(): Promise<void> {
    // Une synchronisation en cours réécrirait les fiches après l'effacement
    await stopSync()
    await clearLocalData()
    resetPersistedStates()
    clearNuxtState(key => key.startsWith('character-state:') || key.startsWith('inventory:'))
  }

  async function login(username: string, password: string): Promise<AuthResult<PublicUser>> {
    const result = await callApi<{ user: PublicUser }>('/api/auth/login', 'POST', { username, password })
    if (!result.ok) return result
    // Fiches d'un autre compte encore sur l'appareil (session expirée sans déconnexion) : elles partent
    const previous = await getMeta('sync').catch(() => undefined)
    if (previous && previous.userId !== result.value.user.id) await forgetDevice()
    await remember(result.value.user)
    return { ok: true, value: result.value.user }
  }

  /**
   * Déconnexion : la session est fermée sur le serveur, puis les fiches de l'appareil sont effacées
   * (un appareil peut être partagé). Hors ligne, rien n'est effacé : la session resterait ouverte.
   */
  async function logout(): Promise<AuthResult> {
    const result = await callApi('/api/auth/logout', 'POST', {})
    if (!result.ok) return result
    await forgetDevice()
    user.value = null
    return { ok: true, value: undefined }
  }

  async function changePassword(current: string, next: string): Promise<AuthResult<PublicUser>> {
    const result = await callApi<{ user: PublicUser }>('/api/auth/password', 'POST', { current, next })
    if (!result.ok) {
      if (result.status === 403) return fail('auth.error.currentWrong', 403)
      if (result.status === 400) return fail(next === current ? 'auth.error.unchanged' : 'auth.error.tooShort', 400)
      if (result.status === 401) await remember(null)
      return result
    }
    await remember(result.value.user)
    return { ok: true, value: result.value.user }
  }

  async function setupStatus(): Promise<AuthResult<{ needed: boolean, codeRequired: boolean }>> {
    return callApi('/api/setup')
  }

  async function setup(setupCode: string, username: string, password: string): Promise<AuthResult<PublicUser>> {
    const result = await callApi<{ user: PublicUser }>('/api/setup', 'POST', { setupCode, username, password })
    if (!result.ok) {
      if (result.status === 403) return fail('auth.error.setupCode', 403)
      if (result.status === 409) return fail('auth.setup.done', 409)
      if (result.status === 400) return fail('auth.error.username', 400)
      return result
    }
    await remember(result.value.user)
    return { ok: true, value: result.value.user }
  }

  return { user, ensureUser, fetchUser, remember, login, logout, changePassword, setupStatus, setup }
}

/** Gestion des comptes par le master. */
export const accountsApi = {
  list: () => callApi<{ users: AccountSummary[] }>('/api/users'),
  async create(username: string): Promise<AuthResult<{ user: PublicUser, password: string }>> {
    const result = await callApi<{ user: PublicUser, password: string }>('/api/users', 'POST', { username })
    if (!result.ok && result.status === 409) return fail('accounts.error.taken', 409)
    if (!result.ok && result.status === 400) return fail('auth.error.username', 400)
    return result
  },
  resetPassword: (id: string) => callApi<{ password: string }>(`/api/users/${encodeURIComponent(id)}/reset-password`, 'POST', {}),
  async update(id: string, changes: { username?: string, role?: Role }): Promise<AuthResult<{ user: PublicUser }>> {
    const result = await callApi<{ user: PublicUser }>(`/api/users/${encodeURIComponent(id)}`, 'PATCH', changes)
    if (!result.ok && result.status === 409) return fail('accounts.error.taken', 409)
    if (!result.ok && result.status === 422) return fail('accounts.error.lastMaster', 422)
    if (!result.ok && result.status === 400) return fail('auth.error.username', 400)
    return result
  },
  remove: (id: string) => callApi<{ ok: true }>(`/api/users/${encodeURIComponent(id)}`, 'DELETE'),
}
