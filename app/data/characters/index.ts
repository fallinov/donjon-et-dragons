import type { Character } from '~~/shared/types/character'
import { darethBrumeval } from './dareth-brumeval'
import { skamosAurum } from './skamos-aurum'
import { thunon } from './thunon'
import { viboisThaera } from './vibois-thaera'
import { zanna } from './zanna'

export const characters: Character[] = [darethBrumeval, skamosAurum, zanna, viboisThaera, thunon]

export const charactersBySlug: Record<string, Character> = Object.fromEntries(
  characters.map(c => [c.slug, c]),
)

export function getCharacter(slug: string): Character | undefined {
  return charactersBySlug[slug]
}
