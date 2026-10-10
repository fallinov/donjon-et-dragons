import { test, expect, type Page } from '@playwright/test'

/** Attend que le service worker contrôle la page (première visite : un rechargement est nécessaire). */
async function waitForServiceWorker(page: Page): Promise<void> {
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload()
  }
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
}

test.describe('Application installable', () => {
  test('manifeste : nom, affichage autonome et icônes', async ({ page, request }) => {
    await page.goto('/')
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
    const manifest = await (await request.get('/manifest.webmanifest')).json() as Record<string, unknown>
    expect(manifest).toMatchObject({
      name: 'Codex — Donjon et Dragons',
      short_name: 'Codex D&D',
      lang: 'fr',
      display: 'standalone',
      start_url: '/',
      theme_color: '#0b0907',
    })
    const icons = manifest.icons as { src: string, sizes: string, purpose?: string }[]
    expect(icons.map(i => i.sizes)).toEqual(['192x192', '512x512', '512x512'])
    expect(icons.some(i => i.purpose === 'maskable')).toBe(true)
    for (const icon of icons) expect((await request.get(icon.src)).ok()).toBe(true)
  })

  test('hors ligne : la liste et une fiche se rechargent sans réseau', async ({ page, context }) => {
    const errors: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

    await page.goto('/')
    await expect(page.getByText('6 personnages consignés')).toBeVisible()
    await waitForServiceWorker(page)

    await context.setOffline(true)
    await page.reload()
    await expect(page.getByText('6 personnages consignés')).toBeVisible()

    await page.goto('/personnages/dareth-brumeval')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dareth')
    const portrait = page.locator('header img').filter({ visible: true }).first()
    await expect(portrait).toHaveAttribute('src', /^blob:/)

    // Les modifications restent possibles hors ligne
    await page.getByRole('button', { name: 'Combat' }).dispatchEvent('click')
    await page.getByRole('button', { name: /Diminuer points de vie/i }).click()
    await expect(page.getByRole('progressbar', { name: /points de vie/ })).toHaveAttribute('aria-valuenow', '48')

    await context.setOffline(false)
    // Erreurs réseau attendues hors ligne (requêtes non mises en cache) : seules les autres comptent
    expect(errors.filter(e => !/net::ERR_INTERNET_DISCONNECTED|Failed to fetch/i.test(e))).toEqual([])
  })

  test('création de fiche hors ligne, portrait par défaut compris', async ({ page, context }) => {
    await page.goto('/')
    await expect(page.getByText('6 personnages consignés')).toBeVisible()
    await waitForServiceWorker(page)
    await context.setOffline(true)

    await page.getByRole('link', { name: /Nouvelle fiche/ }).click()
    await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Hors-ligne')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hors-ligne')
    await context.setOffline(false)
  })
})
