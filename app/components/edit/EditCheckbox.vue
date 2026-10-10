<script setup lang="ts">
defineProps<{ label: string }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-parchment-dim">
    <input v-model="model" type="checkbox" class="h-5 w-5 shrink-0 accent-[var(--color-gold-bright)]">
    <span>{{ label }}</span>
  </label>
</template>
