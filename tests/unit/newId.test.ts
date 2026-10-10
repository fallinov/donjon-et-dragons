import { describe, expect, it } from 'vitest'
import { newId } from '~/utils/newId'

describe('newId', () => {
  it('produit un UUID v4 valide', () => {
    expect(newId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('ne se répète pas', () => {
    const ids = new Set(Array.from({ length: 200 }, newId))
    expect(ids.size).toBe(200)
  })
})
