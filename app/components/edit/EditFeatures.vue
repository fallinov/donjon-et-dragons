<script setup lang="ts">
import type { Character, Trait } from '~~/shared/types/character'
import { t } from '~/composables/useT'
import { errorFor, type ValidationError } from '~/utils/validateCharacter'

defineProps<{ errors: ValidationError[] }>()
const character = defineModel<Character>({ required: true })

const createFeature = (): Trait => ({ title: '', description: '', benefits: [] })
</script>

<template>
  <EditSection id="edit-features" :title="t('editor.section.features')">
    <EditList v-model="character.features" collapsible :invalid="i => errors.some(e => e.path.startsWith(`features.${i}.`))" :add-label="t('editor.add')" :item-name="feature => feature.title" :create="createFeature">
      <template #default="{ item: feature, index }">
        <div class="grid gap-3">
          <EditText v-model="feature.title" :label="t('field.featureTitle')" :error="errorFor(errors, `features.${index}.title`)" />
          <EditText v-model="feature.description" multiline :label="t('field.featureDescription')" />
          <fieldset>
            <legend class="font-display text-xs tracking-wider-3 text-gold/80 uppercase mb-2">{{ t('editor.subsection.benefits') }}</legend>
            <EditList
              :model-value="feature.benefits ?? []"
              inline
              :add-label="t('editor.add')"
              :item-name="benefit => benefit"
              :create="() => ''"
              @update:model-value="feature.benefits = $event"
            >
              <template #default="{ item: benefit, index: j }">
                <EditText
                  :model-value="benefit"
                  :label="t('field.benefit')"
                  :error="errorFor(errors, `features.${index}.benefits.${j}`)"
                  @update:model-value="feature.benefits![j] = $event"
                />
              </template>
            </EditList>
          </fieldset>
        </div>
      </template>
    </EditList>
  </EditSection>
</template>
