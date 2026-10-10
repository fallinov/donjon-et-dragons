import { test, expect, type Page } from '@playwright/test'

/** Sur mobile, ouvre l'onglet demandé de la fiche ; sur ordinateur tout est déjà affiché. */
async function openTab(page: Page, name: string): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const tab = page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') })
  if (await tab.isVisible()) { await tab.dispatchEvent('click'); await page.waitForTimeout(300) }
}

const levelText = (level: number) => new RegExp(`niv(eau|\\.) ${level}`)

async function createCharacter(page: Page, firstName: string): Promise<string> {
  await page.goto('/')
  await page.getByRole('link', { name: /Nouvelle fiche/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Nouvelle fiche' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill(firstName)
  await page.getByRole('textbox', { name: 'Race', exact: true }).fill('Naine')
  await page.getByRole('textbox', { name: 'Classe', exact: true }).fill('Clerc')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page).toHaveURL(/\/personnages\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(firstName)
  return page.url()
}

test.describe('Éditeur de fiche', () => {
  test('créer une fiche : elle s\'affiche puis apparaît dans la liste', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

    await createCharacter(page, 'Ilda')
    await expect(page.getByText(levelText(1)).filter({ visible: true }).first()).toBeVisible()

    await page.goto('/')
    await expect(page.getByText('7 personnages consignés')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Ilda' })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('enregistrement bloqué sans prénom, avec récapitulatif des erreurs', async ({ page }) => {
    await page.goto('/personnages/nouveau')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    const summary = page.locator('[data-error-summary]')
    await expect(summary).toBeVisible()
    await expect(summary).toContainText('Prénom — Champ obligatoire.')
    await expect(summary).toBeFocused()
    await expect(page).toHaveURL(/\/personnages\/nouveau$/)
  })

  test('modifier le niveau de Dareth : conservé après rechargement', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval')
    await page.getByRole('link', { name: 'Modifier' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Modifier la fiche' })).toBeVisible()
    await page.getByRole('region', { name: 'Identité' }).getByRole('spinbutton', { name: 'Niveau', exact: true }).fill('7')
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(page).toHaveURL(/\/personnages\/dareth-brumeval$/)
    await expect(page.getByText(levelText(7)).filter({ visible: true }).first()).toBeVisible()
    await page.reload()
    await expect(page.getByText(levelText(7)).filter({ visible: true }).first()).toBeVisible()
  })

  test('supprimer une fiche : refus puis confirmation', async ({ page }) => {
    const url = await createCharacter(page, 'Brann')

    await page.getByRole('button', { name: 'Supprimer' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Supprimer la fiche ?')
    await expect(dialog).toContainText('Brann')
    await expect(dialog.getByRole('button', { name: 'Annuler' })).toBeFocused()
    await dialog.getByRole('button', { name: 'Annuler' }).click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(url)

    await page.getByRole('button', { name: 'Supprimer' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('6 personnages consignés')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Brann' })).toHaveCount(0)
  })

  test('quitter avec des modifications non enregistrées demande confirmation', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval/modifier')
    await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Darethos')

    await page.getByRole('button', { name: 'Annuler' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Quitter sans enregistrer ?')
    await dialog.getByRole('button', { name: 'Continuer' }).click()
    await expect(page).toHaveURL(/\/modifier$/)
    await expect(page.getByRole('textbox', { name: 'Prénom', exact: true })).toHaveValue('Darethos')

    await page.getByRole('button', { name: 'Annuler' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Quitter' }).click()
    await expect(page).toHaveURL(/\/personnages\/dareth-brumeval$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dareth')
    await expect(page.getByRole('heading', { level: 1 })).not.toContainText('Darethos')
  })

  test('quitter sans modification ne demande rien', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval/modifier')
    await expect(page.getByRole('textbox', { name: 'Prénom', exact: true })).toHaveValue('Dareth')
    await page.getByRole('button', { name: 'Annuler' }).click()
    await expect(page).toHaveURL(/\/personnages\/dareth-brumeval$/)
  })

  test('ajouter une langue', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval/modifier')
    const languages = page.getByRole('region', { name: 'Langues' })
    await languages.getByRole('button', { name: '+ Ajouter' }).click()
    await languages.getByRole('textbox', { name: 'Langue', exact: true }).last().fill('Géant')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL(/\/personnages\/dareth-brumeval$/)
    await expect(page.getByText('Géant')).toBeVisible()
  })

  test('ajouter un sort de niveau 1 à Thunon : il peut être lancé', async ({ page }) => {
    await page.goto('/personnages/thunon/modifier')
    const spells = page.getByRole('group', { name: 'Sorts connus' })
    await spells.getByRole('button', { name: '+ Ajouter' }).last().click()
    await spells.getByRole('textbox', { name: 'Nom du sort', exact: true }).last().fill('Graisse')
    await spells.getByRole('spinbutton', { name: 'Niveau du sort' }).last().fill('1')
    await spells.getByRole('combobox', { name: 'Ressource' }).last().selectOption('slot')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL(/\/personnages\/thunon$/)

    await openTab(page, 'Sorts')
    const row = page.locator('li').filter({ hasText: 'Graisse' }).filter({ visible: true }).first()
    await expect(row).toBeVisible()
    await expect(row.getByRole('button', { name: 'Lancer' })).toBeEnabled()
  })

  test('retirer le lanceur de sorts : plus aucun sort sur la fiche', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval/modifier')
    await page.getByRole('checkbox', { name: 'Lanceur de sorts' }).uncheck()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL(/\/personnages\/dareth-brumeval$/)

    await openTab(page, 'Sorts')
    await expect(page.getByRole('region', { name: 'Sorts', exact: true })).toHaveCount(0)
    await expect(page.locator('#slots-count-1')).toHaveCount(0)
    const tab = page.getByRole('button', { name: /^Sorts$/i })
    if (await tab.isVisible()) await expect(page.getByText('Aucun sort connu.')).toBeVisible()
  })

  test('nouveau lanceur : le DD est obligatoire', async ({ page }) => {
    await page.goto('/personnages/kael-draven/modifier')
    const caster = page.getByRole('checkbox', { name: 'Lanceur de sorts' })
    if (await caster.isChecked()) await caster.uncheck()
    await caster.check()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.locator('[data-error-summary]')).toContainText('DD de sauvegarde — Nombre entier attendu.')
  })

  test('ajouter une attaque : visible sur la fiche', async ({ page }) => {
    await page.goto('/personnages/zanna/modifier')
    const attacks = page.getByRole('region', { name: 'Attaques et incantations' })
    await attacks.getByRole('button', { name: '+ Ajouter' }).click()
    await attacks.getByRole('textbox', { name: 'Arme ou sort', exact: true }).last().fill('Arbalète légère')
    await attacks.getByRole('textbox', { name: "Jet d'attaque", exact: true }).last().fill('1d20+3')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL(/\/personnages\/zanna$/)

    await openTab(page, 'Combat')
    await expect(page.getByText('Arbalète légère').filter({ visible: true }).first()).toBeVisible()
  })
})

