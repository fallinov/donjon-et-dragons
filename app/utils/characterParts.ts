import type { Character, Coins, StartingInventory } from '~~/shared/types/character'

/**
 * Parties d'une fiche hors du document principal : état de jeu et sac. Fonctions pures, partagées
 * par les composables, l'import de fichier et le serveur de synchronisation.
 */

export interface CharacterState {
  hpCurrent: number
  hpTemp: number
  inspiration: number
  hitDiceUsed: number
  deathSaves: { successes: number, failures: number }
  /** Emplacements consommés par niveau (index 0 = niv 1, etc.) */
  spellSlotsUsed: number[]
  /** Sorts daily déjà utilisés (titres) */
  dailySpellsUsed: string[]
}

/** État de jeu d'une fiche jamais jouée : PV au maximum, rien de consommé. */
export function defaultState(character: Character): CharacterState {
  return {
    hpCurrent: character.maxHp,
    hpTemp: 0,
    inspiration: 0,
    hitDiceUsed: 0,
    deathSaves: { successes: 0, failures: 0 },
    spellSlotsUsed: (character.spellcasting?.slotLevels ?? []).map(() => 0),
    dailySpellsUsed: [],
  }
}

export function isValidState(value: unknown): value is CharacterState {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    typeof s.hpCurrent === 'number'
    && typeof s.hpTemp === 'number'
    && typeof s.inspiration === 'number'
    && typeof s.hitDiceUsed === 'number'
    && Array.isArray(s.spellSlotsUsed)
    && typeof s.deathSaves === 'object'
    && s.deathSaves !== null
  )
}

/**
 * Aligne un état sauvegardé sur la fiche actuelle, après une montée de niveau
 * ou une modification dans l'éditeur : niveaux d'emplacements complétés avec 0,
 * compteurs bornés aux nouveaux maximums (emplacements, PV, dés de vie utilisés).
 */
export function normalizeState(character: Character, saved: CharacterState): CharacterState {
  const levels = character.spellcasting?.slotLevels ?? []
  return {
    ...saved,
    hpCurrent: Math.min(saved.hpCurrent, character.maxHp),
    hitDiceUsed: Math.min(saved.hitDiceUsed, character.hitDice.total),
    spellSlotsUsed: levels.map((sl, i) => Math.min(saved.spellSlotsUsed[i] ?? 0, sl.slots)),
  }
}

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
/** Identifiant d'un objet du sac (unique sur l'appareil). */
export function newItemId(): string {
  idCounter += 1
  return `item-${Date.now().toString(36)}-${idCounter}`
}

/** Entier positif ou nul, sinon 0. */
export function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

export function emptyCoins(): Coins {
  return { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }
}

export function emptyInventory(): InventoryState {
  return { items: [], coins: emptyCoins(), notes: '' }
}

/** Sac initial tiré du contenu de départ d'une fiche livrée avec l'app (ou vide). */
export function inventoryFromStart(start: StartingInventory | undefined): InventoryState {
  return {
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
      id: typeof item.id === 'string' ? item.id : newItemId(),
      name: item.name,
      quantity: Math.max(1, toCount(item.quantity)),
    })
  }
  const coins = emptyCoins()
  for (const type of COIN_TYPES) coins[type] = toCount(coinsRaw[type])
  return { items, coins, notes: typeof raw.notes === 'string' ? raw.notes : '' }
}
