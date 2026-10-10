import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import type { Character } from '~~/shared/types/character'
import EditSpellcasting from '~/components/edit/EditSpellcasting.vue'
import EditCheckbox from '~/components/edit/EditCheckbox.vue'
import EditList from '~/components/edit/EditList.vue'
import EditNumber from '~/components/edit/EditNumber.vue'
import EditSection from '~/components/edit/EditSection.vue'
import EditSelect from '~/components/edit/EditSelect.vue'
import EditText from '~/components/edit/EditText.vue'
import { useCharacterDraft } from '~/composables/useCharacterDraft'
import { darethBrumeval } from '../../helpers/characters'

const global = { components: { EditSection, EditNumber, EditCheckbox, EditList, EditSelect, EditText } }

function mountWith(source: Character) {
  const { draft, start } = useCharacterDraft()
  start(source)
  const character = ref(draft.value!)
  const wrapper = mount(EditSpellcasting, {
    props: { 'modelValue': character.value, 'onUpdate:modelValue': (v: Character) => { character.value = v }, 'errors': [] },
    global,
  })
  return { wrapper, character }
}

describe('EditSpellcasting', () => {
  it('décocher « Lanceur de sorts » retire le bloc sorts', async () => {
    const { wrapper, character } = mountWith(darethBrumeval)
    await wrapper.find('input[type="checkbox"]').setValue(false)
    expect(character.value.spellcasting).toBeUndefined()
    expect(wrapper.find('[data-edit-list]').exists()).toBe(false)
  })

  it('cocher crée un bloc vide avec un DD à saisir (aucune valeur inventée)', async () => {
    const { wrapper, character } = mountWith({ ...darethBrumeval, spellcasting: undefined })
    await wrapper.find('input[type="checkbox"]').setValue(true)
    expect(character.value.spellcasting).toMatchObject({ slotLevels: [], spells: [] })
    expect(character.value.spellcasting!.saveDc).toBeNaN()
  })

  it('ajoute un sort avec tous les champs texte vides', async () => {
    const { wrapper, character } = mountWith(darethBrumeval)
    const before = character.value.spellcasting!.spells.length
    const addButtons = wrapper.findAll('button').filter(b => b.text() === '+ Ajouter')
    await addButtons.at(-1)!.trigger('click')
    const added = character.value.spellcasting!.spells.at(-1)!
    expect(character.value.spellcasting!.spells).toHaveLength(before + 1)
    expect(added).toMatchObject({ title: '', level: 0, cost: 'cantrip', range: '', concentration: false })
  })

  it('bonus d\'attaque vidé : propriété retirée', async () => {
    const { wrapper, character } = mountWith({ ...darethBrumeval, spellcasting: { ...darethBrumeval.spellcasting!, attackBonus: 5 } })
    const input = wrapper.findAll('input[type="number"]')[1]!
    await input.setValue('')
    expect(character.value.spellcasting!.attackBonus).toBeUndefined()
  })
})
