import type { H3Event } from 'h3'
import { RATE_LIMITS, type RateAction } from './transferRules'
import { rateKey, useTransferStore, type TransferStore } from './transferStore'

/** Stockage disponible, sinon 503 (base non configurée en production). */
export function requireStore(): TransferStore {
  const store = useTransferStore()
  if (!store) throw createError({ statusCode: 503, statusMessage: 'Relais indisponible' })
  return store
}

/** Applique la limite par adresse IP ; 429 au-delà. */
export async function enforceRateLimit(event: H3Event, store: TransferStore, action: RateAction, now: Date): Promise<void> {
  // Tests e2e en local : tous les navigateurs partagent 127.0.0.1, la limite fausserait la série
  if (process.env.NUXT_E2E === 'true' && !process.env.VERCEL) return
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'inconnue'
  const count = await store.hit(rateKey(action, ip), now)
  if (count > RATE_LIMITS[action]) throw createError({ statusCode: 429, statusMessage: 'Trop de demandes, réessayez plus tard' })
}
