import { defineConfig, devices } from '@playwright/test'

/**
 * Tests de l'application installable sur un vrai build de production : le service
 * worker n'existe pas en `pnpm dev`. Chromium seulement (service worker sous WebKit
 * instable avec Playwright) ; l'iPhone se teste à la main.
 */
export default defineConfig({
  testDir: './tests/pwa',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3211',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium-pwa', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'NITRO_PRESET=node-server pnpm build && PORT=3211 node .output/server/index.mjs',
    url: 'http://localhost:3211',
    reuseExistingServer: false,
    timeout: 300_000,
  },
  outputDir: 'playwright/results-pwa',
})
