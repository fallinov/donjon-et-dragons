import type { CharacterSeed, StoredCharacter } from '~~/shared/types/character'
import { toStoredCharacter } from '~/db/seed'
import { darethBrumeval as darethSeed } from '~/data/characters/dareth-brumeval'
import { zanna as zannaSeed } from '~/data/characters/zanna'

/** Portrait factice de 3 octets. */
export function fakePortrait(byte = 1): { data: ArrayBuffer, mime: string } {
  return { data: new Uint8Array([byte, byte, byte]).buffer, mime: 'image/jpeg' }
}

/** Fiche stockée construite depuis une fiche de départ, comme après le premier lancement. */
export function storedFromSeed(seed: CharacterSeed, createdAt = '2026-10-10T10:00:00.000Z'): StoredCharacter {
  return toStoredCharacter(seed, fakePortrait(), createdAt)
}

export const darethBrumeval = storedFromSeed(darethSeed)
export const zanna = storedFromSeed(zannaSeed)
