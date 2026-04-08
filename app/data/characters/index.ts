import type { Character } from '~~/shared/types/character'
import { darethBrumeval } from './dareth-brumeval'

export const characters: Character[] = [darethBrumeval]

export const charactersBySlug: Record<string, Character> = Object.fromEntries(
  characters.map(c => [c.slug, c]),
)

export function getCharacter(slug: string): Character | undefined {
  return charactersBySlug[slug]
}
