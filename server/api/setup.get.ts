import { requireAccountStore, setupCodeRequired } from '../utils/session'

/** Installation à faire (aucun compte) et code d'installation demandé. */
export default defineEventHandler(async (event) => {
  const store = requireAccountStore(event)
  return { needed: !(await store.hasUsers()), codeRequired: setupCodeRequired() }
})
