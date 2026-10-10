<script setup lang="ts" generic="T extends string | number">
import { useId } from 'vue'
import { t, type MessageKey } from '~/composables/useT'

defineProps<{
  label: string
  options: { value: T, label: string }[]
  error?: MessageKey
}>()

const model = defineModel<T>({ required: true })
const id = useId()
</script>

<template>
  <div class="edit-field">
    <label :for="id" class="block font-display text-xs tracking-wider-3 text-gold uppercase mb-1">{{ label }}</label>
    <select
      :id="id"
      v-model="model"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="edit-input w-full min-h-11 px-3"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
    <p v-if="error" :id="`${id}-error`" class="mt-1 text-sm text-ember-bright" data-field-error>{{ t(error) }}</p>
  </div>
</template>
