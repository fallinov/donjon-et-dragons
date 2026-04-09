import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CodexSpells from '~/components/codex/CodexSpells.vue'
import { darethBrumeval } from '~/data/characters/dareth-brumeval'

describe('CodexSpells', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear()
  })

  it('affiche les emplacements pour chaque niveau', () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    expect(wrapper.text()).toContain('Niv. 1')
    expect(wrapper.text()).toContain('3 / 3')
    const slots = wrapper.findAll('[data-slot]')
    expect(slots).toHaveLength(3)
  })

  it('affiche la difficulté de sauvegarde des sorts', () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    expect(wrapper.text()).toContain('Difficulté de sauvegarde')
    expect(wrapper.text()).toContain('12')
  })

  it('liste les sorts connus avec bouton Lancer', () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    expect(wrapper.text()).toContain('Marque du chasseur')
    expect(wrapper.text()).toContain("Grêle d'épines")
    expect(wrapper.text()).toContain('Soins')
    const buttons = wrapper.findAll('button')
    const launchButtons = buttons.filter(b => b.text().includes('Lancer'))
    expect(launchButtons.length).toBeGreaterThanOrEqual(3)
  })

  it('Lancer un sort consomme un emplacement', async () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    const launchBtn = wrapper.findAll('button').find(b => b.text() === 'Lancer')!
    await launchBtn.trigger('click')
    expect(wrapper.text()).toContain('2 / 3')
  })

  it('désactive Lancer quand plus d\'emplacements', async () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    const launchButtons = wrapper.findAll('button').filter(b => b.text() === 'Lancer')
    // Consommer les 3 emplacements
    for (let i = 0; i < 3; i++) {
      await launchButtons[0]!.trigger('click')
    }
    expect(wrapper.text()).toContain('0 / 3')
    // Les boutons Lancer doivent être disabled
    const btn = wrapper.findAll('button').find(b => b.text() === 'Lancer')
    expect(btn?.attributes('disabled')).toBeDefined()
  })
})
