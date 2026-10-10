import type { StoredCharacter } from '~~/shared/types/character'
import { openCodexDB } from '~/db/schema'
import { migrateDocument } from '~/db/migrations'

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

/** Enregistre la fiche telle quelle (objet simple, pas un proxy réactif). */
export async function putCharacter(character: StoredCharacter): Promise<void> {
  const db = await openCodexDB()
  await db.put('characters', character)
}

/** Supprime la fiche, son état de jeu et son sac en une seule transaction. */
export async function deleteCharacter(id: string): Promise<void> {
  const db = await openCodexDB()
  const tx = db.transaction(['characters', 'states', 'inventories'], 'readwrite')
  await Promise.all([
    tx.objectStore('characters').delete(id),
    tx.objectStore('states').delete(id),
    tx.objectStore('inventories').delete(id),
    tx.done,
  ])
}
