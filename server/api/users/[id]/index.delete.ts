import { isUserId } from '../../../utils/accountRules'
import { requireAccountStore, requireMaster } from '../../../utils/session'

/** Suppression d'un compte joueur (master) ; le compte master ne peut pas se supprimer lui-même. */
export default defineEventHandler(async (event) => {
  const store = requireAccountStore()
  const { user: master } = await requireMaster(event, store)
  const id = getRouterParam(event, 'id') ?? ''
  if (!isUserId(id)) throw createError({ statusCode: 404, statusMessage: 'Compte introuvable' })
  if (id === master.id) throw createError({ statusCode: 400, statusMessage: 'Impossible de supprimer son propre compte' })
  if (!(await store.deleteUser(id))) throw createError({ statusCode: 404, statusMessage: 'Compte introuvable' })
  return { ok: true }
})
