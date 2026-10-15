import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'

/** Paramètres scrypt (recommandation OWASP : N = 2^17 ; 2^15 ici pour rester rapide sur une fonction Vercel). */
const PARAMS = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
const KEY_LENGTH = 32

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFC'), salt, KEY_LENGTH, options, (error, key) => error ? reject(error) : resolve(key))
  })
}

/** Hachage enregistré : `scrypt$N$r$p$sel$clé` (base64). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await derive(password, salt, PARAMS)
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), key.toString('base64')].join('$')
}

/** Compare en temps constant ; un hachage illisible ne correspond à aucun mot de passe. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, key] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !key) return false
  const expected = Buffer.from(key, 'base64')
  const actual = await derive(password, Buffer.from(salt, 'base64'), { N: Number(n), r: Number(r), p: Number(p), maxmem: PARAMS.maxmem })
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

let dummy: Promise<string> | undefined

/** Identifiant inconnu : même calcul qu'un vrai essai, pour ne pas révéler par la durée qu'il n'existe pas. */
export async function verifyDummy(password: string): Promise<false> {
  await verifyPassword(password, await (dummy ??= hashPassword('codex-dummy-password')))
  return false
}
