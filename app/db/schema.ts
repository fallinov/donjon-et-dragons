import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { StoredCharacter } from '~~/shared/types/character'
import type { CharacterState } from '~/composables/useCharacterState'
import type { InventoryState } from '~/composables/useInventory'

export const DB_NAME = 'codex'
/** Version de la base : ne change que si un store ou un index est ajouté. */
export const DB_VERSION = 1

export interface SeedMeta {
  /** Date ISO du premier import des fiches de départ. */
  seededAt: string
}

export interface CodexDB extends DBSchema {
  characters: {
    key: string
    value: StoredCharacter
    indexes: { 'by-createdAt': string }
  }
  states: { key: string, value: CharacterState }
  inventories: { key: string, value: InventoryState }
  meta: { key: 'seed', value: SeedMeta }
}

let dbPromise: Promise<IDBPDatabase<CodexDB>> | null = null

/** Connexion unique à la base de l'appareil. */
export function openCodexDB(): Promise<IDBPDatabase<CodexDB>> {
  dbPromise ??= openDB<CodexDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const characters = db.createObjectStore('characters', { keyPath: 'id' })
      characters.createIndex('by-createdAt', 'createdAt')
      db.createObjectStore('states')
      db.createObjectStore('inventories')
      db.createObjectStore('meta')
    },
  })
  return dbPromise
}

/** Ferme la connexion (tests : repartir d'une base neuve). */
export async function closeCodexDB(): Promise<void> {
  if (!dbPromise) return
  const db = await dbPromise
  db.close()
  dbPromise = null
}
