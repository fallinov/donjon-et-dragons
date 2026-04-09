import { ref } from 'vue'

type StateFactory<T> = () => T

// Stub minimal de useState Nuxt : un singleton par clé pour les tests unitaires
const stateCache = new Map<string, unknown>()

const useStateStub = <T>(key: string, factory: StateFactory<T>) => {
  if (!stateCache.has(key)) {
    stateCache.set(key, ref(factory()))
  }
  return stateCache.get(key) as ReturnType<typeof ref<T>>
}

// Expose globalement pour que les composables Nuxt auto-importés le trouvent
;(globalThis as unknown as { useState: typeof useStateStub }).useState = useStateStub

// Reset du cache entre chaque test pour éviter les fuites
beforeEach(() => {
  stateCache.clear()
})
