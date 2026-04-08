import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CodexSpells from '~/components/codex/CodexSpells.vue'
import { darethBrumeval } from '~/data/characters/dareth-brumeval'

describe('CodexSpells', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear()
  })

  it('affiche initialement tous les emplacements disponibles', () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    expect(wrapper.get('#slots-count').text()).toBe('3 / 3')
    const slots = wrapper.findAll('[data-slot]')
    expect(slots).toHaveLength(3)
    slots.forEach(slot => expect(slot.attributes('aria-pressed')).toBe('false'))
  })

  it('décrémente le compteur quand un emplacement est consommé', async () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    const firstSlot = wrapper.findAll('[data-slot]')[0]!
    await firstSlot.trigger('click')

    expect(wrapper.get('#slots-count').text()).toBe('2 / 3')
    expect(firstSlot.attributes('aria-pressed')).toBe('true')
    expect(firstSlot.attributes('aria-label')).toContain('consommé')
  })

  it('peut restaurer un emplacement consommé', async () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    const slot = wrapper.findAll('[data-slot]')[0]!
    await slot.trigger('click')
    await slot.trigger('click')
    expect(wrapper.get('#slots-count').text()).toBe('3 / 3')
    expect(slot.attributes('aria-pressed')).toBe('false')
  })

  it('affiche le DD de sauvegarde des sorts', () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    expect(wrapper.text()).toContain('DD de sauvegarde des sorts')
    expect(wrapper.text()).toContain('12')
  })

  it('liste tous les sorts connus', () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    expect(wrapper.text()).toContain('Marque du chasseur')
    expect(wrapper.text()).toContain("Grêle d'épines")
  })
})
