import { test, expect } from '@playwright/test'

test.describe('Codex Donjon et Dragons', () => {
  test('liste des personnages affiche Dareth', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Donjon')
    await expect(page.getByRole('heading', { level: 2, name: /Dareth Brumeval/i })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('navigation vers la fiche Dareth', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Dareth Brumeval/i }).click()
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
})
