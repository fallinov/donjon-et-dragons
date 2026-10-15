import { generatePassword, isUserId } from '../../../utils/accountRules'
import { hashPassword } from '../../../utils/password'
import { requireAccountStore, requireMaster } from '../../../utils/session'

/** Nouveau mot de passe provisoire pour un autre compte, joueur ou master (master) ; ses sessions sont fermées. */
export default defineEventHandler(async (event) => {
  // Réponse contenant un mot de passe provisoire : jamais mise en cache
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const store = requireAccountStore()
  const { user: master } = await requireMaster(event, store)
  const id = getRouterParam(event, 'id') ?? ''
  if (!isUserId(id)) throw createError({ statusCode: 404, statusMessage: 'Compte introuvable' })
  if (id === master.id) throw createError({ statusCode: 400, statusMessage: 'Utiliser le changement de mot de passe' })
  const password = generatePassword()
  if (!(await store.getUser(id)) || !(await store.setPassword(id, await hashPassword(password), true))) {
    throw createError({ statusCode: 404, statusMessage: 'Compte introuvable' })
  }
  await store.deleteSessions(id)
  return { password }
})
