import { getCurrentInstance } from 'vue'
import type { Character } from '~~/shared/types/character'
import { useStateSafe } from '~/composables/useCharacterState'
import { persistState } from '~/composables/persistState'
import { getInventory, putInventory } from '~/db/characterRepository'
import { emptyInventory, newItemId, parseInventory, toCount, type CoinType, type InventoryState } from '~/utils/characterParts'
export { COIN_TYPES, emptyCoins, emptyInventory, inventoryFromStart, parseInventory } from '~/utils/characterParts'
export type { CoinType, InventoryItem, InventoryState } from '~/utils/characterParts'

/** Ajoute un objet. Un nom vide est ignoré ; la quantité vaut au moins 1. */
export function addItem(state: InventoryState, name: string, quantity = 1): InventoryState {
  const trimmed = name.trim()
  if (!trimmed) return state
  return { ...state, items: [...state.items, { id: newItemId(), name: trimmed, quantity: Math.max(1, toCount(quantity)) }] }
}

export function removeItem(state: InventoryState, id: string): InventoryState {
  return { ...state, items: state.items.filter(item => item.id !== id) }
}

/** Modifie la quantité d'un objet ; à 0, l'objet est retiré du sac. */
export function setItemQuantity(state: InventoryState, id: string, quantity: number): InventoryState {
  const next = toCount(quantity)
  if (next === 0) return removeItem(state, id)
  return { ...state, items: state.items.map(item => item.id === id ? { ...item, quantity: next } : item) }
}

export function setCoins(state: InventoryState, type: CoinType, amount: number): InventoryState {
  return { ...state, coins: { ...state.coins, [type]: toCount(amount) } }
}

/**
 * Sac du personnage (équipement, argent, notes), partagé via `useState` Nuxt
 * et persisté sur l'appareil du joueur dans IndexedDB.
 */
export function useInventory(character: Character) {
  const state = useStateSafe<InventoryState>(`inventory:${character.id}`, emptyInventory)

  if (getCurrentInstance()) {
    persistState(state, {
      load: async () => parseInventory(await getInventory(character.id)) ?? undefined,
      save: value => putInventory(character.id, value),
    })
  }

  return {
    state,
    add: (name: string, quantity = 1) => { state.value = addItem(state.value, name, quantity) },
    remove: (id: string) => { state.value = removeItem(state.value, id) },
    setQuantity: (id: string, quantity: number) => { state.value = setItemQuantity(state.value, id, quantity) },
    setCoin: (type: CoinType, amount: number) => { state.value = setCoins(state.value, type, amount) },
    setNotes: (notes: string) => { state.value = { ...state.value, notes } },
  }
}
