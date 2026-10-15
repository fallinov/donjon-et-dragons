import type { AccountSummary, PublicUser } from '~~/shared/types/account'
import type { MessageKey } from '~/composables/useT'

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

/** Compte connecté : `undefined` tant qu'il n'est pas connu, `null` sans session (ou hors ligne). */
export function useAuth() {
  const user = useState<PublicUser | null | undefined>('auth:user', () => undefined)
  const loading = useState<Promise<void> | null>('auth:loading', () => null)

  async function fetchUser(): Promise<void> {
    const result = await callApi<{ user: PublicUser | null }>('/api/auth/me')
    user.value = result.ok ? result.value.user : null
  }

  /** Charge le compte une seule fois (appels simultanés regroupés). */
  function ensureUser(): Promise<void> {
    if (user.value !== undefined) return Promise.resolve()
    return loading.value ??= fetchUser().finally(() => { loading.value = null })
  }

  async function login(username: string, password: string): Promise<AuthResult<PublicUser>> {
    const result = await callApi<{ user: PublicUser }>('/api/auth/login', 'POST', { username, password })
    if (!result.ok) return result
    user.value = result.value.user
    return { ok: true, value: result.value.user }
  }

  async function logout(): Promise<void> {
    await callApi('/api/auth/logout', 'POST', {})
    user.value = null
  }

  async function changePassword(current: string, next: string): Promise<AuthResult<PublicUser>> {
    const result = await callApi<{ user: PublicUser }>('/api/auth/password', 'POST', { current, next })
    if (!result.ok) {
      if (result.status === 403) return fail('auth.error.currentWrong', 403)
      if (result.status === 400) return fail(next === current ? 'auth.error.unchanged' : 'auth.error.tooShort', 400)
      if (result.status === 401) user.value = null
      return result
    }
    user.value = result.value.user
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
    user.value = result.value.user
    return { ok: true, value: result.value.user }
  }

  return { user, ensureUser, fetchUser, login, logout, changePassword, setupStatus, setup }
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
  remove: (id: string) => callApi<{ ok: true }>(`/api/users/${encodeURIComponent(id)}`, 'DELETE'),
}
