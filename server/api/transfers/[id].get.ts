import { enforceRateLimit, requireStore } from '../../utils/transferGuard'
import { isTransferId } from '../../utils/transferRules'

/** Lecture d'une fiche chiffrée par son identifiant ; 404 si inconnue ou expirée. */
export default defineEventHandler(async (event) => {
  const store = requireStore()
  const now = new Date()
  await enforceRateLimit(event, store, 'read', now)
  const id = getRouterParam(event, 'id')
  if (!isTransferId(id)) throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  const transfer = await store.get(id, now)
  if (!transfer) throw createError({ statusCode: 404, statusMessage: 'Transfert introuvable ou expiré' })
  setHeader(event, 'Cache-Control', 'no-store')
  return { data: transfer.data, expiresAt: transfer.expiresAt.toISOString() }
})
