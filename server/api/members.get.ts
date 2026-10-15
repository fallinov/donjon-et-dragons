import type { Member } from '~~/shared/types/sync'
import { requireAccountStore, requireSession } from '../utils/session'

/** Membres du groupe (identifiant et rôle), pour afficher à qui appartient une fiche. Compte connecté. */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const store = requireAccountStore(event)
  await requireSession(event, store)
  const members: Member[] = (await store.listUsers()).map(({ id, username, role }) => ({ id, username, role }))
  return { members }
})
