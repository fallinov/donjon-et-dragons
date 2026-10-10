import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))

test.describe('Portrait', () => {
  test('une photo de 2000 × 2667 px est réduite à 768 × 1024 et conservée', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval/modifier')
    const preview = page.locator('[data-portrait-preview]')
    const before = await preview.getAttribute('src')

    await page.locator('[data-portrait-input]').setInputFiles(fixture('portrait-2000x2667.jpg'))
    await expect(preview).not.toHaveAttribute('src', before ?? '')
    await expect(page.locator('[data-portrait-status]')).toHaveText('')
    await expect.poll(() => preview.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight])).toEqual([768, 1024])

    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL(/\/personnages\/dareth-brumeval$/)
    await page.reload()
    const hero = page.locator('header img').filter({ visible: true }).first()
    await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && [img.naturalWidth, img.naturalHeight])).toEqual([768, 1024])
  })

  test('un fichier qui n\'est pas une image est refusé', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval/modifier')
    const preview = page.locator('[data-portrait-preview]')
    const before = await preview.getAttribute('src')
    await page.locator('[data-portrait-input]').setInputFiles(fixture('not-an-image.txt'))
    await expect(page.locator('[data-portrait-status]')).toHaveText("Ce fichier n'est pas une image.")
    await expect(preview).toHaveAttribute('src', before ?? '')
  })

  test('« Portrait par défaut » remet la silhouette', async ({ page }) => {
    await page.goto('/personnages/dareth-brumeval/modifier')
    const preview = page.locator('[data-portrait-preview]')
    const before = await preview.getAttribute('src')
    await page.getByRole('button', { name: 'Portrait par défaut' }).click()
    await expect(preview).not.toHaveAttribute('src', before ?? '')
    await expect.poll(() => preview.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL(/\/personnages\/dareth-brumeval$/)
  })
})
