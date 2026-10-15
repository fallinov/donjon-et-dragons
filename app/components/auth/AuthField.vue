<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  label: string
  type?: 'text' | 'password'
  autocomplete: string
  hint?: string
  invalid?: boolean
}>()
const model = defineModel<string>({ required: true })
const id = useId()
</script>

<template>
  <div class="mb-4">
    <label :for="id" class="block font-display text-sm tracking-wider-2 text-gold uppercase mb-1">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :autocomplete="autocomplete"
      autocapitalize="off"
      autocorrect="off"
      spellcheck="false"
      class="edit-input w-full min-h-11 px-3"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="hint ? `${id}-hint` : undefined"
    >
    <p v-if="hint" :id="`${id}-hint`" class="mt-1 text-sm text-parchment-dim">{{ hint }}</p>
  </div>
</template>
