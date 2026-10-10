import { toRaw } from 'vue'

/**
 * Copie sans proxy réactif, à n'importe quelle profondeur. IndexedDB et
 * `structuredClone` refusent les proxys, que Vue laisse dans un objet construit
 * en étalant un état réactif (`{ ...state, items: [...state.items] }`).
 * Les objets non simples (ArrayBuffer, Date…) sont repris tels quels.
 */
export function toPlain<T>(value: T): T {
  const raw = toRaw(value)
  if (Array.isArray(raw)) return raw.map(item => toPlain(item)) as T
  if (raw !== null && typeof raw === 'object' && Object.getPrototypeOf(raw) === Object.prototype) {
    return Object.fromEntries(Object.entries(raw).map(([key, item]) => [key, toPlain(item)])) as T
  }
  return raw
}
