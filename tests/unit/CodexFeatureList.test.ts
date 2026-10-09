import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CodexFeatureList from '~/components/codex/CodexFeatureList.vue'

describe('CodexFeatureList', () => {
  it('affiche les avantages en liste quand ils existent', () => {
    const wrapper = mount(CodexFeatureList, {
      props: { features: [{ title: 'Ennemi juré', description: 'Dragons.', benefits: ['Avantage pour pister.', 'Langue : Draconique.'] }] },
    })
    const items = wrapper.findAll('[data-feature-benefits] li')
    expect(items).toHaveLength(2)
    expect(items[0]!.text()).toContain('Avantage pour pister.')
  })

  it('n\'affiche pas de liste pour une capacité sans avantages', () => {
    const wrapper = mount(CodexFeatureList, { props: { features: [{ title: 'Tueur de colosses', description: '+1d8.' }] } })
    expect(wrapper.find('[data-feature-benefits]').exists()).toBe(false)
  })
})
