import { readCredentials } from '../../utils/accountRules'
import { verifyDummy, verifyPassword } from '../../utils/password'
import { endSession, enforceLoginLimit, publicUser, requireAccountStore, startSession } from '../../utils/session'

/** Connexion `{ username, password }` ; même réponse que l'identifiant existe ou non. */
export default defineEventHandler(async (event) => {
  const store = requireAccountStore()
  const credentials = readCredentials(await readBody(event))
  if (!credentials.ok) throw createError({ statusCode: 400, statusMessage: 'Identifiant ou mot de passe manquant' })
  await enforceLoginLimit(event, store, credentials.username)
  const user = await store.findByUsername(credentials.username)
  const valid = user ? await verifyPassword(credentials.password, user.passwordHash) : await verifyDummy(credentials.password)
  if (!user || !valid) throw createError({ statusCode: 401, statusMessage: 'Identifiant ou mot de passe incorrect' })
  // Une éventuelle session précédente du navigateur est fermée, pas seulement remplacée
  await endSession(event, store)
  await startSession(event, store, user)
  return { user: publicUser(user) }
})
