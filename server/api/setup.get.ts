import { requireAccountStore, setupCodeRequired } from '../utils/session'

/** Installation à faire (aucun compte) et code d'installation demandé. */
export default defineEventHandler(async () => {
  const store = requireAccountStore()
  return { needed: !(await store.hasUsers()), codeRequired: setupCodeRequired() }
})
