import { describe, it, expect } from 'vitest'
import {
  addItem, defaultInventory, parseInventory, removeItem, setCoins, setItemQuantity,
} from '~/composables/useInventory'
import { darethBrumeval, zanna } from '../helpers/characters'

describe('defaultInventory', () => {
  it('reprend le sac de départ de Dareth', () => {
    const inv = defaultInventory(darethBrumeval)
    expect(inv.coins).toEqual({ cp: 24, sp: 75, ep: 7, gp: 360, pp: 0 })
    expect(inv.items.find(i => i.name === 'Torche')?.quantity).toBe(10)
    expect(inv.notes).toContain('Zhentarim')
  })

  it('donne un sac vide à un personnage sans inventaire', () => {
    const inv = defaultInventory({ ...zanna, inventory: undefined })
    expect(inv.items).toEqual([])
    expect(inv.coins).toEqual({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 })
    expect(inv.notes).toBe('')
  })

  it('donne un identifiant unique à chaque objet', () => {
    const ids = defaultInventory(darethBrumeval).items.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('opérations sur le sac', () => {
  const base = { items: [], coins: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 }, notes: '' }

  it('ajoute un objet et ignore un nom vide', () => {
    const inv = addItem(base, '  Lanterne  ', 2)
    expect(inv.items).toHaveLength(1)
    expect(inv.items[0]).toMatchObject({ name: 'Lanterne', quantity: 2 })
    expect(addItem(base, '   ')).toBe(base)
  })

  it('force une quantité d\'au moins 1 à l\'ajout', () => {
    expect(addItem(base, 'Corde', 0).items[0]!.quantity).toBe(1)
  })

  it('retire l\'objet quand sa quantité tombe à 0', () => {
    const inv = addItem(base, 'Torche', 1)
    const id = inv.items[0]!.id
    expect(setItemQuantity(inv, id, 3).items[0]!.quantity).toBe(3)
    expect(setItemQuantity(inv, id, 0).items).toHaveLength(0)
  })

  it('supprime un objet par son identifiant', () => {
    const inv = addItem(addItem(base, 'A'), 'B')
    const idA = inv.items[0]!.id
    expect(removeItem(inv, idA).items.map(i => i.name)).toEqual(['B'])
  })

  it('refuse un montant négatif ou décimal', () => {
    expect(setCoins(base, 'gp', -5).coins.gp).toBe(0)
    expect(setCoins(base, 'gp', 12.7).coins.gp).toBe(12)
    expect(setCoins(base, 'gp', Number.NaN).coins.gp).toBe(0)
  })
})

describe('parseInventory', () => {
  it('rejette une sauvegarde illisible', () => {
    expect(parseInventory(null)).toBeNull()
    expect(parseInventory({ items: 'x', coins: {} })).toBeNull()
  })

  it('nettoie une sauvegarde partiellement abîmée', () => {
    const inv = parseInventory({
      items: [{ id: 'a', name: 'Arc', quantity: 1 }, { name: '' }, 42, { name: 'Flèche', quantity: -3 }],
      coins: { gp: 5, cp: 'x' },
    })!
    expect(inv.items.map(i => i.name)).toEqual(['Arc', 'Flèche'])
    expect(inv.items[1]!.quantity).toBe(1)
    expect(inv.coins).toEqual({ cp: 0, sp: 0, ep: 0, gp: 5, pp: 0 })
    expect(inv.notes).toBe('')
  })
})
