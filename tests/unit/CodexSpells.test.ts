import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CodexSpells from '~/components/codex/CodexSpells.vue'
import { darethBrumeval, zanna } from '../helpers/characters'

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

  it('épuise le niveau 1 puis lance le sort de niveau 1 avec un emplacement de niveau 2', async () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    const launch = () => wrapper.findAll('button').find(b => b.text() === 'Lancer')!
    for (let i = 0; i < 4; i++) await launch().trigger('click')
    expect(wrapper.find('#slots-count-1').text()).toBe('0 / 4')
    expect(wrapper.find('#slots-count-2').text()).toBe('2 / 2')
    await launch().trigger('click')
    expect(wrapper.find('#slots-count-2').text()).toBe('1 / 2')
  })

  it('désactive Lancer quand plus aucun emplacement suffisant', async () => {
    const wrapper = mount(CodexSpells, { props: { character: darethBrumeval } })
    const launch = () => wrapper.findAll('button').find(b => b.text() === 'Lancer')!
    for (let i = 0; i < 6; i++) await launch().trigger('click')
    const buttons = wrapper.findAll('button').filter(b => b.text() === 'Lancer')
    expect(buttons.length).toBeGreaterThan(0)
    for (const b of buttons) expect(b.attributes('disabled')).toBeDefined()
  })

  it('magie de pacte : Zanna voit ses sorts de niveau 1 et les lance avec ses emplacements de niveau 2', async () => {
    const wrapper = mount(CodexSpells, { props: { character: zanna } })
    expect(wrapper.text()).toContain('Sorts de niveau 1')
    expect(wrapper.text()).toContain('Sorts de niveau 2')
    expect(wrapper.text()).toContain('Sommeil')
    expect(wrapper.text()).toContain('Armure du mage')
    const sleepRow = wrapper.findAll('li').find(li => li.text().includes('Sommeil'))!
    await sleepRow.find('button').trigger('click')
    expect(wrapper.find('#slots-count-2').text()).toBe('1 / 2')
  })
})
