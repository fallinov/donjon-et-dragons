import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import type { Character } from '~~/shared/types/character'
import EditFeatures from '~/components/edit/EditFeatures.vue'
import EditList from '~/components/edit/EditList.vue'
import EditSection from '~/components/edit/EditSection.vue'
import EditText from '~/components/edit/EditText.vue'
import { useCharacterDraft } from '~/composables/useCharacterDraft'
import { darethBrumeval } from '../../helpers/characters'

describe('EditFeatures', () => {
  it('modifie un avantage imbriqué et en ajoute un à une aptitude sans avantages', async () => {
    const { draft, start } = useCharacterDraft()
    start({ ...darethBrumeval, features: [{ title: 'Ruse', description: 'x', benefits: ['Avant'] }, { title: 'Vigilance', description: 'y' }] })
    const character = ref<Character>(draft.value!)
    const wrapper = mount(EditFeatures, {
      props: { 'modelValue': character.value, 'onUpdate:modelValue': (v: Character) => { character.value = v }, 'errors': [] },
      global: { components: { EditSection, EditList, EditText } },
    })

    const benefit = wrapper.findAll('input[type="text"]').find(i => (i.element as HTMLInputElement).value === 'Avant')!
    await benefit.setValue('Après')
    expect(character.value.features[0]!.benefits).toEqual(['Après'])

    const items = wrapper.findAll('[data-edit-item]').filter(li => li.text().includes('Avantages'))
    const addBenefit = items[1]!.findAll('button').find(b => b.text() === '+ Ajouter')!
    await addBenefit.trigger('click')
    expect(character.value.features[1]!.benefits).toEqual([''])
  })
})
