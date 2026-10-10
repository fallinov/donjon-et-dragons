import { CHARACTER_SCHEMA_VERSION, type StartingInventory } from '~~/shared/types/character'
import { isValidState, normalizeState } from '~/composables/useCharacterState'
import { inventoryFromStart, parseInventory } from '~/composables/useInventory'
import { migrateDocument } from '~/db/migrations'
import { openCodexDB } from '~/db/schema'

export interface LegacyReport {
  /** Fiches dont l'état de jeu a été repris du localStorage. */
  states: string[]
  /** Fiches dont le sac a été repris (localStorage ou sac de départ d'une fiche v1). */
  inventories: string[]
  /** Fiches réécrites au format courant. */
  upgraded: string[]
}

function readJson(storage: Storage, key: string): unknown {
  const raw = storage.getItem(key)
  if (raw === null) return undefined
  try {
    return JSON.parse(raw)
  }
  catch {
    return undefined
  }
}

/**
 * Reprend les données des versions précédentes de l'app, puis les efface :
 * - état de jeu et sac en localStorage (`codex:{id}:state`, `codex:{id}:inventory`) ;
 * - sac de départ encore rangé dans les fiches au format v1.
 * Priorité au sac modifié par le joueur (localStorage), puis au sac de départ.
 * Idempotent : sans ancienne donnée, ne fait rien.
 */
export async function migrateLegacyStorage(storage: Storage | undefined = globalThis.localStorage): Promise<LegacyReport> {
  const report: LegacyReport = { states: [], inventories: [], upgraded: [] }
  const db = await openCodexDB()
  const docs: unknown[] = await db.getAll('characters')

  for (const raw of docs) {
    if (typeof raw !== 'object' || raw === null) continue
    const doc = raw as Record<string, unknown>
    if (typeof doc.id !== 'string') continue
    const id = doc.id
    const character = migrateDocument(doc)
    if (!character) continue

    const tx = db.transaction(['characters', 'states', 'inventories'], 'readwrite')
    const writes: Promise<unknown>[] = []

    const stateKey = `codex:${id}:state`
    const legacyState = storage ? readJson(storage, stateKey) : undefined
    if (isValidState(legacyState)) {
      writes.push(tx.objectStore('states').put(normalizeState(character, legacyState), id))
      report.states.push(id)
    }

    const inventoryKey = `codex:${id}:inventory`
    const legacyInventory = storage ? parseInventory(readJson(storage, inventoryKey)) : null
    const startingInventory = doc.inventory as StartingInventory | undefined
    if (legacyInventory) {
      writes.push(tx.objectStore('inventories').put(legacyInventory, id))
      report.inventories.push(id)
    }
    else if (startingInventory && !(await tx.objectStore('inventories').getKey(id))) {
      writes.push(tx.objectStore('inventories').put(inventoryFromStart(startingInventory), id))
      report.inventories.push(id)
    }

    if (doc.schemaVersion !== CHARACTER_SCHEMA_VERSION) {
      writes.push(tx.objectStore('characters').put(character))
      report.upgraded.push(id)
    }

    await Promise.all([...writes, tx.done])
    // Effacé seulement une fois la transaction validée
    storage?.removeItem(stateKey)
    storage?.removeItem(inventoryKey)
  }
  return report
}
