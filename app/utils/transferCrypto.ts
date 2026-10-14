/**
 * Chiffrement d'une fiche transférée, côté téléphone. Le serveur ne reçoit que
 * l'identifiant (empreinte du code) et le contenu chiffré : il ne voit jamais le code.
 */

const ID_PREFIX = 'codex-transfer:id:'
const KEY_SALT = 'codex-transfer:key'
/** Itérations PBKDF2 : rend coûteux l'essai de tous les codes possibles sur un contenu volé. */
export const PBKDF2_ITERATIONS = 600_000
const IV_BYTES = 12

const encoder = new TextEncoder()

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('')
}

/** Identifiant de stockage : SHA-256 du code, en hexadécimal (64 caractères). */
export async function transferId(code: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(ID_PREFIX + code)))
}

async function deriveKey(code: string, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(code), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(KEY_SALT), iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** Texte → IV (12 octets) suivi du contenu chiffré AES-GCM. */
export async function encryptTransfer(text: string, code: string, iterations = PBKDF2_ITERATIONS): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await deriveKey(code, iterations)
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(text)))
  const out = new Uint8Array(IV_BYTES + cipher.length)
  out.set(iv)
  out.set(cipher, IV_BYTES)
  return out.buffer
}

/** Déchiffre ; renvoie null si le code est faux ou le contenu altéré (AES-GCM authentifie). */
export async function decryptTransfer(data: ArrayBuffer, code: string, iterations = PBKDF2_ITERATIONS): Promise<string | null> {
  const bytes = new Uint8Array(data)
  if (bytes.length <= IV_BYTES) return null
  try {
    const key = await deriveKey(code, iterations)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, IV_BYTES) }, key, bytes.subarray(IV_BYTES))
    return new TextDecoder().decode(plain)
  }
  catch {
    return null
  }
}
