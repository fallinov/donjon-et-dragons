function bytesEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false
  const left = new Uint8Array(a)
  const right = new Uint8Array(b)
  for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return false
  return true
}

/**
 * Égalité structurelle de données de fiche (objets simples, tableaux, ArrayBuffer,
 * primitives). Une propriété `undefined` équivaut à une propriété absente ; NaN égale NaN.
 * Parcourt les proxys réactifs sans `toRaw` : utilisée dans un `computed`, elle
 * suit ainsi chaque propriété lue (sinon le `computed` ne se recalcule jamais).
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (a instanceof ArrayBuffer || b instanceof ArrayBuffer) {
    return a instanceof ArrayBuffer && b instanceof ArrayBuffer && bytesEqual(a, b)
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, i) => deepEqual(item, b[i]))
  }
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false
  }
  return true
}
