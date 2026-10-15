import { isValidPassword, PASSWORD_INPUT_MAX } from '../../utils/accountRules'
import { hashPassword, verifyPassword } from '../../utils/password'
import { enforcePasswordLimit, publicUser, requireAccountStore, requireSession } from '../../utils/session'

/** Changement de mot de passe `{ current, next }` ; ferme les autres sessions du compte. */
export default defineEventHandler(async (event) => {
  const store = requireAccountStore(event)
  const { user, tokenHash } = await requireSession(event, store, { allowMustChange: true })
  const { current, next } = (await readBody(event) ?? {}) as Record<string, unknown>
  await enforcePasswordLimit(store, user.id)
  if (typeof current !== 'string' || current.length > PASSWORD_INPUT_MAX || !(await verifyPassword(current, user.passwordHash))) {
    throw createError({ statusCode: 403, statusMessage: 'Mot de passe actuel incorrect' })
  }
  if (!isValidPassword(next)) throw createError({ statusCode: 400, statusMessage: 'Mot de passe trop court' })
  if (next === current) throw createError({ statusCode: 400, statusMessage: 'Mot de passe inchangé' })
  await store.setPassword(user.id, await hashPassword(next), false)
  await store.deleteSessions(user.id, tokenHash)
  return { user: publicUser({ ...user, mustChangePassword: false }) }
})
