/** Alphabet base32 de Crockford : sans I, L, O ni U, pour éviter les confusions à la saisie. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** Longueur d'un code de transfert : 8 caractères, soit 40 bits. */
export const TRANSFER_CODE_LENGTH = 8

/** Nouveau code aléatoire (8 caractères, sans tiret). */
export function generateCode(random: (bytes: Uint8Array) => Uint8Array = b => crypto.getRandomValues(b)): string {
  const bytes = random(new Uint8Array(TRANSFER_CODE_LENGTH))
  // 256 est un multiple de 32 : le modulo ne biaise pas le tirage
  return Array.from(bytes, b => ALPHABET[b % 32]).join('')
}

/**
 * Code saisi → forme canonique : majuscules, sans espaces ni tirets,
 * O lu comme 0, I et L lus comme 1 (base32 de Crockford).
 */
export function normalizeCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
}

export function isValidCode(code: string): boolean {
  return code.length === TRANSFER_CODE_LENGTH && [...code].every(c => ALPHABET.includes(c))
}

/** Affichage en deux groupes : « K7P4-QX9M ». */
export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}
