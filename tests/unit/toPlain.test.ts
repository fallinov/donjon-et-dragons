import { describe, expect, it } from 'vitest'
import { isProxy, reactive } from 'vue'
import { toPlain } from '~/utils/toPlain'

describe('toPlain', () => {
  it('retire les proxys à toutes les profondeurs', () => {
    const state = reactive({ a: { b: [{ c: 1 }] } })
    const mixed = { ...state, list: [...state.a.b] }
    const plain = toPlain(mixed)
    expect(isProxy(plain.a)).toBe(false)
    expect(isProxy(plain.list[0])).toBe(false)
    expect(() => structuredClone(plain)).not.toThrow()
    expect(plain).toEqual({ a: { b: [{ c: 1 }] }, list: [{ c: 1 }] })
  })

  it('reprend tels quels les ArrayBuffer et les valeurs simples', () => {
    const data = new ArrayBuffer(3)
    const plain = toPlain(reactive({ portrait: { data }, n: 2, s: 'x', none: null }))
    expect(plain.portrait.data).toBe(data)
    expect(plain).toMatchObject({ n: 2, s: 'x', none: null })
  })

  it('ne modifie pas l\'objet d\'origine', () => {
    const source = reactive({ items: [{ name: 'Corde' }] })
    const plain = toPlain(source)
    plain.items[0]!.name = 'Torche'
    expect(source.items[0]!.name).toBe('Corde')
  })
})
