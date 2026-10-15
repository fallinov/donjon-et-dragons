import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { StoredCharacter } from '~~/shared/types/character'
import type { PublicUser } from '~~/shared/types/account'
import type { Member, SyncPart } from '~~/shared/types/sync'
import type { CharacterState, InventoryState } from '~/utils/characterParts'

export const DB_NAME = 'codex'
/** Version de la base : ne change que si un store ou un index est ajouté. v2 : synchronisation. */
export const DB_VERSION = 2

export interface SeedMeta {
  /** Date ISO du premier import des fiches de départ. */
  seededAt: string
}

/** Modification locale à envoyer au serveur : les données sont relues au moment de l'envoi. */
export interface OutboxEntry {
  id: string
  part: SyncPart | 'delete'
  /** Date ISO de la dernière modification de cette partie sur l'appareil. */
  changedAt: string
}

/** Ce que l'appareil sait de la version du serveur d'une fiche. */
export interface RemoteInfo {
  /** Propriétaire ; null : fiche du groupe (masters). */
  ownerId: string | null
  portraitHash: string | null
  sheetAt: string | null
  stateAt: string | null
  inventoryAt: string | null
}

/** Curseur de synchronisation et compte auquel appartiennent les données de l'appareil. */
export interface SyncMeta {
  userId: string
  cursor: number
  /** Première synchronisation de ce compte sur l'appareil terminée (fusion des fiches locales faite). */
  merged: boolean
  lastSyncAt?: string
}

export interface MetaValues {
  seed: SeedMeta
  sync: SyncMeta
  /** Compte connecté, gardé pour ouvrir l'app hors ligne (le cookie de session reste invisible). */
  session: PublicUser
  /** Membres du groupe (affichage du propriétaire d'une fiche hors ligne). */
  members: Member[]
}

export interface CodexDB extends DBSchema {
  characters: {
    key: string
    value: StoredCharacter
    indexes: { 'by-createdAt': string }
  }
  states: { key: string, value: CharacterState }
  inventories: { key: string, value: InventoryState }
  meta: { key: keyof MetaValues, value: MetaValues[keyof MetaValues] }
  outbox: { key: string, value: OutboxEntry }
  remote: { key: string, value: RemoteInfo }
}

/** Clé d'une entrée de l'outbox : une seule par fiche et par partie. */
export const outboxKey = (id: string, part: OutboxEntry['part']) => `${id}|${part}`

let dbPromise: Promise<IDBPDatabase<CodexDB>> | null = null

/** Connexion unique à la base de l'appareil. */
export function openCodexDB(): Promise<IDBPDatabase<CodexDB>> {
  dbPromise ??= openDB<CodexDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const characters = db.createObjectStore('characters', { keyPath: 'id' })
        characters.createIndex('by-createdAt', 'createdAt')
        db.createObjectStore('states')
        db.createObjectStore('inventories')
        db.createObjectStore('meta')
      }
      if (oldVersion < 2) {
        db.createObjectStore('outbox')
        db.createObjectStore('remote')
      }
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
