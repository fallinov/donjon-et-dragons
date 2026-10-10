import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import EditAbilities from '~/components/edit/EditAbilities.vue'
import EditCheckbox from '~/components/edit/EditCheckbox.vue'
import EditNumber from '~/components/edit/EditNumber.vue'
import EditSection from '~/components/edit/EditSection.vue'
import type { Character } from '~~/shared/types/character'
import { darethBrumeval } from '../../helpers/characters'

const global = { components: { EditSection, EditNumber, EditCheckbox } }

function mountAbilities(errors = [] as { path: string, message: 'validation.integer' }[]) {
  const character = ref<Character>(structuredClone(darethBrumeval))
  const wrapper = mount(EditAbilities, {
    props: { 'modelValue': character.value, 'onUpdate:modelValue': (v: Character) => { character.value = v }, errors },
    global,
  })
  return { wrapper, character }
}

describe('EditAbilities', () => {
  it('affiche les six caractéristiques avec leurs valeurs', () => {
    const { wrapper } = mountAbilities()
    expect(wrapper.findAll('[data-ability]')).toHaveLength(6)
    const wisdom = wrapper.find('[data-ability="wisdom"]')
    expect(wisdom.text()).toContain('Sagesse')
    expect((wisdom.find('input[type="number"]').element as HTMLInputElement).value).toBe('15')
  })

  it('met à jour la valeur saisie, et NaN pour un champ vidé', async () => {
    const { wrapper, character } = mountAbilities()
    const inputs = wrapper.find('[data-ability="wisdom"]').findAll('input[type="number"]')
    await inputs[0]!.setValue('16')
    expect(character.value.abilities.wisdom.score).toBe(16)
    await inputs[1]!.setValue('')
    expect(character.value.abilities.wisdom.modifier).toBeNaN()
    await inputs[1]!.setValue('-1')
    expect(character.value.abilities.wisdom.modifier).toBe(-1)
  })

  it('bascule la maîtrise', async () => {
    const { wrapper, character } = mountAbilities()
    await wrapper.find('[data-ability="wisdom"] input[type="checkbox"]').setValue(true)
    expect(character.value.abilities.wisdom.proficient).toBe(true)
  })

  it('affiche l\'erreur du champ concerné', () => {
    const { wrapper } = mountAbilities([{ path: 'abilities.wisdom.score', message: 'validation.integer' }])
    const error = wrapper.find('[data-ability="wisdom"] [data-field-error]')
    expect(error.text()).toBe('Nombre entier attendu.')
    expect(wrapper.find('[data-ability="wisdom"] input[aria-invalid="true"]').exists()).toBe(true)
  })
})
