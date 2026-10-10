import { test, expect } from '@playwright/test'

test.describe('Codex Donjon et Dragons', () => {
  // Reset localStorage au premier chargement de chaque test pour éviter la pollution d'état.
  // Le marqueur en sessionStorage évite de tout effacer lors d'un rechargement dans le test.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem('e2e-storage-cleared')) return
      window.localStorage.clear()
      window.sessionStorage.setItem('e2e-storage-cleared', '1')
    })
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

  test('premier lancement : les 6 fiches sont importées avec leur portrait', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('6 personnages consignés')).toBeVisible()
    const portraits = page.locator('main ul img')
    await expect(portraits).toHaveCount(6)
    for (const img of await portraits.all()) {
      await expect(img).toHaveAttribute('src', /^blob:/)
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
    }
  })

  test('identifiant inconnu : message et lien de retour', async ({ page }) => {
    await page.goto('/personnages/inexistant')
    await expect(page.getByText('Personnage introuvable')).toBeVisible()
    await page.getByRole('link', { name: 'Retour aux codex' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('navigation vers la fiche Dareth', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href="/personnages/dareth-brumeval"]').click({ force: true })
    await expect(page).toHaveURL(/\/personnages\/dareth-brumeval$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dareth')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Brumeval')
  })

  test('lancer un sort consomme un emplacement', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Sur mobile, naviguer vers l'onglet Sorts
    const sortsTab = page.getByRole('button', { name: /^Sorts$/i })
    if (await sortsTab.isVisible()) { await sortsTab.dispatchEvent('click'); await page.waitForTimeout(500) }
    await expect(page.locator('#slots-count-1')).toHaveText('4 / 4')

    // Cliquer "Lancer" sur le premier sort
    const launchBtn = page.getByRole('button', { name: /Lancer/i }).first()
    await launchBtn.dispatchEvent('click')
    await expect(page.locator('#slots-count-1')).toHaveText('3 / 4')

    // Lancer encore 3 fois → 0/4 → boutons désactivés
    await launchBtn.dispatchEvent('click')
    await launchBtn.dispatchEvent('click')
    await page.getByRole('button', { name: /Lancer/i }).first().dispatchEvent('click')
    await expect(page.locator('#slots-count-1')).toHaveText('0 / 4')
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
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Sur mobile, naviguer vers l'onglet Combat
    const combatTab = page.getByRole('button', { name: /^Combat$/i })
    if (await combatTab.isVisible()) { await combatTab.dispatchEvent('click'); await page.waitForTimeout(500) }

    // HP initial = 49
    await expect(page.getByText('49', { exact: false }).first()).toBeVisible()

    // Cliquer 3× sur le bouton − (retirer 3 HP)
    const minusBtn = page.getByRole('button', { name: /Diminuer points de vie/i })
    await minusBtn.click()
    await minusBtn.click()
    await minusBtn.click()
    await expect(page.getByText('46', { exact: false }).first()).toBeVisible()

    // Cliquer 2× sur le bouton + (ajouter 2 HP)
    const plusBtn = page.getByRole('button', { name: /Augmenter points de vie/i })
    await plusBtn.click()
    await plusBtn.click()
    await expect(page.getByText('48', { exact: false }).first()).toBeVisible()
  })

  test('Rites de combat en accordéon sur mobile, ouverts sur ordinateur', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const combatTab = page.getByRole('button', { name: /^Combat$/i })
    const firstFormula = page.locator('#rite-panel-0 p').first()

    if (await combatTab.isVisible()) {
      await combatTab.dispatchEvent('click')
      await page.waitForTimeout(500)
      const toggle = page.getByRole('button', { name: /Rite I\b.*ouverture silencieuse/i })
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await expect(firstFormula).toBeHidden()
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      await expect(firstFormula).toBeVisible()
    }
    else {
      await firstFormula.scrollIntoViewIfNeeded()
      await expect(firstFormula).toBeVisible()
    }
  })

  test('Sac : ajout d\'un objet, argent et notes conservés après rechargement', async ({ page }) => {
    const openSac = async () => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const sacTab = page.getByRole('button', { name: /^Sac$/i })
      if (await sacTab.isVisible()) { await sacTab.dispatchEvent('click'); await page.waitForTimeout(500) }
    }
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    await openSac()

    await page.getByLabel("Nom de l'objet").fill('Lanterne sourde')
    await page.getByRole('button', { name: 'Ajouter' }).click()
    await expect(page.getByText('Lanterne sourde')).toBeVisible()

    const gold = page.getByLabel(/Pièces d'or/)
    await gold.fill('400')
    await gold.blur()
    await page.getByLabel('Notes').fill('Rendez-vous avec Gundren à Phandaline.')

    await page.reload({ waitUntil: 'networkidle' })
    await openSac()
    await expect(page.getByText('Lanterne sourde')).toBeVisible()
    await expect(page.getByLabel(/Pièces d'or/)).toHaveValue('400')
    await expect(page.getByLabel('Notes')).toHaveValue(/Gundren/)
  })

  test('Inspiration +/−', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const combatTab = page.getByRole('button', { name: /^Combat$/i })
    if (await combatTab.isVisible()) { await combatTab.dispatchEvent('click'); await page.waitForTimeout(500) }
    const addBtn = page.getByRole('button', { name: /Augmenter inspiration/i })
    const useBtn = page.getByRole('button', { name: /Diminuer inspiration/i })
    // Cherche la valeur dans le compteur seulement (la page contient d'autres chiffres)
    const counter = useBtn.locator('xpath=..')
    await addBtn.click()
    await addBtn.click()
    await expect(counter.getByText('2', { exact: true })).toBeVisible()
    await useBtn.click()
    await expect(counter.getByText('1', { exact: true })).toBeVisible()
  })

  test('Long rest restaure les HP au maximum', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const combatTab = page.getByRole('button', { name: /^Combat$/i })
    if (await combatTab.isVisible()) { await combatTab.dispatchEvent('click'); await page.waitForTimeout(500) }

    // Retirer 5 HP
    const minusBtn = page.getByRole('button', { name: /Diminuer points de vie/i })
    for (let i = 0; i < 5; i++) await minusBtn.click()
    await expect(page.getByText('44', { exact: false }).first()).toBeVisible()

    // Repos long (confirm dialog)
    page.on('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: 'Repos long' }).first().click()
    await expect(page.getByText('49', { exact: false }).first()).toBeVisible()
  })

  test('Jets de sauvegarde contre la mort apparaissent quand HP = 0', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
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
