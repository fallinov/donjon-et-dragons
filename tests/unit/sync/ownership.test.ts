import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublicUser } from '~~/shared/types/account'
import { importCharacter } from '~/composables/useCharacterImport'
import { useOwnership } from '~/composables/useOwnership'
import { getCharacter, listCharacters, putCharacter } from '~/db/characterRepository'
import { setRemote } from '~/db/syncRepository'
import { settle, zanna } from '../../helpers/characters'

const player: PublicUser = { id: '00000000-0000-4000-8000-000000000002', username: 'myriam', role: 'player', mustChangePassword: false }
const other = '00000000-0000-4000-8000-000000000009'
const remote = (ownerId: string | null) => ({ ownerId, portraitHash: null, sheetAt: null, stateAt: null, inventoryAt: null })

// Liste des membres demandée au serveur : pas de serveur ici
beforeEach(() => {
  vi.stubGlobal('fetch', async () => new Response('{}', { status: 404 }))
})

function signIn(user: PublicUser | null): void {
  ;(globalThis as unknown as { useAuth: () => unknown }).useAuth = () => ({ user: { value: user } })
}

describe('droits côté interface', () => {
  it('joueur : ses fiches, ses nouvelles fiches (UUID) ; ni celles des autres, ni les fiches de départ', async () => {
    signIn(player)
    await setRemote('zanna', remote(player.id))
    await setRemote('dareth-brumeval', remote(other))
    await setRemote('kael-draven', remote(null))
    const { canEdit } = useOwnership()
    await settle()
    expect(canEdit('zanna')).toBe(true)
    expect(canEdit('dareth-brumeval')).toBe(false)
    expect(canEdit('kael-draven')).toBe(false)
    expect(canEdit('0b5c5d3e-8f1a-4c2b-9d7e-1a2b3c4d5e6f')).toBe(true)
    expect(canEdit('thunon')).toBe(false)
  })

  it('master : toutes les fiches ; sans compte ou mot de passe provisoire : aucune', async () => {
    await setRemote('dareth-brumeval', remote(other))
    signIn({ ...player, role: 'master' })
    expect(useOwnership().canEdit('dareth-brumeval')).toBe(true)
    signIn({ ...player, mustChangePassword: true })
    expect(useOwnership().canEdit('0b5c5d3e-8f1a-4c2b-9d7e-1a2b3c4d5e6f')).toBe(false)
    signIn(null)
    expect(useOwnership().canEdit('zanna')).toBe(false)
  })
})

describe('import d\'une fiche qui ne nous appartient pas', () => {
  it('devient une copie à soi, sans question ; la fiche de l\'autre reste intacte', async () => {
    await putCharacter(zanna)
    const asked: string[] = []
    const id = await importCharacter({ character: { ...zanna, level: 12 } }, async () => {
      asked.push('question')
      return 'replace'
    }, { canWrite: () => false })
    expect(asked).toEqual([])
    expect(id).not.toBe('zanna')
    expect((await getCharacter(id!))).toMatchObject({ firstName: 'Zanna (copie)', level: 12, origin: 'import' })
    expect((await getCharacter('zanna'))!.level).toBe(zanna.level)
    expect(await listCharacters()).toHaveLength(2)
  })
})
