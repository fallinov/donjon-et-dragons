import type { StoredCharacter } from '~~/shared/types/character'
import { useConfirm } from '~/composables/useConfirm'
import { t } from '~/composables/useT'
import { getCharacter, replaceCharacterData } from '~/db/characterRepository'
import type { ImportedCharacter } from '~/utils/characterFile'
import { newId } from '~/utils/newId'

export type ConflictChoice = 'replace' | 'copy' | 'cancel'
export type ConflictResolver = (existing: StoredCharacter, incoming: StoredCharacter) => Promise<ConflictChoice>

/**
 * Enregistre une fiche importée. Si une fiche de même identifiant existe sur
 * l'appareil, `resolve` décide : remplacer (provenance et date de création
 * conservées), importer en copie (nouvel identifiant) ou annuler.
 * Retourne l'identifiant de la fiche enregistrée, ou null si annulé.
 */
export async function importCharacter(imported: ImportedCharacter, resolve: ConflictResolver, now: Date = new Date()): Promise<string | null> {
  const incoming = imported.character
  const existing = await getCharacter(incoming.id)
  let character: StoredCharacter

  if (!existing) {
    character = { ...incoming, origin: 'import', createdAt: now.toISOString() }
  }
  else {
    const choice = await resolve(existing, incoming)
    if (choice === 'cancel') return null
    character = choice === 'replace'
      ? { ...incoming, origin: existing.origin, createdAt: existing.createdAt }
      : {
          ...incoming,
          id: newId(),
          firstName: t('import.copyName', { name: incoming.firstName }),
          origin: 'import',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        }
  }

  await replaceCharacterData(character, imported.state, imported.inventory)
  return character.id
}

const formatDate = (iso: string): string => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('fr-CH', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Résolution du conflit par la boîte de dialogue du codex : Remplacer / Importer en copie / Annuler. */
export function useImportConflict(): ConflictResolver {
  // Dates ISO 8601 : l'ordre alphabétique est l'ordre chronologique
  const { choose } = useConfirm()
  return async (existing, incoming) => {
    const name = `${existing.firstName}${existing.lastName ? ` ${existing.lastName}` : ''}`
    const message = incoming.updatedAt === existing.updatedAt
      ? 'import.conflictSame'
      : incoming.updatedAt > existing.updatedAt ? 'import.conflictFileNewer' : 'import.conflictLocalNewer'
    const answer = await choose({
      title: t('import.conflictTitle'),
      message: t(message, {
        name,
        local: formatDate(existing.updatedAt),
        file: formatDate(incoming.updatedAt),
      }),
      confirmLabel: t('import.replace'),
      extraLabel: t('import.copy'),
      cancelLabel: t('actions.cancel'),
      danger: true,
    })
    return answer === 'confirm' ? 'replace' : answer === 'extra' ? 'copy' : 'cancel'
  }
}
