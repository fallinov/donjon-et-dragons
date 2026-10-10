import { describe, expect, it } from 'vitest'
import { deleteCharacter, getCharacter, listCharacters, putCharacter } from '~/db/characterRepository'
import { openCodexDB } from '~/db/schema'
import { darethBrumeval, zanna } from '../../helpers/characters'

describe('characterRepository', () => {
  it('enregistre puis relit une fiche, portrait compris', async () => {
    await putCharacter(darethBrumeval)
    const read = await getCharacter('dareth-brumeval')
    expect(read?.firstName).toBe('Dareth')
    expect(read?.portrait.data).toBeInstanceOf(ArrayBuffer)
    expect([...new Uint8Array(read!.portrait.data)]).toEqual([1, 1, 1])
    expect(read?.portrait.mime).toBe('image/jpeg')
  })

  it('retourne undefined pour un identifiant inconnu', async () => {
    expect(await getCharacter('inconnu')).toBeUndefined()
  })

  it('liste les fiches dans l\'ordre de création', async () => {
    await putCharacter({ ...zanna, createdAt: '2026-10-10T10:00:00.002Z' })
    await putCharacter({ ...darethBrumeval, createdAt: '2026-10-10T10:00:00.001Z' })
    const list = await listCharacters()
    expect(list.map(c => c.id)).toEqual(['dareth-brumeval', 'zanna'])
  })

  it('ignore un document illisible dans la liste', async () => {
    await putCharacter(darethBrumeval)
    const db = await openCodexDB()
    await db.put('characters', { ...zanna, schemaVersion: 99 })
    expect((await listCharacters()).map(c => c.id)).toEqual(['dareth-brumeval'])
  })

  it('supprime la fiche, son état et son sac ensemble', async () => {
    await putCharacter(darethBrumeval)
    await putCharacter(zanna)
    const db = await openCodexDB()
    await db.put('states', { hpCurrent: 3 } as never, 'dareth-brumeval')
    await db.put('inventories', { items: [] } as never, 'dareth-brumeval')

    await deleteCharacter('dareth-brumeval')

    expect(await getCharacter('dareth-brumeval')).toBeUndefined()
    expect(await db.get('states', 'dareth-brumeval')).toBeUndefined()
    expect(await db.get('inventories', 'dareth-brumeval')).toBeUndefined()
    expect(await getCharacter('zanna')).toBeDefined()
  })
})
