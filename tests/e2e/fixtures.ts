import { test as base, expect, type APIRequestContext, type BrowserContext } from '@playwright/test'
import { MASTER } from './accounts'

export { expect }
export type { APIRequestContext, Browser, BrowserContext, Page } from '@playwright/test'
export const BASE_URL = 'http://localhost:3210'

interface Fixtures {
  /** Groupe isolé du test sur le serveur de dev (comptes et fiches à lui seul). */
  tenant: string
  /** Contexte connecté en master (par défaut) ; `false` : aucun compte créé, page de connexion. */
  signedIn: boolean
  /** Nouveau client d'API du même groupe (autre compte, autre appareil). */
  api: () => Promise<APIRequestContext>
  /** Autre « téléphone » du même groupe, connecté en master sauf `{ signedIn: false }`. */
  newDevice: (options?: { signedIn?: boolean }) => Promise<BrowserContext>
}

async function signInMaster(request: APIRequestContext): Promise<void> {
  // Premier appel du groupe : installation (crée le master) ; ensuite, simple connexion
  const setup = await request.post('/api/setup', { data: MASTER })
  if (setup.status() === 200) return
  const login = await request.post('/api/auth/login', { data: MASTER })
  expect(login.status()).toBe(200)
}

/**
 * Tests e2e avec comptes : chaque test a son propre groupe sur le serveur (en-tête `x-e2e-tenant`,
 * reconnu seulement par `pnpm dev` avec `NUXT_E2E=true`) et démarre connecté en master, avec les
 * 6 fiches de départ (envoyées par sa première synchronisation).
 */
export const test = base.extend<Fixtures>({
  signedIn: [true, { option: true }],
  tenant: async ({}, use, testInfo) => {
    await use(`${testInfo.testId}-${testInfo.retry}-${testInfo.repeatEachIndex}`)
  },
  extraHTTPHeaders: async ({ tenant }, use) => {
    await use({ 'x-e2e-tenant': tenant })
  },
  context: async ({ context, signedIn }, use) => {
    if (signedIn) await signInMaster(context.request)
    await use(context)
  },
  api: async ({ playwright, tenant }, use) => {
    const created: APIRequestContext[] = []
    await use(async () => {
      const request = await playwright.request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { 'x-e2e-tenant': tenant } })
      created.push(request)
      return request
    })
    for (const request of created) await request.dispose()
  },
  newDevice: async ({ browser, tenant }, use, testInfo) => {
    const created: BrowserContext[] = []
    await use(async ({ signedIn = true } = {}) => {
      const context = await browser.newContext({ ...testInfo.project.use, baseURL: BASE_URL, extraHTTPHeaders: { 'x-e2e-tenant': tenant } })
      created.push(context)
      if (signedIn) await signInMaster(context.request)
      return context
    })
    for (const context of created) await context.close()
  },
})
