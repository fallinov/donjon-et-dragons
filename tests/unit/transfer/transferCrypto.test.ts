import { describe, expect, it } from 'vitest'
import { decryptTransfer, encryptTransfer, PBKDF2_ITERATIONS, transferId } from '~/utils/transferCrypto'

const FAST = 1_000

describe('chiffrement d\'un transfert', () => {
  it('aller-retour avec le bon code', async () => {
    const text = JSON.stringify({ format: 'codex-dnd/character', nom: 'Zanna', accents: 'éèàç' })
    const data = await encryptTransfer(text, 'K7P4QX9M', FAST)
    expect(await decryptTransfer(data, 'K7P4QX9M', FAST)).toBe(text)
  })

  it('le contenu chiffré ne contient pas le texte', async () => {
    const data = await encryptTransfer('Zanna la gnome', 'K7P4QX9M', FAST)
    expect(new TextDecoder().decode(data)).not.toContain('Zanna')
  })

  it('deux chiffrements du même texte diffèrent (IV aléatoire)', async () => {
    const a = new Uint8Array(await encryptTransfer('x', 'K7P4QX9M', FAST))
    const b = new Uint8Array(await encryptTransfer('x', 'K7P4QX9M', FAST))
    expect(a).not.toEqual(b)
  })

  it('mauvais code ou contenu altéré : null', async () => {
    const data = await encryptTransfer('secret', 'K7P4QX9M', FAST)
    expect(await decryptTransfer(data, 'K7P4QX9N', FAST)).toBeNull()
    const altered = new Uint8Array(data)
    altered[altered.length - 1] ^= 1
    expect(await decryptTransfer(altered.buffer, 'K7P4QX9M', FAST)).toBeNull()
    expect(await decryptTransfer(new ArrayBuffer(4), 'K7P4QX9M', FAST)).toBeNull()
  })

  it('identifiant : SHA-256 hexadécimal stable, différent du code', async () => {
    const id = await transferId('K7P4QX9M')
    expect(id).toMatch(/^[0-9a-f]{64}$/)
    expect(await transferId('K7P4QX9M')).toBe(id)
    expect(await transferId('K7P4QX9N')).not.toBe(id)
  })

  it('itérations par défaut : 600 000 (aller-retour réel)', async () => {
    expect(PBKDF2_ITERATIONS).toBe(600_000)
    const data = await encryptTransfer('fiche', 'ABCD1234')
    expect(await decryptTransfer(data, 'ABCD1234')).toBe('fiche')
  })
})
