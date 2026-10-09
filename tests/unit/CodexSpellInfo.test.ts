import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CodexSpellInfo from '~/components/codex/CodexSpellInfo.vue'
import type { Spell } from '~~/shared/types/character'

const detailed: Spell = {
  title: "Croissance d'épines",
  description: 'Terrain difficile.',
  level: 2,
  cost: 'slot',
  castingTime: 'Action',
  range: '45 m',
  duration: '10 minutes',
  concentration: true,
  check: 'Perception DD 13',
  effect: '2d4 perçants',
}

const minimal: Spell = { title: 'Lumière', description: 'Un objet brille.', level: 0, cost: 'cantrip' }

describe('CodexSpellInfo', () => {
  it('affiche temps, portée et durée dans cet ordre', () => {
    const wrapper = mount(CodexSpellInfo, { props: { spell: detailed } })
    const meta = wrapper.find('[data-spell-meta]').text()
    expect(meta.indexOf('Action')).toBeLessThan(meta.indexOf('45 m'))
    expect(meta.indexOf('45 m')).toBeLessThan(meta.indexOf('10 minutes'))
  })

  it('affiche le badge de concentration, la sauvegarde et les dégâts', () => {
    const wrapper = mount(CodexSpellInfo, { props: { spell: detailed } })
    expect(wrapper.find('[data-spell-concentration]').exists()).toBe(true)
    expect(wrapper.find('[data-spell-check]').text()).toBe('Perception DD 13')
    expect(wrapper.find('[data-spell-effect]').text()).toBe('2d4 perçants')
  })

  it('reste compatible avec un sort sans détails', () => {
    const wrapper = mount(CodexSpellInfo, { props: { spell: minimal } })
    expect(wrapper.text()).toContain('Lumière')
    expect(wrapper.text()).toContain('Un objet brille.')
    expect(wrapper.find('[data-spell-meta]').exists()).toBe(false)
    expect(wrapper.find('[data-spell-concentration]').exists()).toBe(false)
    expect(wrapper.find('[data-spell-check]').exists()).toBe(false)
    expect(wrapper.find('[data-spell-effect]').exists()).toBe(false)
  })
})
