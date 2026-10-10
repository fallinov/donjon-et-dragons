import { test, expect, type Page } from '@playwright/test'

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
    await page.getByRole('spinbutton', { name: 'Niveau', exact: true }).fill('7')
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
})
