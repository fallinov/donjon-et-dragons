import { isUserId } from '../../../utils/accountRules'
import { useSyncStore } from '../../../utils/syncStore'
import { requireAccountStore, requireMaster } from '../../../utils/session'

/**
 * Suppression d'un autre compte, joueur ou master (master) ; ses fiches reviennent au groupe. Un master ne peut pas se supprimer
 * lui-même : le groupe garde donc toujours au moins un master.
 */
export default defineEventHandler(async (event) => {
  const store = requireAccountStore(event)
  const { user: master } = await requireMaster(event, store)
  const id = getRouterParam(event, 'id') ?? ''
  if (!isUserId(id)) throw createError({ statusCode: 404, statusMessage: 'Compte introuvable' })
  if (id === master.id) throw createError({ statusCode: 400, statusMessage: 'Impossible de supprimer son propre compte' })
  if (!(await store.getUser(id))) throw createError({ statusCode: 404, statusMessage: 'Compte introuvable' })
  // Ses fiches reviennent au groupe (masters), avant que le compte disparaisse
  await useSyncStore(event)?.releaseOwner(id)
  if (!(await store.deleteUser(id))) throw createError({ statusCode: 404, statusMessage: 'Compte introuvable' })
  return { ok: true }
})
