import { afterEach, describe, expect, it } from 'vitest'
import { useConfirm } from '~/composables/useConfirm'
import { useImportConflict } from '~/composables/useCharacterImport'
import { darethBrumeval } from '../helpers/characters'

const at = (iso: string) => ({ ...darethBrumeval, updatedAt: iso })

async function messageFor(local: string, file: string): Promise<string> {
  const pending = useImportConflict()(at(local), at(file))
  const message = useConfirm().request.value!.message
  useConfirm().request.value!.resolve('cancel')
  await pending
  return message
}

describe('useImportConflict', () => {
  afterEach(() => useConfirm().request.value?.resolve('cancel'))

  it('indique quelle fiche est la plus récente, ou qu\'elles sont identiques', async () => {
    expect(await messageFor('2026-10-10T10:00:00.000Z', '2026-10-11T10:00:00.000Z')).toContain('La fiche du fichier est plus récente')
    expect(await messageFor('2026-10-11T10:00:00.000Z', '2026-10-10T10:00:00.000Z')).toContain("la fiche de l'appareil est plus récente")
    expect(await messageFor('2026-10-10T10:00:00.000Z', '2026-10-10T10:00:00.000Z')).toContain('dans la même version')
  })

  it('traduit le choix : Remplacer, Importer en copie, Annuler', async () => {
    const resolve = useImportConflict()
    for (const [answer, choice] of [['confirm', 'replace'], ['extra', 'copy'], ['cancel', 'cancel']] as const) {
      const pending = resolve(at('2026-10-10T10:00:00.000Z'), at('2026-10-11T10:00:00.000Z'))
      expect(useConfirm().request.value).toMatchObject({ confirmLabel: 'Remplacer', extraLabel: 'Importer en copie', cancelLabel: 'Annuler', danger: true })
      useConfirm().request.value!.resolve(answer)
      expect(await pending).toBe(choice)
    }
  })
})
