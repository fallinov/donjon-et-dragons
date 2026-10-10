<script setup lang="ts">
import type { Character } from '~~/shared/types/character'
import { t } from '~/composables/useT'

const character = defineModel<Character>({ required: true })
</script>

<template>
  <EditSection id="edit-personality" :title="t('editor.section.personality')">
    <div class="grid gap-4">
      <EditText v-model="character.personality.trait" multiline :label="t('field.trait')" />
      <EditText v-model="character.personality.idealLabel!" :label="t('field.idealLabel')" :hint="t('field.idealLabelHint')" />
      <EditText v-model="character.personality.ideal" multiline :label="t('field.ideal')" />
      <EditText v-model="character.personality.bond" multiline :label="t('field.bond')" />
      <EditText v-model="character.personality.flaw" multiline :label="t('field.flaw')" />
    </div>
  </EditSection>
</template>
