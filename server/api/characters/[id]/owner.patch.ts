import { isUserId } from '../../../utils/accountRules'
import { isCharacterId } from '../../../utils/syncRules'
import { requireSyncStore } from '../../../utils/syncGuard'
import { requireAccountStore, requireMaster } from '../../../utils/session'

/** Attribue une fiche à un compte `{ ownerId }` (null : fiche du groupe, masters seulement). Master. */
export default defineEventHandler(async (event) => {
  const accounts = requireAccountStore(event)
  await requireMaster(event, accounts)
  const id = getRouterParam(event, 'id') ?? ''
  const { ownerId } = (await readBody(event) ?? {}) as { ownerId?: unknown }
  if (!isCharacterId(id)) throw createError({ statusCode: 404, statusMessage: 'Fiche introuvable' })
  if (ownerId !== null && !(isUserId(ownerId) && await accounts.getUser(ownerId))) {
    throw createError({ statusCode: 400, statusMessage: 'Compte inconnu' })
  }
  if (!(await requireSyncStore(event).setOwner(id, ownerId))) throw createError({ statusCode: 404, statusMessage: 'Fiche introuvable' })
  return { ok: true }
})
