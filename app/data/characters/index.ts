import type { CharacterSeed } from '~~/shared/types/character'
import { darethBrumeval } from './dareth-brumeval'
import { skamosAurum } from './skamos-aurum'
import { kaelDraven } from './kael-draven'
import { thunon } from './thunon'
import { maeraVifbois } from './maera-vifbois'
import { zanna } from './zanna'

/** Fiches de départ, importées sur l'appareil au premier lancement (dans cet ordre). */
export const seeds: CharacterSeed[] = [darethBrumeval, skamosAurum, zanna, maeraVifbois, thunon, kaelDraven]

export function getSeed(slug: string): CharacterSeed | undefined {
  return seeds.find(seed => seed.slug === slug)
}
