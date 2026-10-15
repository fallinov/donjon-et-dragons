import { publicUser, readSession, requireAccountStore } from '../../utils/session'

/** Compte connecté, ou `{ user: null }` sans session (cas normal, pas une erreur). */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const session = await readSession(event, requireAccountStore())
  return { user: session ? publicUser(session.user) : null }
})
