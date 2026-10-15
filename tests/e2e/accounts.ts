import { expect, type APIRequestContext } from '@playwright/test'

/** Compte master des tests (store mémoire du serveur de dev, jamais en ligne). */
export const MASTER = { username: 'mj-test', password: 'mot-de-passe-du-mj' }

/** Crée le master s'il n'existe pas encore (serveur partagé par tous les tests). */
export async function ensureMaster(request: APIRequestContext): Promise<void> {
  const status = await (await request.get('/api/setup')).json() as { needed: boolean }
  if (!status.needed) return
  const response = await request.post('/api/setup', { data: MASTER })
  expect([200, 409]).toContain(response.status())
}

export async function apiLogin(request: APIRequestContext, username: string, password: string): Promise<void> {
  const response = await request.post('/api/auth/login', { data: { username, password } })
  expect(response.status()).toBe(200)
}

/** Identifiant unique : les deux navigateurs testés partagent le même serveur. */
export const uniqueName = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`

/** Joueur créé par le master (contexte de requête du master), avec son mot de passe provisoire. */
export async function createPlayer(master: APIRequestContext, prefix = 'joueur'): Promise<{ id: string, username: string, password: string }> {
  const response = await master.post('/api/users', { data: { username: uniqueName(prefix) } })
  expect(response.status()).toBe(200)
  const { user, password } = await response.json() as { user: { id: string, username: string }, password: string }
  return { id: user.id, username: user.username, password }
}
