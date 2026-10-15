import { test, expect } from './fixtures'
import { webcrypto } from 'node:crypto'

/** Identifiant aléatoire au format attendu (empreinte SHA-256 hexadécimale). */
function randomId(): string {
  return Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString('hex')
}

test.describe('API du relais de transfert', () => {
  test('dépôt puis lecture pendant 24 h', async ({ request }) => {
    const id = randomId()
    const data = Buffer.from('contenu chiffré').toString('base64')
    const deposit = await request.post('/api/transfers', { data: { id, data } })
    expect(deposit.status()).toBe(200)
    const { expiresAt } = await deposit.json() as { expiresAt: string }
    const ttl = new Date(expiresAt).getTime() - Date.now()
    expect(ttl).toBeGreaterThan(23.9 * 3600_000)
    expect(ttl).toBeLessThanOrEqual(24 * 3600_000)

    const read = await request.get(`/api/transfers/${id}`)
    expect(read.status()).toBe(200)
    expect(read.headers()['cache-control']).toBe('no-store')
    expect(await read.json()).toEqual({ data, expiresAt })
    // Plusieurs récupérations possibles
    expect((await request.get(`/api/transfers/${id}`)).status()).toBe(200)
  })

  test('identifiant déjà utilisé : 409', async ({ request }) => {
    const id = randomId()
    expect((await request.post('/api/transfers', { data: { id, data: 'AAAA' } })).status()).toBe(200)
    expect((await request.post('/api/transfers', { data: { id, data: 'BBBB' } })).status()).toBe(409)
  })

  test('identifiant inconnu : 404 ; invalide : 400', async ({ request }) => {
    expect((await request.get(`/api/transfers/${randomId()}`)).status()).toBe(404)
    expect((await request.get('/api/transfers/pas-un-identifiant')).status()).toBe(400)
    expect((await request.post('/api/transfers', { data: { id: 'x', data: 'AAAA' } })).status()).toBe(400)
  })

  test('plus de 2 Mo : 413', async ({ request }) => {
    const data = Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64')
    expect((await request.post('/api/transfers', { data: { id: randomId(), data } })).status()).toBe(413)
  })

  test('nettoyage quotidien : répond sans rien exposer', async ({ request }) => {
    const response = await request.get('/api/cron/transfers-cleanup')
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })
})
