import { getCurrentInstance, onMounted, watch } from 'vue'
import type { Character, Coins } from '~~/shared/types/character'
import { useStateSafe } from '~/composables/useCharacterState'

export type CoinType = keyof Coins

export const COIN_TYPES: CoinType[] = ['cp', 'sp', 'ep', 'gp', 'pp']

export interface InventoryItem {
  id: string
  name: string
  quantity: number
}

export interface InventoryState {
  items: InventoryItem[]
  coins: Coins
  notes: string
}

let idCounter = 0
function newId(): string {
  idCounter += 1
  return `item-${Date.now().toString(36)}-${idCounter}`
}

function storageKey(id: string): string {
  return `codex:${id}:inventory`
}

/** Entier positif ou nul, sinon 0. */
function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

export function emptyCoins(): Coins {
  return { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }
}

/** Sac de départ tiré de la fiche (ou vide). */
export function defaultInventory(character: Character): InventoryState {
  const start = character.inventory
  return {
    // Identifiants stables : le rendu serveur et le chargement client désignent les mêmes objets
    items: (start?.equipment ?? []).map((item, i) => ({ id: `start-${i}`, name: item.name, quantity: Math.max(1, item.quantity) })),
    coins: { ...emptyCoins(), ...start?.coins },
    notes: start?.notes ?? '',
  }
}

/** Valide un sac lu depuis le stockage. Retourne null s'il est inutilisable. */
export function parseInventory(value: unknown): InventoryState | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  if (!Array.isArray(raw.items) || typeof raw.coins !== 'object' || raw.coins === null) return null
  const coinsRaw = raw.coins as Record<string, unknown>
  const items: InventoryItem[] = []
  for (const entry of raw.items) {
    if (typeof entry !== 'object' || entry === null) continue
    const item = entry as Record<string, unknown>
    if (typeof item.name !== 'string' || item.name.trim() === '') continue
    items.push({
      id: typeof item.id === 'string' ? item.id : newId(),
      name: item.name,
      quantity: Math.max(1, toCount(item.quantity)),
    })
  }
  const coins = emptyCoins()
  for (const type of COIN_TYPES) coins[type] = toCount(coinsRaw[type])
  return { items, coins, notes: typeof raw.notes === 'string' ? raw.notes : '' }
}

/** Ajoute un objet. Un nom vide est ignoré ; la quantité vaut au moins 1. */
export function addItem(state: InventoryState, name: string, quantity = 1): InventoryState {
  const trimmed = name.trim()
  if (!trimmed) return state
  return { ...state, items: [...state.items, { id: newId(), name: trimmed, quantity: Math.max(1, toCount(quantity)) }] }
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

function loadInventory(character: Character): InventoryState {
  if (typeof window === 'undefined') return defaultInventory(character)
  try {
    const raw = window.localStorage.getItem(storageKey(character.id))
    if (!raw) return defaultInventory(character)
    return parseInventory(JSON.parse(raw)) ?? defaultInventory(character)
  }
  catch {
    return defaultInventory(character)
  }
}

/**
 * Sac du personnage (équipement, argent, notes), partagé via `useState` Nuxt
 * et persisté dans `localStorage` sur l'appareil du joueur.
 */
export function useInventory(character: Character) {
  const state = useStateSafe<InventoryState>(`inventory:${character.id}`, () => defaultInventory(character))

  if (getCurrentInstance()) {
    onMounted(() => {
      state.value = loadInventory(character)
    })
    watch(
      state,
      (next) => {
        if (typeof window === 'undefined') return
        try {
          window.localStorage.setItem(storageKey(character.id), JSON.stringify(next))
        }
        catch {
          // quota ou navigation privée — échec silencieux
        }
      },
      { deep: true },
    )
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
