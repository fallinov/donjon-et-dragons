import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CodexInventory from '~/components/codex/CodexInventory.vue'
import { darethBrumeval } from '~/data/characters/dareth-brumeval'

describe('CodexInventory', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear()
  })

  it('affiche l\'argent et l\'équipement de départ', () => {
    const wrapper = mount(CodexInventory, { props: { character: darethBrumeval } })
    expect((wrapper.find('[data-coin="gp"]').element as HTMLInputElement).value).toBe('360')
    expect(wrapper.findAll('[data-inventory-items] li').length).toBe(darethBrumeval.inventory!.equipment.length)
  })

  it('ajoute un objet via le formulaire', async () => {
    const wrapper = mount(CodexInventory, { props: { character: darethBrumeval } })
    const before = wrapper.findAll('[data-inventory-items] li').length
    await wrapper.find('input[type="text"]').setValue('Lanterne')
    await wrapper.find('form').trigger('submit')
    const items = wrapper.findAll('[data-inventory-items] li')
    expect(items).toHaveLength(before + 1)
    expect(items.at(-1)!.text()).toContain('Lanterne')
  })

  it('modifie la quantité avec les boutons', async () => {
    const wrapper = mount(CodexInventory, { props: { character: darethBrumeval } })
    const torch = wrapper.findAll('[data-inventory-items] li').find(li => li.text().includes('Torche'))!
    await torch.find('button[aria-label^="Diminuer"]').trigger('click')
    const updated = wrapper.findAll('[data-inventory-items] li').find(li => li.text().includes('Torche'))!
    expect(updated.find('[data-item-quantity]').text()).toBe('9')
  })

  it('met à jour une pièce saisie', async () => {
    const wrapper = mount(CodexInventory, { props: { character: darethBrumeval } })
    const gp = wrapper.find('[data-coin="gp"]')
    await gp.setValue('400')
    await gp.trigger('change')
    expect((wrapper.find('[data-coin="gp"]').element as HTMLInputElement).value).toBe('400')
  })
})
