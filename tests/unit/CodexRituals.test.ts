import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CodexRituals from '~/components/codex/CodexRituals.vue'
import { darethBrumeval } from '../helpers/characters'

const rituals = darethBrumeval.rituals

describe('CodexRituals — affichage ouvert (ordinateur)', () => {
  it('affiche toutes les formules sans bouton', () => {
    const wrapper = mount(CodexRituals, { props: { rituals } })
    expect(wrapper.findAll('button')).toHaveLength(0)
    expect(wrapper.findAll('[id^="rite-panel-"]').every(p => p.isVisible())).toBe(true)
  })
})

describe('CodexRituals — accordéon (mobile)', () => {
  it('ferme tous les rites au départ', () => {
    const wrapper = mount(CodexRituals, { props: { rituals, collapsible: true }, attachTo: document.body })
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(rituals.length)
    expect(buttons.every(b => b.attributes('aria-expanded') === 'false')).toBe(true)
    expect(wrapper.findAll('[id^="rite-panel-"]').some(p => p.isVisible())).toBe(false)
    wrapper.unmount()
  })

  it('relie chaque bouton à son panneau', () => {
    const wrapper = mount(CodexRituals, { props: { rituals, collapsible: true } })
    wrapper.findAll('button').forEach((b, i) => {
      expect(b.attributes('aria-controls')).toBe(`rite-panel-${i}`)
      expect(wrapper.find(`#rite-panel-${i}`).exists()).toBe(true)
    })
  })

  it('ouvre et referme un rite au clic', async () => {
    const wrapper = mount(CodexRituals, { props: { rituals, collapsible: true }, attachTo: document.body })
    const first = wrapper.findAll('button')[0]!
    await first.trigger('click')
    expect(first.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#rite-panel-0').isVisible()).toBe(true)
    await first.trigger('click')
    expect(first.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('#rite-panel-0').isVisible()).toBe(false)
    wrapper.unmount()
  })

  it('permet d\'ouvrir plusieurs rites à la fois', async () => {
    const wrapper = mount(CodexRituals, { props: { rituals, collapsible: true }, attachTo: document.body })
    const buttons = wrapper.findAll('button')
    await buttons[0]!.trigger('click')
    await buttons[2]!.trigger('click')
    expect(wrapper.find('#rite-panel-0').isVisible()).toBe(true)
    expect(wrapper.find('#rite-panel-1').isVisible()).toBe(false)
    expect(wrapper.find('#rite-panel-2').isVisible()).toBe(true)
    wrapper.unmount()
  })
})

describe('CodexRituals — sous-titre et note', () => {
  it('compte les séquences en toutes lettres', () => {
    const wrapper = mount(CodexRituals, { props: { rituals } })
    expect(wrapper.text()).toContain('cinq séquences')
    const one = mount(CodexRituals, { props: { rituals: rituals.slice(0, 1) } })
    expect(one.text()).toContain('une séquence à graver')
  })

  it('affiche la note seulement si elle existe', () => {
    const without = mount(CodexRituals, { props: { rituals } })
    expect(without.find('[data-rituals-note]').exists()).toBe(false)
    const withNote = mount(CodexRituals, { props: { rituals, note: 'Un seul sort de concentration.' } })
    expect(withNote.find('[data-rituals-note]').text()).toContain('Un seul sort de concentration.')
  })
})
