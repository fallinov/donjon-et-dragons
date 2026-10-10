import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { persistState } from '~/composables/persistState'
import { settle, waitFor } from '../helpers/characters'

interface Counter { value: number }

function setup(stored: Counter | undefined, opts: { failLoad?: boolean } = {}) {
  const save = vi.fn(async (_value: Counter) => {})
  let resolveLoad: () => void = () => {}
  const load = vi.fn(() => new Promise<Counter | undefined>((resolve, reject) => {
    resolveLoad = () => opts.failLoad ? reject(new Error('IDB')) : resolve(stored)
  }))
  const state = ref<Counter>({ value: 0 })
  const scope = effectScope()
  scope.run(() => persistState(state, { load, save, delay: 20 }))
  return { state, save, load, scope, resolveLoad: () => resolveLoad() }
}

describe('persistState', () => {
  it('remplace l\'état par défaut par la valeur enregistrée', async () => {
    const { state, resolveLoad } = setup({ value: 7 })
    resolveLoad()
    await settle()
    expect(state.value.value).toBe(7)
  })

  it('n\'écrit rien tant que le chargement n\'est pas terminé', async () => {
    const { state, save, resolveLoad } = setup({ value: 7 })
    state.value.value = 1
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 40))
    expect(save).not.toHaveBeenCalled()
    resolveLoad()
    await settle()
    expect(state.value.value).toBe(7)
  })

  it('regroupe les écritures rapprochées en une seule', async () => {
    const { state, save, resolveLoad } = setup(undefined)
    resolveLoad()
    await settle()
    save.mockClear()
    for (let i = 1; i <= 5; i++) {
      state.value.value = i
      await nextTick()
    }
    await waitFor(() => save.mock.calls.length > 0)
    await new Promise(resolve => setTimeout(resolve, 40))
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenLastCalledWith({ value: 5 })
  })

  it('écrit une copie simple, pas le proxy réactif', async () => {
    const { state, save, resolveLoad } = setup(undefined)
    resolveLoad()
    await settle()
    state.value.value = 3
    await waitFor(() => save.mock.calls.length > 0)
    const written = save.mock.calls.at(-1)![0]
    expect(written).toEqual({ value: 3 })
    expect(written).not.toBe(state.value)
    expect(() => structuredClone(written)).not.toThrow()
  })

  it('retire les proxys imbriqués (état reconstruit par étalement)', async () => {
    const save = vi.fn(async (_value: { items: { name: string }[] }) => {})
    const state = ref({ items: [{ name: 'Corde' }] })
    effectScope().run(() => persistState(state, { load: async () => undefined, save, delay: 10 }))
    await settle()
    state.value = { ...state.value, items: [...state.value.items, { name: 'Torche' }] }
    await waitFor(() => save.mock.calls.length > 0)
    expect(() => structuredClone(save.mock.calls.at(-1)![0])).not.toThrow()
    expect(save.mock.calls.at(-1)![0]).toEqual({ items: [{ name: 'Corde' }, { name: 'Torche' }] })
  })

  it('écrit immédiatement l\'écriture en attente à la destruction', async () => {
    const { state, save, scope, resolveLoad } = setup(undefined)
    resolveLoad()
    await settle()
    save.mockClear()
    state.value.value = 9
    await nextTick()
    scope.stop()
    expect(save).toHaveBeenCalledWith({ value: 9 })
  })

  it('écrit à chaque changement par défaut (sans délai)', async () => {
    const save = vi.fn(async (_value: Counter) => {})
    const state = ref<Counter>({ value: 0 })
    effectScope().run(() => persistState(state, { load: async () => undefined, save }))
    await settle()
    save.mockClear()
    state.value.value = 1
    await nextTick()
    expect(save).toHaveBeenCalledWith({ value: 1 })
    state.value.value = 2
    await nextTick()
    expect(save).toHaveBeenCalledTimes(2)
  })

  it('reste utilisable en mémoire si le stockage est indisponible', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { state, save, resolveLoad } = setup(undefined, { failLoad: true })
    resolveLoad()
    await settle()
    expect(state.value.value).toBe(0)
    state.value.value = 2
    await waitFor(() => save.mock.calls.length > 0)
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })

  it('ne charge qu\'une fois pour un état partagé par plusieurs composants', async () => {
    const { state, load, save, resolveLoad } = setup({ value: 4 })
    const other = effectScope()
    other.run(() => persistState(state, { load, save, delay: 20 }))
    resolveLoad()
    await settle()
    expect(load).toHaveBeenCalledTimes(1)
    save.mockClear()
    state.value.value = 5
    await waitFor(() => save.mock.calls.length > 0)
    await new Promise(resolve => setTimeout(resolve, 40))
    expect(save).toHaveBeenCalledTimes(1)
  })
})
