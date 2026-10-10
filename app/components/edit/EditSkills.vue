<script setup lang="ts">
import type { Character, Skill } from '~~/shared/types/character'
import { t, type MessageKey } from '~/composables/useT'
import { errorFor, type ValidationError } from '~/utils/validateCharacter'

defineProps<{ errors: ValidationError[] }>()
const character = defineModel<Character>({ required: true })

const ABILITIES: Skill['ability'][] = ['For', 'Dex', 'Con', 'Int', 'Sag', 'Cha']
const abilityOptions = ABILITIES.map(value => ({ value, label: t(`abilityShort.${value}` as MessageKey) }))

const createSkill = (): Skill => ({ name: '', ability: 'Dex', modifier: 0, proficient: false })
</script>

<template>
  <EditSection id="edit-skills" :title="t('editor.section.skills')" :hint="t('editor.derivedHint')">
    <EditList
      v-model="character.skills"
      :add-label="t('editor.add')"
      :item-name="skill => skill.name"
      :create="createSkill"
    >
      <template #default="{ item, index }">
        <div class="grid grid-cols-[1fr_6rem] gap-2 sm:grid-cols-[1fr_7rem_7rem_auto] sm:items-end">
          <EditText v-model="item.name" :label="t('field.skillName')" :error="errorFor(errors, `skills.${index}.name`)" />
          <EditSelect v-model="item.ability" :label="t('field.skillAbility')" :options="abilityOptions" />
          <EditNumber v-model="item.modifier" signed :label="t('field.modifier')" :short="t('field.modifierShort')" :error="errorFor(errors, `skills.${index}.modifier`)" />
          <EditCheckbox v-model="item.proficient" :label="t('field.proficient')" />
        </div>
      </template>
    </EditList>
  </EditSection>
</template>
