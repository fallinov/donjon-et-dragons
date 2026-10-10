import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useCharacter, useCharacterList } from '~/composables/useCharacters'
import { putCharacter } from '~/db/characterRepository'
import { darethBrumeval, settle, zanna } from '../helpers/characters'

describe('useCharacterList', () => {
  it('charge les fiches de l\'appareil', async () => {
    await putCharacter(darethBrumeval)
    const { characters, status } = useCharacterList()
    expect(status.value).toBe('pending')
    await settle()
    expect(status.value).toBe('ready')
    expect(characters.value.map(c => c.id)).toEqual(['dareth-brumeval'])
  })
})

describe('useCharacter', () => {
  it('charge une fiche puis suit le changement d\'identifiant', async () => {
    await putCharacter(darethBrumeval)
    await putCharacter(zanna)
    const id = ref('dareth-brumeval')
    const { character, status } = useCharacter(id)
    await settle()
    expect(status.value).toBe('ready')
    expect(character.value?.firstName).toBe('Dareth')

    id.value = 'zanna'
    await nextTick()
    await settle()
    expect(character.value?.firstName).toBe('Zanna')
  })

  it('signale une fiche absente', async () => {
    const { character, status } = useCharacter('inconnu')
    await settle()
    expect(status.value).toBe('missing')
    expect(character.value).toBeUndefined()
  })
})
