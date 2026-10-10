<script setup lang="ts">
import type { Character } from '~~/shared/types/character'
import { t } from '~/composables/useT'
import { useObjectUrl } from '~/composables/useObjectUrl'

const character = defineModel<Character>({ required: true })
const portraitUrl = useObjectUrl(() => character.value.portrait)
</script>

<template>
  <EditSection id="edit-portrait" :title="t('editor.section.portrait')">
    <div class="grid gap-4 sm:grid-cols-[8rem_1fr] sm:items-start">
      <img :src="portraitUrl" alt="" class="w-32 aspect-[3/4] object-cover border border-gold/40">
      <EditText v-model="character.portrait.alt" multiline :label="t('field.portraitAlt')" :hint="t('field.portraitAltHint')" />
    </div>
  </EditSection>
</template>
