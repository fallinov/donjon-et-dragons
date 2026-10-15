import { test, expect, type Page } from './fixtures'
import { apiLogin, createPlayer, ensureMaster, MASTER, uniqueName } from './accounts'

async function loginWithForm(page: Page, username: string, password: string): Promise<void> {
  await page.getByLabel('Identifiant').fill(username)
  await page.getByLabel('Mot de passe', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
}

// Parcours de connexion : le test commence sans session, le master est créé par l'API
test.use({ signedIn: false })

test.beforeEach(async ({ request }) => {
  await ensureMaster(request)
})

test.describe('Comptes', () => {
  test('installation déjà faite : renvoie vers la connexion', async ({ page }) => {
    await page.goto('/installation')
    await expect(page.locator('[data-setup-done]')).toBeVisible()
    await expect(page.locator('[data-setup-form]')).toHaveCount(0)
  })

  test('le master crée un compte ; le joueur change son mot de passe provisoire puis se déconnecte', async ({ page, newDevice }) => {
    await page.goto('/comptes')
    await expect(page).toHaveURL(/\/connexion\?suite=\/comptes$/)
    await loginWithForm(page, MASTER.username, MASTER.password)
    await expect(page).toHaveURL(/\/comptes$/)

    const name = uniqueName('myriam')
    await page.getByLabel('Identifiant du joueur').fill(name.toUpperCase())
    await page.getByRole('button', { name: 'Créer le compte' }).click()
    const issued = page.locator('[data-issued-password]')
    await expect(issued).toContainText(`Mot de passe provisoire de ${name}`)
    const password = (await issued.locator('[data-password-value]').textContent())!.trim()
    expect(password).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/)
    await expect(page.locator(`[data-account="${name}"]`)).toContainText('Mot de passe provisoire')

    // Le joueur, sur son propre téléphone
    const player = await (await newDevice({ signedIn: false })).newPage()
    await player.goto('/connexion')
    await loginWithForm(player, `  ${name} `, password)
    await expect(player).toHaveURL(/\/mot-de-passe$/)
    await expect(player.getByText('Ton mot de passe est provisoire')).toBeVisible()
    // Tant que le mot de passe est provisoire, l'accueil renvoie ici
    await player.goto('/')
    await expect(player).toHaveURL(/\/mot-de-passe$/)

    await player.getByLabel('Mot de passe actuel').fill(password)
    await player.getByLabel('Nouveau mot de passe', { exact: true }).fill('court')
    await player.getByLabel('Confirmer le nouveau mot de passe').fill('court')
    await player.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(player.locator('[data-auth-error]')).toHaveText('Le mot de passe doit compter au moins 8 caractères.')

    await player.getByLabel('Nouveau mot de passe', { exact: true }).fill('zanna-la-barde')
    await player.getByLabel('Confirmer le nouveau mot de passe').fill('zanna-la-barde')
    await player.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(player).toHaveURL(/\/$/)
    const bar = player.locator('[data-auth-bar]')
    await expect(bar).toContainText(`Connecté : ${name}`)
    await expect(bar.getByRole('link', { name: 'Comptes' })).toHaveCount(0)

    await bar.getByRole('button', { name: 'Se déconnecter' }).click()
    await expect(player.getByRole('dialog')).toContainText('Les fiches seront retirées de cet appareil')
    await player.getByRole('dialog').getByRole('button', { name: 'Se déconnecter' }).click()
    await expect(player).toHaveURL(/\/connexion$/)
    // Sans compte, l'app renvoie à la connexion
    await player.goto('/')
    await expect(player).toHaveURL(/\/connexion$/)
    await loginWithForm(player, name, 'zanna-la-barde')
    await expect(player).toHaveURL(/\/$/)

    await page.reload()
    await expect(page.locator(`[data-account="${name}"]`)).not.toContainText('Mot de passe provisoire')
  })

  test('mauvais mot de passe : message clair, même message pour un identifiant inconnu', async ({ page }) => {
    await page.goto('/connexion')
    await loginWithForm(page, MASTER.username, 'pas-le-bon')
    await expect(page.locator('[data-auth-error]')).toHaveText('Identifiant ou mot de passe incorrect.')
    await loginWithForm(page, 'personne-ici', 'pas-le-bon')
    await expect(page.locator('[data-auth-error]')).toHaveText('Identifiant ou mot de passe incorrect.')
    await expect(page).toHaveURL(/\/connexion$/)
  })

  test('un joueur n\'accède pas aux comptes (page et API)', async ({ page, api }) => {
    const master = await api()
    await apiLogin(master, MASTER.username, MASTER.password)
    const player = await createPlayer(master)

    await apiLogin(page.request, player.username, player.password)
    await page.request.post('/api/auth/password', { data: { current: player.password, next: 'nouveau-mdp' } })
    expect((await page.request.get('/api/users')).status()).toBe(403)
    expect((await page.request.post('/api/users', { data: { username: 'intrus' } })).status()).toBe(403)
    await page.goto('/comptes')
    await expect(page).toHaveURL(/\/$/)
  })

  test('réinitialisation : sessions du joueur fermées, ancien mot de passe refusé ; suppression du compte', async ({ page, api }) => {
    const player = await api()
    await apiLogin(page.request, MASTER.username, MASTER.password)
    const account = await createPlayer(page.request, 'sandra')
    await apiLogin(player, account.username, account.password)
    expect((await player.post('/api/auth/password', { data: { current: account.password, next: 'maera-vifbois' } })).status()).toBe(200)

    await page.goto('/comptes')
    const row = page.locator(`[data-account="${account.username}"]`)
    await row.getByRole('button', { name: 'Réinitialiser' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Réinitialiser' }).click()
    const issued = page.locator('[data-issued-password]')
    await expect(issued).toContainText(account.username)
    const fresh = (await issued.locator('[data-password-value]').textContent())!.trim()

    expect(await (await player.get('/api/auth/me')).json()).toEqual({ user: null })
    expect((await player.post('/api/auth/login', { data: { username: account.username, password: 'maera-vifbois' } })).status()).toBe(401)
    await apiLogin(player, account.username, fresh)
    expect(await (await player.get('/api/auth/me')).json()).toMatchObject({ user: { username: account.username, mustChangePassword: true } })

    await row.getByRole('button', { name: 'Supprimer' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click()
    await expect(row).toHaveCount(0)
    expect(await (await player.get('/api/auth/me')).json()).toEqual({ user: null })
    expect((await player.post('/api/auth/login', { data: { username: account.username, password: fresh } })).status()).toBe(401)
    // Identifiant malformé : introuvable, pas d'erreur serveur
    expect((await page.request.delete('/api/users/abc')).status()).toBe(404)
    expect((await page.request.post('/api/users/abc/reset-password', { data: {} })).status()).toBe(404)
  })

  test('le master renomme un joueur puis le passe master, et inversement', async ({ page, api }) => {
    await apiLogin(page.request, MASTER.username, MASTER.password)
    const account = await createPlayer(page.request, 'kael')
    const other = await createPlayer(page.request, 'jerome')
    const player = await api()
    await apiLogin(player, account.username, account.password)
    expect((await player.post('/api/auth/password', { data: { current: account.password, next: 'kael-draven' } })).status()).toBe(200)

    await page.goto('/comptes')
    const row = page.locator(`[data-account="${account.username}"]`)
    await row.getByRole('button', { name: 'Renommer' }).click()
    const field = row.getByLabel(`Nouvel identifiant de ${account.username}`)
    await field.fill(other.username)
    await row.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.locator('[data-list-error]')).toHaveText('Cet identifiant est déjà pris.')

    const renamed = `${account.username}-r`
    await field.fill(renamed)
    await row.getByRole('button', { name: 'Enregistrer' }).click()
    const renamedRow = page.locator(`[data-account="${renamed}"]`)
    await expect(renamedRow).toBeVisible()
    // Le joueur reste connecté ; il se reconnecte avec son nouvel identifiant
    expect(await (await player.get('/api/auth/me')).json()).toMatchObject({ user: { username: renamed } })
    expect((await player.post('/api/auth/login', { data: { username: account.username, password: 'kael-draven' } })).status()).toBe(401)
    await apiLogin(player, renamed, 'kael-draven')

    expect((await player.get('/api/users')).status()).toBe(403)
    await renamedRow.getByRole('button', { name: `Passer ${renamed} en master` }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Passer master' }).click()
    await expect(renamedRow).toContainText('Master')
    expect((await player.get('/api/users')).status()).toBe(200)

    await renamedRow.getByRole('button', { name: `Passer ${renamed} en joueur` }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Passer joueur' }).click()
    await expect(renamedRow).toContainText('Joueur')
    expect((await player.get('/api/users')).status()).toBe(403)
  })

  test('protection CSRF : autre origine refusée, JSON obligatoire', async ({ request }) => {
    const data = { username: MASTER.username, password: MASTER.password }
    expect((await request.post('/api/auth/login', { data, headers: { Origin: 'https://evil.example' } })).status()).toBe(403)
    expect((await request.post('/api/auth/login', { form: data })).status()).toBe(415)
    expect((await request.post('/api/auth/login', { data, headers: { Origin: 'http://localhost:3210' } })).status()).toBe(200)
  })

  test('cookie de session httpOnly, SameSite=Lax', async ({ page }) => {
    await apiLogin(page.request, MASTER.username, MASTER.password)
    const cookie = (await page.context().cookies()).find(c => c.name === 'codex_session')
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax' })
    expect(cookie!.expires * 1000 - Date.now()).toBeGreaterThan(89 * 24 * 3600 * 1000)
  })
})
