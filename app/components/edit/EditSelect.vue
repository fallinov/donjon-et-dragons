<script setup lang="ts" generic="T extends string | number">
import { useId } from 'vue'
import { t, type MessageKey } from '~/composables/useT'

defineProps<{
  label: string
  /** Libellé visible court (colonnes étroites) ; `label` reste le nom lu par les lecteurs d'écran. */
  short?: string
  options: { value: T, label: string }[]
  error?: MessageKey
}>()

const model = defineModel<T>({ required: true })
const id = useId()
</script>

<template>
  <div class="edit-field">
    <label :for="id" class="block font-display text-sm tracking-wider-2 text-gold uppercase mb-1">
      <template v-if="short"><span aria-hidden="true">{{ short }}</span><span class="sr-only">{{ label }}</span></template>
      <template v-else>{{ label }}</template>
    </label>
    <select
      :id="id"
      v-model="model"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="edit-input w-full min-h-11 px-3"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
    <p v-if="error" :id="`${id}-error`" class="mt-1 text-sm text-ember-light" data-field-error>{{ t(error) }}</p>
  </div>
</template>
