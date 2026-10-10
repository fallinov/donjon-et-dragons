import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CodexInventory from '~/components/codex/CodexInventory.vue'
import { inventoryFromStart } from '~/composables/useInventory'
import { getInventory, putInventory } from '~/db/characterRepository'
import { darethBrumeval, darethSeed, settle, waitFor } from '../helpers/characters'

const startingItems = darethSeed.inventory!.equipment.length

async function mountLoaded() {
  const wrapper = mount(CodexInventory, { props: { character: darethBrumeval } })
  await settle()
  return wrapper
}

describe('CodexInventory', () => {
  beforeEach(async () => {
    // Sac tel qu'importé au premier lancement
    await putInventory(darethBrumeval.id, inventoryFromStart(darethSeed.inventory))
  })

  it('affiche l\'argent et l\'équipement enregistrés sur l\'appareil', async () => {
    const wrapper = await mountLoaded()
    expect((wrapper.find('[data-coin="gp"]').element as HTMLInputElement).value).toBe('360')
    expect(wrapper.findAll('[data-inventory-items] li').length).toBe(startingItems)
  })

  it('ajoute un objet via le formulaire et l\'enregistre', async () => {
    const wrapper = await mountLoaded()
    await wrapper.find('input[type="text"]').setValue('Lanterne')
    await wrapper.find('form').trigger('submit')
    const items = wrapper.findAll('[data-inventory-items] li')
    expect(items).toHaveLength(startingItems + 1)
    expect(items.at(-1)!.text()).toContain('Lanterne')
    await waitFor(async () => {
      const saved = await getInventory(darethBrumeval.id) as { items: { name: string }[] }
      return saved.items.some(item => item.name === 'Lanterne')
    })
  })

  it('modifie la quantité avec les boutons', async () => {
    const wrapper = await mountLoaded()
    const torch = wrapper.findAll('[data-inventory-items] li').find(li => li.text().includes('Torche'))!
    await torch.find('button[aria-label^="Diminuer"]').trigger('click')
    const updated = wrapper.findAll('[data-inventory-items] li').find(li => li.text().includes('Torche'))!
    expect(updated.find('[data-item-quantity]').text()).toBe('9')
  })

  it('met à jour une pièce saisie', async () => {
    const wrapper = await mountLoaded()
    const gp = wrapper.find('[data-coin="gp"]')
    await gp.setValue('400')
    await gp.trigger('change')
    expect((wrapper.find('[data-coin="gp"]').element as HTMLInputElement).value).toBe('400')
  })

  it('affiche un sac vide si rien n\'est enregistré', async () => {
    const wrapper = mount(CodexInventory, { props: { character: { ...darethBrumeval, id: 'sans-sac' } } })
    await settle()
    expect(wrapper.find('[data-inventory-items]').exists()).toBe(false)
    expect((wrapper.find('[data-coin="gp"]').element as HTMLInputElement).value).toBe('0')
  })
})
