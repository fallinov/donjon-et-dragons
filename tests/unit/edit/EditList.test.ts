import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import EditList from '~/components/edit/EditList.vue'

interface Item { name: string }

function mountList(items: Item[], extra: Record<string, unknown> = {}) {
  let current = items
  const wrapper = mount(EditList<Item>, {
    props: {
      'modelValue': items,
      'onUpdate:modelValue': (next: Item[]) => {
        current = next
        void wrapper.setProps({ modelValue: next })
      },
      'addLabel': 'Ajouter',
      'itemName': (item: Item) => item.name,
      'create': () => ({ name: '' }),
      ...extra,
    },
    slots: { default: ({ item }: { item: Item }) => h('span', item.name) },
  })
  return { wrapper, value: () => current }
}

describe('EditList', () => {
  it('ajoute un élément vide', async () => {
    const { wrapper, value } = mountList([{ name: 'Commun' }])
    await wrapper.findAll('button').at(-1)!.trigger('click')
    expect(value()).toEqual([{ name: 'Commun' }, { name: '' }])
  })

  it('retire un élément', async () => {
    const { wrapper, value } = mountList([{ name: 'Commun' }, { name: 'Elfique' }])
    await wrapper.find('button[aria-label="Retirer Commun"]').trigger('click')
    expect(value()).toEqual([{ name: 'Elfique' }])
  })

  it('déplace un élément et désactive les déplacements impossibles', async () => {
    const { wrapper, value } = mountList([{ name: 'Commun' }, { name: 'Elfique' }])
    expect(wrapper.find('button[aria-label="Monter Commun"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button[aria-label="Descendre Elfique"]').attributes('disabled')).toBeDefined()
    await wrapper.find('button[aria-label="Descendre Commun"]').trigger('click')
    expect(value()).toEqual([{ name: 'Elfique' }, { name: 'Commun' }])
  })

  it('nomme un élément sans nom par sa position', () => {
    const { wrapper } = mountList([{ name: '' }])
    expect(wrapper.find('button[aria-label="Retirer élément 1"]').exists()).toBe(true)
  })

  it('indique une liste vide', () => {
    const { wrapper } = mountList([])
    expect(wrapper.text()).toContain('Aucun élément.')
  })

  it('repliable : fermé par défaut, nommé par l\'élément, ouvert à l\'ajout', async () => {
    const { wrapper } = mountList([{ name: 'Sommeil' }], { collapsible: true })
    const details = () => wrapper.findAll('details')
    expect(details()[0]!.attributes('open')).toBeUndefined()
    expect(wrapper.find('summary').text()).toContain('Sommeil')
    await wrapper.findAll('button').at(-1)!.trigger('click')
    expect(details()[1]!.attributes('open')).toBeDefined()
  })

  it('repliable : un élément en erreur reste ouvert', () => {
    const { wrapper } = mountList([{ name: 'A' }, { name: '' }], { collapsible: true, invalid: (i: number) => i === 1 })
    const details = wrapper.findAll('details')
    expect(details[0]!.attributes('open')).toBeUndefined()
    expect(details[1]!.attributes('open')).toBeDefined()
  })
})

