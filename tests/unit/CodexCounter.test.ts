import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CodexCounter from '~/components/codex/CodexCounter.vue'

const mountCounter = () => mount(CodexCounter, { props: { label: 'Points de vie', value: 10 } })
const minus = (w: ReturnType<typeof mountCounter>) => w.get('button[aria-label="Diminuer points de vie"]')
const plus = (w: ReturnType<typeof mountCounter>) => w.get('button[aria-label="Augmenter points de vie"]')

describe('CodexCounter', () => {
  it('toucher : un pointerdown déclenche l\'action', async () => {
    const w = mountCounter()
    await minus(w).trigger('pointerdown')
    await plus(w).trigger('pointerdown')
    expect(w.emitted('minus')).toHaveLength(1)
    expect(w.emitted('plus')).toHaveLength(1)
  })

  it('clavier (Entrée, Espace) : un click sans pointeur déclenche l\'action', async () => {
    const w = mountCounter()
    await minus(w).trigger('click', { detail: 0 })
    await plus(w).trigger('click', { detail: 0 })
    expect(w.emitted('minus')).toHaveLength(1)
    expect(w.emitted('plus')).toHaveLength(1)
  })

  it('le click qui suit un toucher ne compte pas deux fois', async () => {
    const w = mountCounter()
    await minus(w).trigger('pointerdown')
    await minus(w).trigger('pointerup')
    await minus(w).trigger('click', { detail: 1 })
    expect(w.emitted('minus')).toHaveLength(1)
  })
})
