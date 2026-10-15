import { test, expect, type APIRequestContext, type Page } from './fixtures'
import { apiLogin, createPlayer } from './accounts'
import { savedHp } from './storage'

/** Modifications locales pas encore envoyées (store `outbox`). */
function outboxCount(page: Page): Promise<number> {
  return page.evaluate(() => new Promise<number>((resolve) => {
    const open = indexedDB.open('codex')
    open.onsuccess = () => {
      const request = open.result.transaction('outbox').objectStore('outbox').count()
      request.onsuccess = () => {
        open.result.close()
        resolve(request.result)
      }
    }
  }))
}

/** Fiches enregistrées sur l'appareil. */
function localCount(page: Page): Promise<number> {
  return page.evaluate(() => new Promise<number>((resolve) => {
    const open = indexedDB.open('codex')
    open.onsuccess = () => {
      const request = open.result.transaction('characters').objectStore('characters').count()
      request.onsuccess = () => {
        open.result.close()
        resolve(request.result)
      }
    }
  }))
}

async function serverHp(request: APIRequestContext, id: string): Promise<number | undefined> {
  const { rows } = await (await request.get('/api/sync?since=0')).json() as { rows: { id: string, state: { hpCurrent: number } | null }[] }
  return rows.find(row => row.id === id)?.state?.hpCurrent
}

const hpBar = (page: Page) => page.getByRole('progressbar', { name: /points de vie/ })

async function openCombat(page: Page, id: string): Promise<void> {
  await page.goto(`/personnages/${id}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const combat = page.getByRole('button', { name: 'Combat', exact: true })
  if (await combat.isVisible()) await combat.dispatchEvent('click')
}

test.describe('Synchronisation des fiches', () => {
  test('le master attribue Zanna ; le joueur joue hors ligne, ses PV arrivent chez le master ; la fiche des autres est en lecture seule', async ({ page, newDevice }) => {
    // Première synchronisation du master : les 6 fiches de départ partent sur le serveur
    await page.goto('/')
    await expect(page.getByText('6 personnages consignés')).toBeVisible()
    await expect.poll(async () => (await (await page.request.get('/api/sync?since=0')).json() as { rows: unknown[] }).rows.length, { timeout: 20_000 }).toBe(6)

    const myriam = await createPlayer(page.request, 'myriam')
    await page.goto('/comptes')
    await page.locator('[data-sheet-owner="zanna"]').getByRole('combobox').selectOption({ label: myriam.username })
    await expect(page.locator('[data-owner-message]')).toHaveText('Fiche attribuée.')

    // Le téléphone de Myriam
    const phone = await newDevice({ signedIn: false })
    await apiLogin(phone.request, myriam.username, myriam.password)
    expect((await phone.request.post('/api/auth/password', { data: { current: myriam.password, next: 'zanna-la-barde' } })).status()).toBe(200)
    const player = await phone.newPage()
    await player.goto('/')
    await expect(player.getByText('6 personnages consignés')).toBeVisible({ timeout: 20_000 })

    // Fiche d'un autre : lecture seule, ni Modifier ni boutons de PV
    await openCombat(player, 'dareth-brumeval')
    await expect(player.locator('[data-owner-notice]')).toHaveText('Fiche de mj-test — lecture seule')
    await expect(player.getByRole('link', { name: 'Modifier' })).toHaveCount(0)
    await expect(player.getByRole('button', { name: /Diminuer points de vie/i })).toBeDisabled()
    await player.goto('/personnages/dareth-brumeval/modifier')
    await expect(player).toHaveURL(/\/personnages\/dareth-brumeval$/)

    // Sa fiche : modifiable (Modifier, sur l'onglet Profil en mobile), même hors ligne
    await player.goto('/personnages/zanna')
    await expect(player.getByRole('link', { name: 'Modifier' }).filter({ visible: true })).toHaveCount(1)
    await expect(player.locator('[data-owner-notice]')).toHaveCount(0)
    await openCombat(player, 'zanna')
    const before = Number(await hpBar(player).getAttribute('aria-valuenow'))
    await phone.setOffline(true)
    const minus = player.getByRole('button', { name: /Diminuer points de vie/i })
    for (let i = 0; i < 3; i++) await minus.click()
    await expect(hpBar(player)).toHaveAttribute('aria-valuenow', String(before - 3))
    await expect.poll(() => savedHp(player, 'zanna')).toBe(before - 3)
    await expect.poll(() => outboxCount(player)).toBeGreaterThan(0)
    await phone.setOffline(false)
    await expect.poll(() => outboxCount(player), { timeout: 20_000 }).toBe(0)
    expect(await serverHp(page.request, 'zanna')).toBe(before - 3)

    // Le master reçoit les PV en ouvrant la fiche
    await openCombat(page, 'zanna')
    await expect(hpBar(page)).toHaveAttribute('aria-valuenow', String(before - 3), { timeout: 20_000 })
    await expect(page.locator('[data-owner-notice]')).toHaveText(`Fiche de ${myriam.username}`)

    // Et inversement : le master soigne Zanna, Myriam le voit
    await page.getByRole('button', { name: /Augmenter points de vie/i }).click()
    await expect.poll(() => outboxCount(page), { timeout: 20_000 }).toBe(0)
    await openCombat(player, 'zanna')
    await expect(hpBar(player)).toHaveAttribute('aria-valuenow', String(before - 2), { timeout: 20_000 })
  })

  test('déconnexion : les fiches sont retirées de l\'appareil et reviennent à la connexion', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('6 personnages consignés')).toBeVisible()
    await expect.poll(() => outboxCount(page), { timeout: 20_000 }).toBe(0)
    await page.locator('[data-auth-bar]').getByRole('button', { name: 'Se déconnecter' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Se déconnecter' }).click()
    await expect(page).toHaveURL(/\/connexion$/)
    expect(await localCount(page)).toBe(0)

    await page.getByLabel('Identifiant').fill('mj-test')
    await page.getByLabel('Mot de passe', { exact: true }).fill('mot-de-passe-du-mj')
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page.getByText('6 personnages consignés')).toBeVisible({ timeout: 20_000 })
  })
})
