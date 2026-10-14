import { test, expect, type Browser, type Page } from '@playwright/test'

/** Un autre téléphone : contexte de navigateur séparé, avec ses propres fiches (IndexedDB). */
async function otherPhone(browser: Browser): Promise<Page> {
  const context = await browser.newContext(test.info().project.use)
  return context.newPage()
}

/** Ouvre « ⋯ » → Transférer et renvoie le code affiché. */
async function transfer(page: Page, id: string): Promise<string> {
  // Pas de rechargement si la fiche est déjà ouverte : il couperait la dernière écriture des PV
  if (!page.url().endsWith(`/personnages/${id}`)) await page.goto(`/personnages/${id}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const profil = page.getByRole('button', { name: 'Profil', exact: true })
  if (await profil.isVisible()) await profil.dispatchEvent('click')
  await page.getByRole('button', { name: 'Autres actions' }).filter({ visible: true }).click()
  await page.getByRole('button', { name: 'Transférer' }).filter({ visible: true }).click()
  const code = page.locator('dialog[open] [data-transfer-code]')
  await expect(code).toHaveText(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/, { timeout: 15_000 })
  return (await code.textContent())!
}

async function receive(page: Page, code: string): Promise<void> {
  await page.goto('/')
  await page.getByRole('link', { name: 'Recevoir une fiche' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Recevoir une fiche' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Code de transfert' }).fill(code)
  await page.getByRole('button', { name: /^Recevoir/ }).click()
}

async function lowerHp(page: Page, times: number): Promise<void> {
  const combat = page.getByRole('button', { name: 'Combat', exact: true })
  if (await combat.isVisible()) await combat.dispatchEvent('click')
  const minus = page.getByRole('button', { name: /Diminuer points de vie/i })
  for (let i = 0; i < times; i++) await minus.click()
}

const hpBar = (page: Page) => page.getByRole('progressbar', { name: /points de vie/ })

test.describe('Transfert de fiche par code', () => {
  test('menu : « Transférer » en premier', async ({ page }) => {
    await page.goto('/personnages/zanna')
    await page.getByRole('button', { name: 'Autres actions' }).filter({ visible: true }).click()
    const items = page.locator('[data-actions-menu]').filter({ visible: true }).getByRole('button')
    await expect(items.first()).toHaveText('Transférer')
  })

  test('transférer Zanna vers un autre téléphone : Remplacer, PV et portrait repris', async ({ page, browser }) => {
    const errors: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

    await page.goto('/personnages/zanna')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await lowerHp(page, 4)
    const hp = await hpBar(page).getAttribute('aria-valuenow')
    const code = await transfer(page, 'zanna')
    await expect(page.locator('dialog[open]')).toContainText('Valable jusqu\'au')

    const other = await otherPhone(browser)
    await receive(other, code)
    const dialog = other.getByRole('dialog')
    await expect(dialog).toContainText('Cette fiche existe déjà')
    await dialog.getByRole('button', { name: 'Remplacer' }).click()
    await expect(other).toHaveURL(/\/personnages\/zanna$/)
    await expect(other.getByRole('heading', { level: 1 })).toContainText('Zanna')
    const portrait = other.locator('header img').filter({ visible: true }).first()
    await expect.poll(() => portrait.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0)
    await lowerHp(other, 0)
    await expect(hpBar(other)).toHaveAttribute('aria-valuenow', hp!)
    await other.context().close()
    expect(errors).toEqual([])
  })

  test('lien partagé /recevoir#code : code prérempli, fiche absente importée directement', async ({ page, browser }) => {
    const code = await transfer(page, 'kael-draven')

    const other = await otherPhone(browser)
    await other.goto('/personnages/kael-draven')
    await other.getByRole('button', { name: 'Autres actions' }).filter({ visible: true }).click()
    await other.getByRole('button', { name: 'Supprimer', exact: true }).filter({ visible: true }).click()
    await other.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click()
    await expect(other.getByText('5 personnages consignés')).toBeVisible()

    await other.goto(`/recevoir#${code.replace('-', '').toLowerCase()}`)
    await expect(other.getByRole('textbox', { name: 'Code de transfert' })).toHaveValue(code)
    await other.getByRole('button', { name: /^Recevoir/ }).click()
    await expect(other).toHaveURL(/\/personnages\/kael-draven$/)
    await expect(other.getByRole('heading', { level: 1 })).toContainText('Kael')
    await other.goto('/')
    await expect(other.getByText('6 personnages consignés')).toBeVisible()
    await other.context().close()
  })

  test('code inconnu ou mal formé : message clair, aucune fiche ajoutée', async ({ page }) => {
    await receive(page, 'ZZZZ-ZZZZ')
    await expect(page.locator('[data-receive-error]')).toContainText('Code inconnu ou expiré')
    await page.getByRole('textbox', { name: 'Code de transfert' }).fill('AB12')
    await page.getByRole('button', { name: /^Recevoir/ }).click()
    await expect(page.locator('[data-receive-error]')).toHaveText('Le code compte 8 caractères (lettres et chiffres).')
    await page.goto('/')
    await expect(page.getByText('6 personnages consignés')).toBeVisible()
  })

  test('iPhone dans Safari : rappel d\'ouvrir l\'app installée', async ({ page }) => {
    const iphone = test.info().project.name === 'mobile-safari'
    // Sans code : rappel seul, sans bouton Copier
    await page.goto('/recevoir')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('[data-ios-standalone-hint]')).toHaveCount(iphone ? 1 : 0)
    await expect(page.getByRole('button', { name: 'Copier le code' })).toHaveCount(0)
    await page.goto('/recevoir#K7P4QX9M')
    await expect(page.getByRole('textbox', { name: 'Code de transfert' })).toHaveValue('K7P4-QX9M')
    await expect(page.locator('[data-ios-standalone-hint]')).toHaveCount(iphone ? 1 : 0)
    await expect(page.getByRole('button', { name: 'Copier le code' })).toHaveCount(iphone ? 1 : 0)
    await expect(page.getByRole('button', { name: iphone ? 'Recevoir dans Safari' : 'Recevoir', exact: true })).toBeVisible()
  })

  test('fermer puis rouvrir pendant l\'envoi : un seul dépôt, un seul code', async ({ page }) => {
    const deposits: string[] = []
    page.on('request', (req) => { if (req.method() === 'POST' && req.url().endsWith('/api/transfers')) deposits.push(req.url()) })
    // Relais lent : la boîte est fermée puis rouverte pendant l'envoi
    await page.route('**/api/transfers', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      await route.continue()
    })
    await page.goto('/personnages/zanna')
    const openTransfer = async () => {
      await page.getByRole('button', { name: 'Autres actions' }).filter({ visible: true }).click()
      await page.getByRole('button', { name: 'Transférer' }).filter({ visible: true }).click()
    }
    await openTransfer()
    await page.locator('dialog[open]').getByRole('button', { name: 'Fermer' }).click()
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await openTransfer()
    await expect(page.locator('dialog[open] [data-transfer-code]')).toBeVisible({ timeout: 15_000 })
    expect(deposits).toHaveLength(1)
  })

  test('relais indisponible : erreur et bouton Réessayer', async ({ page }) => {
    await page.route('**/api/transfers', route => route.fulfill({ status: 503 }))
    await page.goto('/personnages/zanna')
    await page.getByRole('button', { name: 'Autres actions' }).filter({ visible: true }).click()
    await page.getByRole('button', { name: 'Transférer' }).filter({ visible: true }).click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog.locator('[data-transfer-error]')).toHaveText('Le service de transfert est indisponible. Réessaie plus tard.')
    await page.unroute('**/api/transfers')
    await dialog.getByRole('button', { name: 'Réessayer' }).click()
    await expect(dialog.locator('[data-transfer-code]')).toBeVisible({ timeout: 15_000 })
    await dialog.getByRole('button', { name: 'Fermer' }).click()
    await expect(page.locator('dialog[open]')).toHaveCount(0)
  })
})
