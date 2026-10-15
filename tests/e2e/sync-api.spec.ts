import { test, expect, type APIRequestContext, type Page } from './fixtures'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { apiLogin, createPlayer, ensureMaster, MASTER } from './accounts'

type CharacterFile = { character: { id: string, firstName: string } } & Record<string, unknown>

/** Fichier de fiche réel, exporté depuis l'app (même format que l'envoi de synchronisation). */
async function exportFile(page: Page, id: string): Promise<CharacterFile> {
  await page.goto(`/personnages/${id}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Autres actions' }).filter({ visible: true }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter (fichier)' }).filter({ visible: true }).click()
  return JSON.parse(await readFile(await (await download).path(), 'utf8')) as CharacterFile
}

/** Copie de la fiche sous un nouvel identifiant : chaque test a ses fiches (serveur partagé). */
const withId = (file: CharacterFile, id: string): CharacterFile => ({ ...file, character: { ...file.character, id } })

const now = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString()
const state = (hp: number) => ({ hpCurrent: hp, hpTemp: 0, inspiration: 0, hitDiceUsed: 0, deathSaves: { successes: 0, failures: 0 }, spellSlotsUsed: [], dailySpellsUsed: [] })

async function push(request: APIRequestContext, changes: Record<string, unknown>[]): Promise<string[]> {
  const response = await request.post('/api/sync', { data: { changes } })
  expect(response.status()).toBe(200)
  return ((await response.json()) as { results: { status: string }[] }).results.map(r => r.status)
}

async function pullAll(request: APIRequestContext): Promise<{ id: string, ownerId: string | null, stateAt: string | null, state: unknown, portraitHash: string | null }[]> {
  const rows = []
  let since = 0
  for (;;) {
    const page = await (await request.get(`/api/sync?since=${since}`)).json() as { rows: [], cursor: number, more: boolean }
    rows.push(...page.rows)
    since = page.cursor
    if (!page.more) return rows
  }
}

test.describe('API de synchronisation', () => {
  test('droits : le master écrit partout, un joueur sur ses fiches seulement', async ({ page, api }) => {
    const base = await exportFile(page, 'zanna')
    const ctx = api
    const master = await ctx()
    const myriam = await ctx()
    const juan = await ctx()
    await ensureMaster(master)
    await apiLogin(master, MASTER.username, MASTER.password)
    const accounts = [await createPlayer(master, 'myriam'), await createPlayer(master, 'juan')]
    for (const [request, account] of [[myriam, accounts[0]!], [juan, accounts[1]!]] as const) {
      await apiLogin(request, account.username, account.password)
      // Mot de passe provisoire : la synchronisation est refusée tant qu'il n'est pas changé
      expect((await request.get('/api/sync')).status()).toBe(403)
      await request.post('/api/auth/password', { data: { current: account.password, next: 'mot-de-passe-test' } })
    }

    // Fiche du groupe créée par le master, puis attribuée à Myriam
    const id = randomUUID()
    expect(await push(master, [{ id, part: 'sheet', data: withId(base, id), changedAt: now() }])).toEqual(['applied'])
    expect(await push(myriam, [{ id, part: 'state', data: state(12), changedAt: now() }])).toEqual(['forbidden'])
    expect((await myriam.patch(`/api/characters/${id}/owner`, { data: { ownerId: accounts[0]!.id } })).status()).toBe(403)
    expect((await master.patch(`/api/characters/${id}/owner`, { data: { ownerId: accounts[0]!.id } })).status()).toBe(200)
    expect(await push(myriam, [{ id, part: 'state', data: state(12), changedAt: now() }])).toEqual(['applied'])
    expect(await push(juan, [
      { id, part: 'state', data: state(1), changedAt: now() },
      { id, part: 'delete', changedAt: now() },
    ])).toEqual(['forbidden', 'forbidden'])

    // Fiche créée par Juan : elle lui appartient ; état avant la fiche : notFound
    const own = randomUUID()
    expect(await push(juan, [
      { id: own, part: 'state', data: state(5), changedAt: now() },
      { id: own, part: 'sheet', data: withId(base, own), changedAt: now() },
      { id: own, part: 'state', data: state(5), changedAt: now() },
    ])).toEqual(['notFound', 'applied', 'applied'])
    // Fiche de départ, ou tout autre slug : seul un master peut la créer
    const kael = await exportFile(page, 'kael-draven')
    expect(await push(juan, [
      { id: 'kael-draven', part: 'sheet', data: kael, changedAt: now() },
      { id: 'heros-squatte', part: 'sheet', data: withId(kael, 'heros-squatte'), changedAt: now() },
    ])).toEqual(['forbidden', 'forbidden'])
    // Identifiant du fichier différent de celui annoncé, données abîmées : refusés
    expect(await push(juan, [
      { id: randomUUID(), part: 'sheet', data: base, changedAt: now() },
      { id: own, part: 'state', data: { hpCurrent: 'x' }, changedAt: now() },
      { id: own, part: 'state', data: state(5), changedAt: 'hier' },
    ])).toEqual(['invalid', 'invalid', 'invalid'])

    // Tout le monde lit toutes les fiches, avec leur propriétaire
    const rows = await pullAll(myriam)
    expect(rows.find(r => r.id === id)).toMatchObject({ ownerId: accounts[0]!.id, state: state(12) })
    expect(rows.find(r => r.id === own)).toMatchObject({ ownerId: accounts[1]!.id, state: state(5) })

    // Compte supprimé : ses fiches reviennent au groupe
    expect((await master.delete(`/api/users/${accounts[1]!.id}`)).status()).toBe(200)
    expect((await pullAll(master)).find(r => r.id === own)).toMatchObject({ ownerId: null })
  })

  test('dernière modification gagnante, curseur, portrait avec ETag', async ({ page, request }) => {
    const base = await exportFile(page, 'dareth-brumeval')
    await ensureMaster(request)
    await apiLogin(request, MASTER.username, MASTER.password)
    const id = randomUUID()
    const before = (await (await request.get('/api/sync?since=0')).json() as { cursor: number }).cursor

    expect(await push(request, [
      { id, part: 'sheet', data: withId(base, id), changedAt: now() },
      { id, part: 'state', data: state(30), changedAt: now() },
      { id, part: 'state', data: state(10), changedAt: now(-60_000) },
    ])).toEqual(['applied', 'applied', 'stale'])

    const rows = await pullAll(request)
    const row = rows.find(r => r.id === id)!
    expect(row.state).toEqual(state(30))
    expect(row.portraitHash).toMatch(/^[0-9a-f]{64}$/)

    // Curseur : seules les fiches modifiées depuis sont renvoyées
    const since = await (await request.get(`/api/sync?since=${before}`)).json() as { rows: { id: string }[] }
    expect(since.rows.map(r => r.id)).toContain(id)

    const portrait = await request.get(`/api/portraits/${id}`)
    expect(portrait.status()).toBe(200)
    expect(portrait.headers()['content-type']).toBe('image/jpeg')
    expect(portrait.headers().etag).toBe(`"${row.portraitHash}"`)
    expect((await portrait.body()).subarray(0, 2)).toEqual(Buffer.from([0xFF, 0xD8]))
    expect(portrait.headers()['x-content-type-options']).toBe('nosniff')
    expect(portrait.headers()['content-security-policy']).toContain('sandbox')
    expect((await request.get(`/api/portraits/${id}`, { headers: { 'If-None-Match': `"${row.portraitHash}"` } })).status()).toBe(304)
    expect((await request.get(`/api/portraits/${id}`, { headers: { 'If-None-Match': `"autre", W/"${row.portraitHash}"` } })).status()).toBe(304)

    // Suppression puis lecture : fiche marquée supprimée, portrait parti
    expect(await push(request, [{ id, part: 'delete', changedAt: now() }])).toEqual(['applied'])
    expect((await pullAll(request)).find(r => r.id === id)).toMatchObject({ state: null, portraitHash: null })
    expect((await request.get(`/api/portraits/${id}`)).status()).toBe(404)
  })

  test('sans session : 401 ; corps invalide : 400', async ({ request, api }) => {
    const anonymous = await api()
    expect((await anonymous.get('/api/sync')).status()).toBe(401)
    expect((await anonymous.post('/api/sync', { data: { changes: [] } })).status()).toBe(401)
    expect((await anonymous.get('/api/members')).status()).toBe(401)
    expect((await anonymous.get('/api/portraits/zanna')).status()).toBe(401)

    await ensureMaster(request)
    await apiLogin(request, MASTER.username, MASTER.password)
    expect((await request.post('/api/sync', { data: { changes: [] } })).status()).toBe(400)
    expect((await request.get('/api/sync?since=-1')).status()).toBe(400)
    const members = await (await request.get('/api/members')).json() as { members: { username: string, role: string }[] }
    expect(members.members).toContainEqual(expect.objectContaining({ username: MASTER.username, role: 'master' }))
    expect(JSON.stringify(members)).not.toContain('password')
  })
})
