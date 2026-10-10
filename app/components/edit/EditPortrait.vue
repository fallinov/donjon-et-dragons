<script setup lang="ts">
import { ref, useId } from 'vue'
import type { Character } from '~~/shared/types/character'
import { t, type MessageKey } from '~/composables/useT'
import { useObjectUrl } from '~/composables/useObjectUrl'
import { fetchPortrait } from '~/db/seed'
import { PLACEHOLDER_PORTRAIT_SRC } from '~/utils/characterFactory'
import { ImageError, resizePortrait } from '~/utils/image'

const character = defineModel<Character>({ required: true })
const portraitUrl = useObjectUrl(() => character.value.portrait)

const fileInput = ref<HTMLInputElement>()
const processing = ref(false)
const error = ref<MessageKey>()
const hintId = useId()
const statusId = useId()

function setBytes(bytes: { data: ArrayBuffer, mime: string }): void {
  character.value.portrait = { ...character.value.portrait, data: bytes.data, mime: bytes.mime }
}

async function onFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Permet de choisir à nouveau le même fichier
  input.value = ''
  if (!file) return
  processing.value = true
  error.value = undefined
  try {
    setBytes(await resizePortrait(file))
  }
  catch (cause) {
    error.value = `portrait.error.${cause instanceof ImageError ? cause.code : 'unsupported'}` as MessageKey
  }
  finally {
    processing.value = false
  }
}

async function resetToDefault(): Promise<void> {
  error.value = undefined
  setBytes(await fetchPortrait(PLACEHOLDER_PORTRAIT_SRC))
}
</script>

<template>
  <EditSection id="edit-portrait" :title="t('editor.section.portrait')">
    <div class="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-start">
      <div class="flex gap-4 sm:flex-col">
        <img
          :src="portraitUrl"
          :alt="t('portrait.preview')"
          class="w-28 shrink-0 aspect-[3/4] object-cover border border-gold/40 sm:w-40"
          :class="{ 'opacity-50': processing }"
          data-portrait-preview
        >
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="sr-only"
            tabindex="-1"
            aria-hidden="true"
            data-portrait-input
            @change="onFile"
          >
          <button
            type="button"
            class="min-h-11 border border-gold/60 bg-gold/15 px-4 font-display text-sm tracking-wider-2 uppercase text-gold-bright hover:bg-gold/25 disabled:opacity-50 transition-colors"
            :disabled="processing"
            :aria-describedby="`${hintId} ${statusId}`"
            @click="fileInput?.click()"
          >{{ t('portrait.change') }}</button>
          <button
            type="button"
            class="min-h-11 border border-gold/30 px-4 font-display text-sm tracking-wider-2 uppercase text-parchment-dim hover:text-gold-bright disabled:opacity-50 transition-colors"
            :disabled="processing"
            @click="resetToDefault"
          >{{ t('portrait.reset') }}</button>
        </div>
      </div>
      <div class="grid gap-3">
        <p :id="hintId" class="text-sm text-parchment-mute italic">{{ t('portrait.hint') }}</p>
        <p :id="statusId" role="status" aria-live="polite" class="text-sm" :class="error ? 'text-ember-light' : 'text-parchment-dim'" data-portrait-status>
          {{ processing ? t('portrait.processing') : error ? t(error) : '' }}
        </p>
        <EditText v-model="character.portrait.alt" multiline :label="t('field.portraitAlt')" :hint="t('field.portraitAltHint')" />
      </div>
    </div>
  </EditSection>
</template>
