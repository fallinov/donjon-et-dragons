<script setup lang="ts">
import type { Character } from '~~/shared/types/character'
import { t } from '~/composables/useT'
import { errorFor, type ValidationError } from '~/utils/validateCharacter'

defineProps<{ errors: ValidationError[] }>()
const character = defineModel<Character>({ required: true })
</script>

<template>
  <EditSection id="edit-identity" :title="t('editor.section.identity')">
    <div class="grid gap-4 sm:grid-cols-2">
      <EditText v-model="character.firstName" :label="t('field.firstName')" required :error="errorFor(errors, 'firstName')" />
      <EditText v-model="character.lastName!" :label="t('field.lastName')" />
      <EditText v-model="character.player" :label="t('field.player')" />
      <EditText v-model="character.eyebrow" :label="t('field.eyebrow')" :hint="t('field.eyebrowHint')" />
      <EditText v-model="character.race" :label="t('field.race')" />
      <EditText v-model="character.className" :label="t('field.className')" />
      <EditNumber v-model="character.level" :label="t('field.level')" required :error="errorFor(errors, 'level')" />
      <EditText v-model="character.background" :label="t('field.background')" />
      <EditText v-model="character.alignment" :label="t('field.alignment')" />
      <EditText v-model="character.colophon" class="sm:col-span-2" multiline :rows="2" :label="t('field.colophon')" :hint="t('field.colophonHint')" />
    </div>
  </EditSection>
</template>
