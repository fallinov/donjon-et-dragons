// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  generatePassword, isUserId, isValidPassword, isValidUsername, LOGIN_LIMITS, normalizeUsername, readCredentials,
  SESSION_REFRESH_MS, SESSION_TTL_MS,
} from '~~/server/utils/accountRules'
import { createMemoryAccountStore } from '~~/server/utils/accountStore'
import { MIGRATIONS } from '~~/server/utils/database'
import { hashPassword, verifyDummy, verifyPassword } from '~~/server/utils/password'

describe('règles des comptes', () => {
  it('identifiant : normalisé en minuscules, accents acceptés', () => {
    expect(normalizeUsername('  Jérôme ')).toBe('jérôme')
    // « é » décomposé (e + accent) → même identifiant que « é » composé
    expect(normalizeUsername('Jérôme')).toBe('jérôme')
    for (const ok of ['jérôme', 'mj', 'maera.vifbois', 'kael_draven-2']) expect(isValidUsername(ok)).toBe(true)
    for (const ko of ['', 'a', 'avec espace', 'a'.repeat(33), 'x@y', 'emoji🎲']) expect(isValidUsername(ko)).toBe(false)
  })

  it('mot de passe : 8 à 128 caractères', () => {
    expect(isValidPassword('1234567')).toBe(false)
    expect(isValidPassword('12345678')).toBe(true)
    expect(isValidPassword('é'.repeat(8))).toBe(true)
    expect(isValidPassword('x'.repeat(129))).toBe(false)
    expect(isValidPassword(12345678)).toBe(false)
  })

  it('mot de passe provisoire lisible, sans I, L, O ni U', () => {
    const password = generatePassword()
    expect(password).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/)
    expect(isValidPassword(password)).toBe(true)
    expect(generatePassword(() => 0)).toBe('0000-0000-0000')
    expect(new Set(Array.from({ length: 20 }, () => generatePassword())).size).toBe(20)
  })

  it('lecture des identifiants de connexion', () => {
    expect(readCredentials({ username: ' Steve ', password: 'secret' })).toEqual({ ok: true, username: 'steve', password: 'secret' })
    for (const body of [null, 'x', {}, { username: 'a' }, { username: 1, password: 'x' }, { username: 'a', password: 'x'.repeat(600) }]) {
      expect(readCredentials(body)).toEqual({ ok: false })
    }
  })

  it('session de 90 jours prolongée une fois par jour ; limites de connexion', () => {
    expect(SESSION_TTL_MS).toBe(90 * 24 * 3600 * 1000)
    expect(SESSION_REFRESH_MS).toBe(24 * 3600 * 1000)
    expect(LOGIN_LIMITS).toEqual({ account: 10, ip: 30, username: 100, setup: 10, password: 10 })
  })

  it('identifiant de compte : UUID uniquement', () => {
    expect(isUserId('0b5c5d3e-8f1a-4c2b-9d7e-1a2b3c4d5e6f')).toBe(true)
    for (const ko of ['abc', '', 1, '0B5C5D3E-8F1A-4C2B-9D7E-1A2B3C4D5E6F', '0b5c5d3e-8f1a-4c2b-9d7e-1a2b3c4d5e6f; DROP']) expect(isUserId(ko)).toBe(false)
  })
})

describe('hachage des mots de passe', () => {
  it('scrypt salé : vérifie le bon, refuse le mauvais', async () => {
    const hash = await hashPassword('dé-pipé-42')
    expect(hash).toMatch(/^scrypt\$32768\$8\$1\$/)
    expect(hash).not.toContain('dé-pipé-42')
    expect(await hashPassword('dé-pipé-42')).not.toBe(hash)
    expect(await verifyPassword('dé-pipé-42', hash)).toBe(true)
    expect(await verifyPassword('de-pipe-42', hash)).toBe(false)
    expect(await verifyPassword('dé-pipé-42', 'n\'importe quoi')).toBe(false)
    expect(await verifyDummy('x')).toBe(false)
  })
})

