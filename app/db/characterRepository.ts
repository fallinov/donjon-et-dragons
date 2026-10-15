import type { StoredCharacter } from '~~/shared/types/character'
import { defaultState, isValidState, parseInventory, type CharacterState, type InventoryState } from '~/utils/characterParts'
import { openCodexDB, outboxKey, type OutboxEntry } from '~/db/schema'
import { migrateDocument } from '~/db/migrations'
import { emitChange } from '~/db/changes'

/** Toutes les fiches de l'appareil, dans l'ordre de création. Les documents illisibles sont ignorés. */
export async function listCharacters(): Promise<StoredCharacter[]> {
  const db = await openCodexDB()
  const docs = await db.getAllFromIndex('characters', 'by-createdAt')
  return docs.map(doc => migrateDocument(doc)).filter((c): c is StoredCharacter => c !== null)
}

export async function getCharacter(id: string): Promise<StoredCharacter | undefined> {
  const db = await openCodexDB()
  return migrateDocument(await db.get('characters', id)) ?? undefined
}

/** Modification locale à envoyer au serveur (même transaction que l'écriture). */
const pending = (id: string, part: OutboxEntry['part'], now = new Date()): [string, OutboxEntry] =>
  [outboxKey(id, part), { id, part, changedAt: now.toISOString() }]

/**
 * Enregistre la fiche telle quelle (objet simple, pas un proxy réactif). Comme toutes les écritures
 * de ce module (actions de l'utilisateur), elle est notée dans l'outbox pour la synchronisation ;
 * les données reçues du serveur passent par `syncRepository`, qui ne note rien.
 */
export async function putCharacter(character: StoredCharacter): Promise<void> {
  const db = await openCodexDB()
  const tx = db.transaction(['characters', 'outbox'], 'readwrite')
  const [key, entry] = pending(character.id, 'sheet')
  await Promise.all([tx.objectStore('characters').put(character), tx.objectStore('outbox').put(entry, key), tx.done])
  emitChange('local', [character.id])
}

/** Supprime la fiche, son état de jeu et son sac en une seule transaction. */
export async function deleteCharacter(id: string): Promise<void> {
  const db = await openCodexDB()
  const tx = db.transaction(['characters', 'states', 'inventories', 'outbox'], 'readwrite')
  const outbox = tx.objectStore('outbox')
  const [key, entry] = pending(id, 'delete')
  await Promise.all([
    tx.objectStore('characters').delete(id),
    tx.objectStore('states').delete(id),
    tx.objectStore('inventories').delete(id),
    // Les modifications encore à envoyer n'ont plus d'objet : seule la suppression part
    outbox.delete(outboxKey(id, 'sheet')),
    outbox.delete(outboxKey(id, 'state')),
    outbox.delete(outboxKey(id, 'inventory')),
    outbox.put(entry, key),
    tx.done,
  ])
  emitChange('local', [id])
}

/** État de jeu enregistré, à valider par l'appelant (`isValidState`). */
export async function getState(id: string): Promise<unknown> {
  const db = await openCodexDB()
  return db.get('states', id)
}

export async function putState(id: string, state: CharacterState): Promise<void> {
  const db = await openCodexDB()
  const tx = db.transaction(['states', 'outbox'], 'readwrite')
  const [key, entry] = pending(id, 'state')
  await Promise.all([tx.objectStore('states').put(state, id), tx.objectStore('outbox').put(entry, key), tx.done])
  emitChange('local', [id])
}

/** Sac enregistré, à valider par l'appelant (`parseInventory`). */
export async function getInventory(id: string): Promise<unknown> {
  const db = await openCodexDB()
  return db.get('inventories', id)
}

export async function putInventory(id: string, inventory: InventoryState): Promise<void> {
  const db = await openCodexDB()
  const tx = db.transaction(['inventories', 'outbox'], 'readwrite')
  const [key, entry] = pending(id, 'inventory')
  await Promise.all([tx.objectStore('inventories').put(inventory, id), tx.objectStore('outbox').put(entry, key), tx.done])
  emitChange('local', [id])
}

/**
 * Remplace une fiche, son état de jeu et son sac en une seule transaction.
 * État absent : état de départ (PV au maximum), écrit et synchronisé pour remplacer celui du
 * serveur. Sac absent : effacé (sac vide au prochain affichage).
 */
export async function replaceCharacterData(character: StoredCharacter, state?: CharacterState, inventory?: InventoryState): Promise<void> {
  const db = await openCodexDB()
  const tx = db.transaction(['characters', 'states', 'inventories', 'outbox'], 'readwrite')
  const outbox = tx.objectStore('outbox')
  const now = new Date()
  const written: OutboxEntry['part'][] = ['sheet', 'state', ...(inventory ? ['inventory' as const] : [])]
  const parts = written.map(part => pending(character.id, part, now))
  await Promise.all([
    tx.objectStore('characters').put(character),
    tx.objectStore('states').put(state ?? defaultState(character), character.id),
    inventory ? tx.objectStore('inventories').put(inventory, character.id) : tx.objectStore('inventories').delete(character.id),
    outbox.delete(outboxKey(character.id, 'delete')),
    ...parts.map(([key, entry]) => outbox.put(entry, key)),
    tx.done,
  ])
  emitChange('local', [character.id])
}

/** Fiche avec son état de jeu et son sac (export). Éléments abîmés ignorés. */
export async function getCharacterBundle(id: string): Promise<{ character: StoredCharacter, state?: CharacterState, inventory?: InventoryState } | undefined> {
  const character = await getCharacter(id)
  if (!character) return undefined
  const state = await getState(id)
  const inventory = parseInventory(await getInventory(id))
  return {
    character,
    ...(isValidState(state) ? { state } : {}),
    ...(inventory ? { inventory } : {}),
  }
}
