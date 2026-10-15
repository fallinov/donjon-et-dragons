import { requireAccountStore, requireMaster } from '../../utils/session'

/** Liste des comptes (master). */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const store = requireAccountStore()
  await requireMaster(event, store)
  return { users: await store.listUsers() }
})
