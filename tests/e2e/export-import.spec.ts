import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

/** Ouvre le menu « ⋯ » de la fiche (en-tête mobile ou fil d'Ariane selon l'écran). */
async function openMenu(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Autres actions' }).filter({ visible: true }).click()
}

async function exportCharacter(page: Page, id: string): Promise<{ path: string, json: Record<string, unknown> }> {
  await page.goto(`/personnages/${id}`)
  await openMenu(page)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter (fichier)' }).filter({ visible: true }).click()
  const file = await download
  const path = await file.path()
  return { path, json: JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown> }
}

async function importFile(page: Page, path: string): Promise<void> {
  await page.goto('/')
  await expect(page.getByText(/personnages? consignés?/)).toBeVisible()
  await page.locator('[data-import-input]').setInputFiles(path)
}

async function lowerHp(page: Page, times: number): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const combat = page.getByRole('button', { name: 'Combat', exact: true })
  if (await combat.isVisible()) await combat.dispatchEvent('click')
  const minus = page.getByRole('button', { name: /Diminuer points de vie/i })
  for (let i = 0; i < times; i++) await minus.click()
}

const hpBar = (page: Page) => page.getByRole('progressbar', { name: /points de vie/ })

test.describe('Export, import et restauration', () => {
  test('export : fichier codex avec fiche, portrait et PV', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval')
    await lowerHp(page, 3)
    await expect(hpBar(page)).toHaveAttribute('aria-valuenow', '46')
    const { path, json } = await exportCharacter(page, 'dareth-brumeval')
    expect(path).toBeTruthy()
    expect(json).toMatchObject({ format: 'codex-dnd/character', schemaVersion: 2, state: { hpCurrent: 46 } })
    const character = json.character as { firstName: string, portrait: { base64: string, mime: string } }
    expect(character.firstName).toBe('Dareth')
    expect(character.portrait.mime).toBe('image/jpeg')
    expect(character.portrait.base64.length).toBeGreaterThan(10_000)
  })

  test('supprimer puis réimporter : fiche, portrait et PV restaurés', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval')
    await lowerHp(page, 2)
    const { path } = await exportCharacter(page, 'dareth-brumeval')

    await openMenu(page)
    await page.getByRole('button', { name: 'Supprimer', exact: true }).filter({ visible: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click()
    await expect(page.getByText('5 personnages consignés')).toBeVisible()

    await importFile(page, path)
    await expect(page).toHaveURL(/\/personnages\/dareth-brumeval$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dareth')
    const portrait = page.locator('header img').filter({ visible: true }).first()
    await expect.poll(() => portrait.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0)
    await lowerHp(page, 0)
    await expect(hpBar(page)).toHaveAttribute('aria-valuenow', '47')
  })

  test('fiche déjà présente : importer en copie ou remplacer', async ({ page }) => {
    const { path } = await exportCharacter(page, 'zanna')

    await importFile(page, path)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Cette fiche existe déjà')
    await expect(dialog.getByRole('button')).toHaveText(['Annuler', 'Remplacer', 'Importer en copie'])
    await dialog.getByRole('button', { name: 'Importer en copie' }).click()
    await expect(page).toHaveURL(/\/personnages\/[0-9a-f-]{36}$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Zanna (copie)')

    await importFile(page, path)
    await page.getByRole('dialog').getByRole('button', { name: 'Remplacer' }).click()
    await expect(page).toHaveURL(/\/personnages\/zanna$/)
    await page.goto('/')
    await expect(page.getByText('7 personnages consignés')).toBeVisible()
  })

  test('fichier invalide : message clair, aucune fiche ajoutée', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-import-input]').setInputFiles({ name: 'photo.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"autre"}') })
    await expect(page.locator('[data-import-error]')).toHaveText("Ce fichier n'est pas une fiche du codex.")
    await expect(page.getByText('6 personnages consignés')).toBeVisible()
  })

  test('restaurer l\'original après modification', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval/modifier')
    await page.getByRole('region', { name: 'Identité' }).getByRole('spinbutton', { name: 'Niveau', exact: true }).fill('9')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByText(/niv(eau|\.) 9/).filter({ visible: true }).first()).toBeVisible()

    await openMenu(page)
    await page.getByRole('button', { name: "Restaurer l'original" }).filter({ visible: true }).click()
    await expect(page.getByRole('dialog')).toContainText("Restaurer la fiche d'origine ?")
    await page.getByRole('dialog').getByRole('button', { name: 'Restaurer' }).click()
    await expect(page.getByText(/niv(eau|\.) 6/).filter({ visible: true }).first()).toBeVisible()
  })

  test('fiche créée : pas de « Restaurer l\'original »', async ({ page }) => {
    await page.goto('/personnages/nouveau')
    await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Ilda')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await openMenu(page)
    await expect(page.getByRole('button', { name: 'Exporter (fichier)' }).filter({ visible: true })).toBeVisible()
    await expect(page.getByRole('button', { name: "Restaurer l'original" }).filter({ visible: true })).toHaveCount(0)
  })

  test('fiche de départ supprimée : restaurable depuis la liste', async ({ page }) => {
    await page.goto('/personnages/kael-draven')
    await openMenu(page)
    await page.getByRole('button', { name: 'Supprimer', exact: true }).filter({ visible: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click()
    await expect(page.getByRole('heading', { name: 'Fiches de départ supprimées' })).toBeVisible()
    await page.getByRole('button', { name: 'Restaurer Kael Draven' }).click()
    await expect(page.getByText('6 personnages consignés')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Fiches de départ supprimées' })).toHaveCount(0)
  })

  test('menu : Échap le ferme et rend le focus au bouton', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval')
    await openMenu(page)
    const toggle = page.getByRole('button', { name: 'Autres actions' }).filter({ visible: true })
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toBeFocused()
  })
})
