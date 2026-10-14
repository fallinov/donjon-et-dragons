import { describe, expect, it } from 'vitest'
import { base64Size, checkDeposit, expiresAt, RATE_WINDOW_MS, rateWindow, TRANSFER_MAX_BYTES, TRANSFER_TTL_MS } from '~~/server/utils/transferRules'
import { createMemoryStore, rateKey } from '~~/server/utils/transferStore'

const ID = 'a'.repeat(64)
const now = new Date('2026-10-14T12:30:00Z')

describe('règles du relais', () => {
  it('accepte un dépôt valide', () => {
    expect(checkDeposit({ id: ID, data: 'AAAA' })).toEqual({ ok: true, id: ID, data: 'AAAA' })
  })

  it('refuse identifiant, contenu ou corps invalides (400)', () => {
    for (const body of [null, 'x', { id: 'abc', data: 'AAAA' }, { id: 'A'.repeat(64), data: 'AAAA' }, { id: ID }, { id: ID, data: '' }, { id: ID, data: 'AAA' }, { id: ID, data: 'AA$A' }]) {
      expect(checkDeposit(body)).toMatchObject({ ok: false, status: 400 })
    }
  })

  it('refuse plus de 2 Mo (413)', () => {
    const tooBig = 'A'.repeat(Math.ceil((TRANSFER_MAX_BYTES + 3) / 3) * 4)
    expect(checkDeposit({ id: ID, data: tooBig })).toMatchObject({ ok: false, status: 413 })
    const max = 'A'.repeat((TRANSFER_MAX_BYTES / 3 | 0) * 4)
    expect(checkDeposit({ id: ID, data: max }).ok).toBe(true)
  })

  it('taille base64 décodée', () => {
    expect([base64Size('AAAA'), base64Size('AAA='), base64Size('AA==')]).toEqual([3, 2, 1])
  })

  it('expire 24 h après le dépôt ; fenêtre de limitation à l\'heure', () => {
    expect(expiresAt(now).getTime() - now.getTime()).toBe(TRANSFER_TTL_MS)
    expect(TRANSFER_TTL_MS).toBe(24 * 3600 * 1000)
    expect(rateWindow(now).toISOString()).toBe('2026-10-14T12:00:00.000Z')
    expect(RATE_WINDOW_MS).toBe(3600 * 1000)
  })
})

describe('stockage mémoire', () => {
  it('dépôt, lecture, expiration', async () => {
    const store = createMemoryStore()
    const expires = expiresAt(new Date())
    expect(await store.put(ID, 'AAAA', expires)).toBe(true)
    expect(await store.get(ID, new Date())).toEqual({ data: 'AAAA', expiresAt: expires })
    expect(await store.get(ID, new Date(expires.getTime() + 1))).toBeNull()
    expect(await store.get('b'.repeat(64), new Date())).toBeNull()
  })

  it('refuse un identifiant encore vivant (409), accepte un identifiant expiré', async () => {
    const store = createMemoryStore()
    expect(await store.put(ID, 'AAAA', expiresAt(new Date()))).toBe(true)
    expect(await store.put(ID, 'BBBB', expiresAt(new Date()))).toBe(false)
    const other = 'c'.repeat(64)
    await store.put(other, 'AAAA', new Date(Date.now() - 1))
    expect(await store.put(other, 'BBBB', expiresAt(new Date()))).toBe(true)
  })

  it('nettoyage des transferts expirés', async () => {
    const store = createMemoryStore()
    await store.put(ID, 'AAAA', new Date(Date.now() - 1000))
    await store.deleteExpired(new Date())
    expect(await store.put(ID, 'BBBB', expiresAt(new Date()))).toBe(true)
  })

  it('compteurs par fenêtre d\'une heure', async () => {
    const store = createMemoryStore()
    const key = rateKey('deposit', '203.0.113.7')
    expect(await store.hit(key, now)).toBe(1)
    expect(await store.hit(key, new Date(now.getTime() + 60_000))).toBe(2)
    expect(await store.hit(key, new Date(now.getTime() + RATE_WINDOW_MS))).toBe(1)
  })

  it('clé de limitation : IP pseudonymisée, distincte par action', () => {
    const key = rateKey('deposit', '203.0.113.7')
    expect(key).not.toContain('203.0.113.7')
    expect(key).toMatch(/^deposit:[0-9a-f]{64}$/)
    expect(rateKey('read', '203.0.113.7')).toBe(key.replace('deposit:', 'read:'))
    expect(rateKey('deposit', '203.0.113.8')).not.toBe(key)
  })
})
