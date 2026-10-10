import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CodexSpells from '~/components/codex/CodexSpells.vue'
import { darethBrumeval } from '../helpers/characters'

describe('CodexSpells', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear()
  })

  it('affiche les emplacements pour chaque niveau', () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    expect(wrapper.text()).toContain('Niv. 1')
    expect(wrapper.text()).toContain('Niv. 2')
    expect(wrapper.text()).toContain('4 / 4')
    expect(wrapper.text()).toContain('2 / 2')
    const slots = wrapper.findAll('[data-slot]')
    expect(slots).toHaveLength(6)
  })

  it('affiche la difficulté de sauvegarde des sorts', () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    expect(wrapper.text()).toContain('Difficulté de sauvegarde')
    expect(wrapper.text()).toContain('13')
  })

  it('liste les sorts connus avec bouton Lancer', () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    expect(wrapper.text()).toContain('Marque du chasseur')
    expect(wrapper.text()).toContain('Soins')
    expect(wrapper.text()).toContain('Passage sans trace')
    expect(wrapper.text()).toContain("Croissance d'épines")
    expect(wrapper.text()).not.toContain("Grêle d'épines")
    const buttons = wrapper.findAll('button')
    const launchButtons = buttons.filter(b => b.text().includes('Lancer'))
    expect(launchButtons.length).toBeGreaterThanOrEqual(4)
  })

  it('Lancer un sort consomme un emplacement', async () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    const launchBtn = wrapper.findAll('button').find(b => b.text() === 'Lancer')!
    await launchBtn.trigger('click')
    expect(wrapper.text()).toContain('3 / 4')
  })

  it('désactive Lancer quand plus d\'emplacements', async () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    const launchButtons = wrapper.findAll('button').filter(b => b.text() === 'Lancer')
    // Consommer les 4 emplacements de niveau 1
    for (let i = 0; i < 4; i++) {
      await launchButtons[0]!.trigger('click')
    }
    expect(wrapper.text()).toContain('0 / 4')
    // Les boutons Lancer doivent être disabled
    const btn = wrapper.findAll('button').find(b => b.text() === 'Lancer')
    expect(btn?.attributes('disabled')).toBeDefined()
  })
})
