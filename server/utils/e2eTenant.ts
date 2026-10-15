import type { H3Event } from 'h3'

const TENANT_PATTERN = /^[\w-]{1,80}$/

/**
 * Groupe isolé des tests e2e : chaque test envoie `x-e2e-tenant` et reçoit ses propres comptes et
 * fiches (stockage mémoire), sans voir ceux des tests lancés en parallèle. N'existe qu'en
 * développement avec `NUXT_E2E=true` : le build de production ignore l'en-tête.
 */
export function e2eTenant(event: H3Event | undefined): string | undefined {
  if (!import.meta.dev || process.env.NUXT_E2E !== 'true' || !event) return undefined
  const tenant = getRequestHeader(event, 'x-e2e-tenant')
  return tenant && TENANT_PATTERN.test(tenant) ? tenant : undefined
}

/** Stockage propre au groupe de test de la requête, créé à la demande. */
export function tenantStore<T>(stores: Map<string, T>, tenant: string, create: () => T): T {
  let store = stores.get(tenant)
  if (!store) {
    store = create()
    stores.set(tenant, store)
  }
  return store
}
