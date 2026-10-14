import { enforceRateLimit, requireStore } from '../../utils/transferGuard'
import { checkDeposit, expiresAt } from '../../utils/transferRules'

/** Dépôt d'une fiche chiffrée : `{ id, data }` → `{ expiresAt }`. */
export default defineEventHandler(async (event) => {
  const store = requireStore()
  const now = new Date()
  await enforceRateLimit(event, store, 'deposit', now)
  const check = checkDeposit(await readBody(event))
  if (!check.ok) throw createError({ statusCode: check.status, statusMessage: check.message })
  await store.deleteExpired(now)
  const expires = expiresAt(now)
  if (!(await store.put(check.id, check.data, expires))) {
    throw createError({ statusCode: 409, statusMessage: 'Identifiant déjà utilisé' })
  }
  return { expiresAt: expires.toISOString() }
})
