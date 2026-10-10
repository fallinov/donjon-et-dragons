import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useObjectUrl } from '~/composables/useObjectUrl'
import { fakePortrait } from '../helpers/characters'

describe('useObjectUrl', () => {
  let counter = 0
  const create = vi.fn(() => `blob:test-${++counter}`)
  const revoke = vi.fn()

  beforeEach(() => {
    counter = 0
    create.mockClear()
    revoke.mockClear()
    vi.spyOn(URL, 'createObjectURL').mockImplementation(create)
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revoke)
  })
  afterEach(() => vi.restoreAllMocks())

  it('crée une URL, la révoque au changement puis à la destruction', async () => {
    const scope = effectScope()
    const source = ref(fakePortrait(1))
    const url = scope.run(() => useObjectUrl(source))!
    expect(url.value).toBe('blob:test-1')

    source.value = fakePortrait(2)
    await nextTick()
    expect(url.value).toBe('blob:test-2')
    expect(revoke).toHaveBeenCalledWith('blob:test-1')

    scope.stop()
    expect(revoke).toHaveBeenCalledWith('blob:test-2')
  })

  it('renvoie undefined sans portrait', () => {
    const scope = effectScope()
    const url = scope.run(() => useObjectUrl(() => undefined))!
    expect(url.value).toBeUndefined()
    expect(create).not.toHaveBeenCalled()
    scope.stop()
  })
})
