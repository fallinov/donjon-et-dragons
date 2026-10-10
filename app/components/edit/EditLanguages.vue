<script setup lang="ts">
import type { Character } from '~~/shared/types/character'
import { t } from '~/composables/useT'
import { errorFor, type ValidationError } from '~/utils/validateCharacter'

defineProps<{ errors: ValidationError[] }>()
const character = defineModel<Character>({ required: true })

const createLanguage = (): Character['languages'][number] => ({ name: '', rare: false })
</script>

<template>
  <EditSection id="edit-languages" :title="t('editor.section.languages')">
    <EditList
      v-model="character.languages"
      :add-label="t('editor.add')"
      :item-name="language => language.name"
      :create="createLanguage"
    >
      <template #default="{ item, index }">
        <div class="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <EditText v-model="item.name" :label="t('field.languageName')" :error="errorFor(errors, `languages.${index}.name`)" />
          <EditCheckbox :model-value="item.rare ?? false" :label="t('field.languageRare')" @update:model-value="item.rare = $event" />
        </div>
      </template>
    </EditList>
  </EditSection>
</template>
