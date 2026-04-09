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

  test('lancer un sort consomme un emplacement', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    // Sur mobile, naviguer vers l'onglet Sorts
    const sortsTab = page.getByRole('button', { name: /^Sorts$/i })
    if (await sortsTab.isVisible()) { await sortsTab.dispatchEvent('click'); await page.waitForTimeout(500) }
    await expect(page.locator('#slots-count')).toHaveText('3 / 3')

    // Cliquer "Lancer" sur le premier sort
    const launchBtn = page.getByRole('button', { name: /Lancer/i }).first()
    await launchBtn.dispatchEvent('click')
    await expect(page.locator('#slots-count')).toHaveText('2 / 3')

    // Lancer encore 2 fois → 0/3 → boutons désactivés
    await launchBtn.dispatchEvent('click')
    await page.getByRole('button', { name: /Lancer/i }).first().dispatchEvent('click')
    await expect(page.locator('#slots-count')).toHaveText('0 / 3')
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

  test('HP tracker permet les dégâts et les soins via boutons −/+', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    // Sur mobile, naviguer vers l'onglet Combat
    const combatTab = page.getByRole('button', { name: /^Combat$/i })
    if (await combatTab.isVisible()) { await combatTab.dispatchEvent('click'); await page.waitForTimeout(500) }

    // HP initial = 33
    await expect(page.getByText('33', { exact: false }).first()).toBeVisible()

    // Cliquer 3× sur le bouton − (retirer 3 HP)
    const minusBtn = page.getByRole('button', { name: /Diminuer points de vie/i })
    await minusBtn.click()
    await minusBtn.click()
    await minusBtn.click()
    await expect(page.getByText('30', { exact: false }).first()).toBeVisible()

    // Cliquer 2× sur le bouton + (ajouter 2 HP)
    const plusBtn = page.getByRole('button', { name: /Augmenter points de vie/i })
    await plusBtn.click()
    await plusBtn.click()
    await expect(page.getByText('32', { exact: false }).first()).toBeVisible()
  })

  test('Inspiration +/−', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    const combatTab = page.getByRole('button', { name: /^Combat$/i })
    if (await combatTab.isVisible()) { await combatTab.dispatchEvent('click'); await page.waitForTimeout(500) }
    const addBtn = page.getByRole('button', { name: /Augmenter inspiration/i })
    const useBtn = page.getByRole('button', { name: /Diminuer inspiration/i })
    await addBtn.click()
    await addBtn.click()
    await expect(page.getByText('2', { exact: true })).toBeVisible()
    await useBtn.click()
    await expect(page.getByText('1', { exact: true })).toBeVisible()
  })

  test('Long rest restaure les HP au maximum', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    const combatTab = page.getByRole('button', { name: /^Combat$/i })
    if (await combatTab.isVisible()) { await combatTab.dispatchEvent('click'); await page.waitForTimeout(500) }

    // Retirer 5 HP
    const minusBtn = page.getByRole('button', { name: /Diminuer points de vie/i })
    for (let i = 0; i < 5; i++) await minusBtn.click()
    await expect(page.getByText('28', { exact: false }).first()).toBeVisible()

    // Repos long (confirm dialog)
    page.on('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: /Long/i }).click()
    await expect(page.getByText('33', { exact: false }).first()).toBeVisible()
  })

  test('Jets de sauvegarde contre la mort apparaissent quand HP = 0', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    const combatTab = page.getByRole('button', { name: /^Combat$/i })
    if (await combatTab.isVisible()) { await combatTab.dispatchEvent('click'); await page.waitForTimeout(500) }

    // Cliquer − jusqu'à HP=0 (le bouton se disable à 0)
    const minusBtn = page.getByRole('button', { name: /Diminuer points de vie/i })
    while (await minusBtn.isEnabled()) {
      await minusBtn.click()
    }

    await expect(page.getByText(/Sauvegardes contre la mort/i)).toBeVisible()
    const successButtons = page.getByRole('group', { name: 'Succès contre la mort' }).getByRole('button')
    await successButtons.first().click()
    await expect(successButtons.first()).toHaveAttribute('aria-pressed', 'true')
  })
})
