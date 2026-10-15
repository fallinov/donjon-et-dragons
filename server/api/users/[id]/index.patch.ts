import type { Role } from '~~/shared/types/account'
import { isUserId, isValidUsername, normalizeUsername } from '../../../utils/accountRules'
import { publicUser, requireAccountStore, requireMaster } from '../../../utils/session'

/**
 * Renommer un compte et/ou changer son rôle `{ username?, role? }` (master, sur tous les comptes,
 * le sien compris). Le groupe garde toujours au moins un master.
 */
export default defineEventHandler(async (event) => {
  const store = requireAccountStore(event)
  await requireMaster(event, store)
  const id = getRouterParam(event, 'id') ?? ''
  if (!isUserId(id)) throw createError({ statusCode: 404, statusMessage: 'Compte introuvable' })
  const body = (await readBody(event) ?? {}) as Record<string, unknown>
  const changes: { username?: string, role?: Role } = {}
  if (body.username !== undefined) {
    const username = typeof body.username === 'string' ? normalizeUsername(body.username) : ''
    if (!isValidUsername(username)) throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
    changes.username = username
  }
  if (body.role !== undefined) {
    if (body.role !== 'master' && body.role !== 'player') throw createError({ statusCode: 400, statusMessage: 'Rôle invalide' })
    changes.role = body.role
  }
  if (!changes.username && !changes.role) throw createError({ statusCode: 400, statusMessage: 'Aucun changement' })
  const result = await store.updateUser(id, changes)
  if (result === null) throw createError({ statusCode: 404, statusMessage: 'Compte introuvable' })
  if (result === 'taken') throw createError({ statusCode: 409, statusMessage: 'Identifiant déjà pris' })
  if (result === 'lastMaster') throw createError({ statusCode: 422, statusMessage: 'Dernier master' })
  return { user: publicUser(result) }
})
