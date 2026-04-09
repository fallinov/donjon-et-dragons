import type { Character } from '~~/shared/types/character'
import { darethBrumeval } from './dareth-brumeval'
import { skamosAurum } from './skamos-aurum'
import { kaelDraven } from './kael-draven'
import { thunon } from './thunon'
import { maeraVifbois } from './maera-vifbois'
import { zanna } from './zanna'

export const characters: Character[] = [darethBrumeval, skamosAurum, zanna, maeraVifbois, thunon, kaelDraven]

export const charactersBySlug: Record<string, Character> = Object.fromEntries(
  characters.map(c => [c.slug, c]),
)

export function getCharacter(slug: string): Character | undefined {
  return charactersBySlug[slug]
}
