import { isValidPassword, isValidUsername, readCredentials } from '../utils/accountRules'
import { hashPassword } from '../utils/password'
import { checkSetupCode, enforceSetupLimit, publicUser, requireAccountStore, startSession } from '../utils/session'

/** Premier compte master `{ setupCode, username, password }`, seulement si aucun compte n'existe. */
export default defineEventHandler(async (event) => {
  const store = requireAccountStore()
  await enforceSetupLimit(event, store)
  const body = await readBody(event)
  if (!checkSetupCode((body as { setupCode?: unknown } | null)?.setupCode)) {
    throw createError({ statusCode: 403, statusMessage: 'Code d\'installation incorrect' })
  }
  const credentials = readCredentials(body)
  if (!credentials.ok || !isValidUsername(credentials.username)) throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  if (!isValidPassword(credentials.password)) throw createError({ statusCode: 400, statusMessage: 'Mot de passe trop court' })
  const user = await store.createFirstMaster({ username: credentials.username, passwordHash: await hashPassword(credentials.password) })
  if (!user) throw createError({ statusCode: 409, statusMessage: 'Installation déjà faite' })
  await startSession(event, store, user)
  return { user: publicUser(user) }
})
