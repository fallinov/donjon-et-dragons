<script setup lang="ts">
import { useId } from 'vue'
import { t, type MessageKey } from '~/composables/useT'

withDefaults(defineProps<{
  label: string
  hint?: string
  error?: MessageKey
  multiline?: boolean
  rows?: number
  required?: boolean
  autocomplete?: string
}>(), { rows: 3, autocomplete: 'off' })

const model = defineModel<string>({ required: true })
const id = useId()
</script>

<template>
  <div class="edit-field">
    <label :for="id" class="block font-display text-sm tracking-wider-2 text-gold uppercase mb-1">
      {{ label }}<span v-if="required" class="text-ember-light" aria-hidden="true"> *</span>
    </label>
    <textarea
      v-if="multiline"
      :id="id"
      v-model="model"
      :rows="rows"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="[hint ? `${id}-hint` : '', error ? `${id}-error` : ''].join(' ').trim() || undefined"
      class="edit-input w-full p-3 leading-snug"
    />
    <input
      v-else
      :id="id"
      v-model="model"
      type="text"
      :required="required"
      :autocomplete="autocomplete"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="[hint ? `${id}-hint` : '', error ? `${id}-error` : ''].join(' ').trim() || undefined"
      class="edit-input w-full min-h-11 px-3"
    >
    <p v-if="hint" :id="`${id}-hint`" class="mt-1 text-sm text-parchment-mute italic">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="mt-1 text-sm text-ember-light" data-field-error>{{ t(error) }}</p>
  </div>
</template>