describe('stockage mémoire des comptes', () => {
  const newPlayer = (username: string) => ({ username, passwordHash: 'h', role: 'player' as const, mustChangePassword: true })

  it('un seul premier master', async () => {
    const store = createMemoryAccountStore()
    expect(await store.hasUsers()).toBe(false)
    const master = await store.createFirstMaster({ username: 'mj', passwordHash: 'h' })
    expect(master).toMatchObject({ username: 'mj', role: 'master', mustChangePassword: false })
    expect(await store.createFirstMaster({ username: 'autre', passwordHash: 'h' })).toBeNull()
    expect(await store.hasUsers()).toBe(true)
  })

  it('identifiant unique, liste dans l\'ordre de création, sans hachage', async () => {
    const store = createMemoryAccountStore()
    await store.createUser(newPlayer('myriam'))
    expect(await store.createUser(newPlayer('myriam'))).toBeNull()
    await store.createUser(newPlayer('juan'))
    const list = await store.listUsers()
    expect(list.map(u => u.username)).toEqual(['myriam', 'juan'])
    expect(list[0]).not.toHaveProperty('passwordHash')
  })

  it('sessions : expiration, prolongation, fermeture des autres sessions, suppression du compte', async () => {
    const store = createMemoryAccountStore()
    const user = (await store.createUser(newPlayer('sandra')))!
    const now = new Date('2026-10-15T10:00:00Z')
    const later = new Date(now.getTime() + 1000)
    await store.createSession('a', user.id, later)
    await store.createSession('b', user.id, later)
    expect((await store.findSession('a', now))?.user.username).toBe('sandra')
    expect(await store.findSession('a', later)).toBeNull()
    await store.extendSession('a', new Date(now.getTime() + 5000), now)
    expect(await store.findSession('a', later)).not.toBeNull()

    await store.deleteSessions(user.id, 'a')
    expect(await store.findSession('b', now)).toBeNull()
    expect(await store.findSession('a', now)).not.toBeNull()

    expect(await store.deleteUser(user.id)).toBe(true)
    expect(await store.findSession('a', now)).toBeNull()
    expect(await store.deleteUser(user.id)).toBe(false)
  })

  it('mot de passe remplacé, sessions et compteurs expirés purgés, compteur par heure', async () => {
    const store = createMemoryAccountStore()
    const user = (await store.createUser(newPlayer('normand')))!
    expect(await store.setPassword(user.id, 'h2', false)).toBe(true)
    expect(await store.getUser(user.id)).toMatchObject({ passwordHash: 'h2', mustChangePassword: false })
    expect(await store.setPassword('inconnu', 'h', false)).toBe(false)

    const now = new Date('2026-10-15T10:00:00Z')
    await store.createSession('old', user.id, now)
    await store.deleteExpired(now)
    expect(await store.findSession('old', new Date(0))).toBeNull()

    expect(await store.hit('k', now)).toBe(1)
    expect(await store.hit('k', now)).toBe(2)
    expect(await store.hit('k', new Date('2026-10-15T11:00:00Z'))).toBe(1)
    // Compteurs des heures passées purgés : l'heure courante est gardée
    await store.deleteExpired(new Date('2026-10-15T11:30:00Z'))
    expect(await store.hit('k', new Date('2026-10-15T11:00:00Z'))).toBe(2)
    expect(await store.hit('k', now)).toBe(1)
  })
})

describe('renommer et changer de rôle', () => {
  it('identifiant déjà pris refusé, renommage en lui-même accepté', async () => {
    const store = createMemoryAccountStore()
    const juan = (await store.createUser({ username: 'juan', passwordHash: 'h', role: 'player', mustChangePassword: false }))!
    await store.createUser({ username: 'thunon', passwordHash: 'h', role: 'player', mustChangePassword: false })
    expect(await store.updateUser(juan.id, { username: 'thunon' })).toBe('taken')
    expect(await store.updateUser(juan.id, { username: 'juan' })).toMatchObject({ username: 'juan' })
    expect(await store.updateUser(juan.id, { username: 'juan-t' })).toMatchObject({ username: 'juan-t', passwordHash: 'h' })
    expect(await store.findByUsername('juan')).toBeNull()
    expect(await store.updateUser('inconnu', { username: 'x' })).toBeNull()
  })

  it('le groupe garde toujours au moins un master', async () => {
    const store = createMemoryAccountStore()
    const steve = (await store.createFirstMaster({ username: 'steve', passwordHash: 'h' }))!
    const myriam = (await store.createUser({ username: 'myriam', passwordHash: 'h', role: 'player', mustChangePassword: false }))!
    expect(await store.updateUser(steve.id, { role: 'player' })).toBe('lastMaster')
    expect(await store.updateUser(myriam.id, { role: 'master' })).toMatchObject({ role: 'master' })
    expect(await store.updateUser(steve.id, { role: 'player' })).toMatchObject({ role: 'player' })
    expect(await store.updateUser(myriam.id, { role: 'player' })).toBe('lastMaster')
  })
})

describe('migrations', () => {
  it('chaque instruction peut être rejouée (IF NOT EXISTS, IF EXISTS)', () => {
    for (const statement of MIGRATIONS.flat()) expect(statement).toMatch(/IF (NOT )?EXISTS/)
    expect(MIGRATIONS.flat().some(s => s.includes('CREATE TABLE IF NOT EXISTS users'))).toBe(true)
  })
})
