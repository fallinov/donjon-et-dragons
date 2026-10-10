import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { deepEqual } from '~/utils/deepEqual'

describe('deepEqual', () => {
  it('compare objets et tableaux imbriqués', () => {
    expect(deepEqual({ a: [1, { b: 'x' }] }, { a: [1, { b: 'x' }] })).toBe(true)
    expect(deepEqual({ a: [1, { b: 'x' }] }, { a: [1, { b: 'y' }] })).toBe(false)
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
  })

  it('compare les octets des ArrayBuffer', () => {
    expect(deepEqual(new Uint8Array([1, 2]).buffer, new Uint8Array([1, 2]).buffer)).toBe(true)
    expect(deepEqual(new Uint8Array([1, 2]).buffer, new Uint8Array([1, 3]).buffer)).toBe(false)
    expect(deepEqual(new Uint8Array([1]).buffer, [1])).toBe(false)
  })

  it('traite undefined comme une propriété absente et NaN comme égal à NaN', () => {
    expect(deepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(true)
    expect(deepEqual({ n: Number.NaN }, { n: Number.NaN })).toBe(true)
  })

  it('compare un proxy réactif à sa copie', () => {
    const state = reactive({ items: [{ name: 'Corde' }] })
    expect(deepEqual(state, { items: [{ name: 'Corde' }] })).toBe(true)
  })

  it('distingue null, objet et primitive', () => {
    expect(deepEqual(null, {})).toBe(false)
    expect(deepEqual('1', 1)).toBe(false)
  })
})
