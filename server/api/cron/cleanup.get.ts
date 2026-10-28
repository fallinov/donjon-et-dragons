import { useAccountStore } from '../../utils/accountStore'

/**
 * Nettoyage quotidien (tâche Cron Vercel, `nuxt.config.ts`) : sessions expirées et compteurs de
 * limitation des heures passées. Si `CRON_SECRET` est défini dans Vercel, seul l'appel Cron de
 * Vercel (jeton Bearer) est accepté.
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  if (secret && getHeader(event, 'authorization') !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })
  }
  await useAccountStore()?.deleteExpired(new Date())
  return { ok: true }
})
