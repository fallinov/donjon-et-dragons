import { test, expect } from '@playwright/test'

test.describe('Codex Donjon et Dragons', () => {
  // Reset localStorage avant chaque test pour éviter la pollution d'état
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear())
  })
  test('liste des personnages affiche Dareth', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Donjon')
    await expect(page.getByRole('heading', { level: 2, name: /Dareth\s+Brumeval/i })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('navigation vers la fiche Dareth', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Dareth\s+Brumeval/i }).click()
    await expect(page).toHaveURL(/\/personnages\/dareth-brumeval$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dareth')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Brumeval')
  })

  test('emplacements de sort interactifs', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    // Attendre l'hydratation Vue avant de cliquer
    await page.waitForTimeout(500)
    await expect(page.locator('#slots-count')).toHaveText('3 / 3')

    const slots = page.locator('[data-slot]')
    await slots.first().click()
    await expect(page.locator('#slots-count')).toHaveText('2 / 3')
    await expect(slots.first()).toHaveAttribute('aria-pressed', 'true')

    await slots.first().click()
    await expect(page.locator('#slots-count')).toHaveText('3 / 3')
  })

  test('skip link cible le contenu principal', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval')
    const skip = page.getByRole('link', { name: /Aller au contenu/i })
    await expect(skip).toHaveAttribute('href', '#contenu')
  })

  test('console reste propre sur la fiche', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/personnages/dareth-brumeval')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('HP tracker permet les dégâts et les soins', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800) // attendre hydratation

    // HP initial doit être 33 / 33
    await expect(page.getByText('33', { exact: false }).first()).toBeVisible()

    // Infliger 10 dégâts
    await page.getByLabel('Dégâts').fill('10')
    await page.getByRole('button', { name: '−' }).click()
    await expect(page.getByText('23', { exact: false }).first()).toBeVisible()

    // Soigner 5
    await page.getByLabel('Soin').fill('5')
    await page.getByRole('button', { name: '+' }).click()
    await expect(page.getByText('28', { exact: false }).first()).toBeVisible()
  })

  test('Inspiration toggle', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    const btn = page.getByRole('button', { name: /Inspiration/i })
    await expect(btn).toHaveAttribute('aria-pressed', 'false')
    await btn.click()
    await expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  test('Long rest restaure les HP au maximum', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval')
    await page.waitForTimeout(500)

    // Inflige 10 dégâts
    await page.getByLabel('Dégâts').fill('10')
    await page.getByRole('button', { name: '−' }).click()
    await expect(page.getByText('23', { exact: false }).first()).toBeVisible()

    // Repos long (confirm dialog)
    page.on('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: /Repos long/i }).click()
    await expect(page.getByText('33 /', { exact: false }).first()).toBeVisible()
  })

  test('Jets de sauvegarde contre la mort apparaissent quand HP = 0', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval')
    await page.waitForTimeout(500)

    await page.getByLabel('Dégâts').fill('999')
    await page.getByRole('button', { name: '−' }).click()

    await expect(page.getByText(/Jets de sauvegarde contre la mort/i)).toBeVisible()
    const successButtons = page.getByRole('group', { name: 'Succès contre la mort' }).getByRole('button')
    await successButtons.first().click()
    await expect(successButtons.first()).toHaveAttribute('aria-pressed', 'true')
  })
})
