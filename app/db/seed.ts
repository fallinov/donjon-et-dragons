import { CHARACTER_SCHEMA_VERSION, type CharacterSeed, type StoredCharacter } from '~~/shared/types/character'
import { openCodexDB } from '~/db/schema'
import { inventoryFromStart } from '~/composables/useInventory'

export interface PortraitBytes {
  data: ArrayBuffer
  mime: string
}

export type PortraitLoader = (src: string) => Promise<PortraitBytes>

/** Convertit une fiche de départ en fiche stockée. */
export function toStoredCharacter(seed: CharacterSeed, portrait: PortraitBytes, createdAt: string): StoredCharacter {
  const { slug, portrait: seedPortrait, inventory: _startingInventory, ...fields } = seed
  return {
    ...structuredClone(fields),
    id: slug,
    portrait: { data: portrait.data, mime: portrait.mime, alt: seedPortrait.alt },
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    origin: 'builtin',
    createdAt,
    updatedAt: createdAt,
  }
}

/**
 * Importe les fiches de départ au premier lancement. Une fois l'import terminé,
 * il n'est plus rejoué : une fiche supprimée par le joueur ne revient pas.
 * En cas d'échec (portrait injoignable), rien n'est marqué et l'import reprend
 * au lancement suivant sans écraser les fiches déjà importées.
 * Retourne les identifiants importés.
 */
export async function seedBuiltins(seeds: CharacterSeed[], loadPortrait: PortraitLoader, now: Date = new Date()): Promise<string[]> {
  const db = await openCodexDB()
  if (await db.get('meta', 'seed')) return []

  const imported: string[] = []
  for (const [index, seed] of seeds.entries()) {
    if (await db.getKey('characters', seed.slug)) continue
    const portrait = await loadPortrait(seed.portrait.src)
    // Une milliseconde d'écart par fiche : l'ordre des seeds devient l'ordre d'affichage
    const createdAt = new Date(now.getTime() + index).toISOString()
    const tx = db.transaction(['characters', 'inventories'], 'readwrite')
    await Promise.all([
      tx.objectStore('characters').put(toStoredCharacter(seed, portrait, createdAt)),
      tx.objectStore('inventories').put(inventoryFromStart(seed.inventory), seed.slug),
      tx.done,
    ])
    imported.push(seed.slug)
  }
  await db.put('meta', { seededAt: now.toISOString() }, 'seed')
  return imported
}

/** Télécharge un portrait livré avec l'app. */
export async function fetchPortrait(src: string): Promise<PortraitBytes> {
  const response = await fetch(src)
  if (!response.ok) throw new Error(`Portrait introuvable : ${src} (${response.status})`)
  const mime = response.headers.get('content-type') ?? 'image/jpeg'
  return { data: await response.arrayBuffer(), mime }
}
