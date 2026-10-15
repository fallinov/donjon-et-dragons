import { useAccountStore } from '../../utils/accountStore'
import { useTransferStore } from '../../utils/transferStore'

/**
 * Nettoyage quotidien des transferts et des sessions expirés (tâche Cron Vercel, `nuxt.config.ts`).
 * Sans effet sensible : elle ne fait que supprimer ce qui a expiré. Si `CRON_SECRET` est
 * défini dans Vercel, seul l'appel Cron de Vercel (jeton Bearer) est accepté.
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  if (secret && getHeader(event, 'authorization') !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })
  }
  const now = new Date()
  await useTransferStore()?.deleteExpired(now)
  await useAccountStore()?.deleteExpiredSessions(now)
  return { ok: true }
})
