<script setup lang="ts">
import type { Character, Ritual, RitualStep } from '~~/shared/types/character'
import { t } from '~/composables/useT'
import { errorFor, type ValidationError } from '~/utils/validateCharacter'

defineProps<{ errors: ValidationError[] }>()
const character = defineModel<Character>({ required: true })

const createRitual = (): Ritual => ({ number: '', title: '', steps: [], formulas: [], footnote: '' })
const createStep = (): RitualStep => ({ text: '', emphasis: '' })
</script>

<template>
  <EditSection id="edit-rituals" :title="t('editor.section.rituals')">
    <EditList v-model="character.rituals" collapsible :invalid="i => errors.some(e => e.path.startsWith(`rituals.${i}.`))" :add-label="t('editor.add')" :item-name="ritual => ritual.title || ritual.number" :create="createRitual">
      <template #default="{ item: ritual, index }">
        <div class="grid gap-3">
          <div class="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <EditText v-model="ritual.number" :label="t('field.ritualNumber')" :hint="t('field.ritualNumberHint')" :error="errorFor(errors, `rituals.${index}.number`)" />
            <EditText v-model="ritual.title" :label="t('field.ritualTitle')" />
          </div>
          <fieldset>
            <legend class="font-display text-sm tracking-wider-3 text-gold uppercase mb-2">{{ t('editor.subsection.steps') }}</legend>
            <EditList v-model="ritual.steps" :add-label="t('editor.add')" :item-name="step => step.emphasis || step.text" :create="createStep">
              <template #default="{ item: step }">
                <div class="grid gap-2 sm:grid-cols-2">
                  <EditText v-model="step.text" :label="t('field.stepText')" />
                  <EditText v-model="step.emphasis!" :label="t('field.stepEmphasis')" :hint="t('field.stepEmphasisHint')" />
                </div>
              </template>
            </EditList>
          </fieldset>
          <fieldset>
            <legend class="font-display text-sm tracking-wider-3 text-gold uppercase mb-2">{{ t('editor.subsection.formulas') }}</legend>
            <EditList v-model="ritual.formulas" inline :add-label="t('editor.add')" :item-name="formula => formula" :create="() => ''">
              <template #default="{ item: formula, index: j }">
                <EditText :model-value="formula" :label="t('field.formula')" @update:model-value="ritual.formulas[j] = $event" />
              </template>
            </EditList>
          </fieldset>
          <EditText v-model="ritual.footnote!" :label="t('field.footnote')" />
        </div>
      </template>
    </EditList>
    <EditText v-model="character.ritualsNote!" class="mt-4" multiline :rows="2" :label="t('field.ritualsNote')" :hint="t('field.ritualsNoteHint')" />
  </EditSection>
</template>
