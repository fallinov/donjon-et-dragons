import { generatePassword, isValidUsername, normalizeUsername } from '../../utils/accountRules'
import { hashPassword } from '../../utils/password'
import { publicUser, requireAccountStore, requireMaster } from '../../utils/session'

/** Nouveau compte joueur `{ username }` (master) ; renvoie le mot de passe provisoire, affiché une seule fois. */
export default defineEventHandler(async (event) => {
  // Réponse contenant un mot de passe provisoire : jamais mise en cache
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const store = requireAccountStore()
  await requireMaster(event, store)
  const { username } = (await readBody(event) ?? {}) as Record<string, unknown>
  const normalized = typeof username === 'string' ? normalizeUsername(username) : ''
  if (!isValidUsername(normalized)) throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  const password = generatePassword()
  const user = await store.createUser({ username: normalized, passwordHash: await hashPassword(password), role: 'player', mustChangePassword: true })
  if (!user) throw createError({ statusCode: 409, statusMessage: 'Identifiant déjà pris' })
  return { user: publicUser(user), password }
})
