import { ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { StoredCharacter } from '~~/shared/types/character'
import { getCharacter, listCharacters } from '~/db/characterRepository'

export type LoadStatus = 'pending' | 'ready' | 'error'

/** Liste des fiches de l'appareil. */
export function useCharacterList() {
  const characters = shallowRef<StoredCharacter[]>([])
  const status = ref<LoadStatus>('pending')

  async function refresh(): Promise<void> {
    try {
      characters.value = await listCharacters()
      status.value = 'ready'
    }
    catch (error) {
      console.error(error)
      status.value = 'error'
    }
  }

  void refresh()
  return { characters, status, refresh }
}

/** Une fiche par identifiant. `missing` : aucune fiche avec cet identifiant sur l'appareil. */
export function useCharacter(id: MaybeRefOrGetter<string>) {
  const character = shallowRef<StoredCharacter>()
  const status = ref<LoadStatus | 'missing'>('pending')

  async function load(target: string): Promise<void> {
    status.value = 'pending'
    try {
      const found = await getCharacter(target)
      // Ignore une réponse arrivée après un changement d'identifiant
      if (toValue(id) !== target) return
      character.value = found
      status.value = found ? 'ready' : 'missing'
    }
    catch (error) {
      console.error(error)
      status.value = 'error'
    }
  }

  watch(() => toValue(id), target => load(target), { immediate: true })
  return { character, status, refresh: () => load(toValue(id)) }
}
