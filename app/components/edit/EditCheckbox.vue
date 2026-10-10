<script setup lang="ts">
defineProps<{ label: string }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="flex min-h-11 min-w-0 cursor-pointer items-center gap-3 py-1 text-base text-parchment-dim">
    <input v-model="model" type="checkbox" class="h-6 w-6 shrink-0 accent-[var(--color-gold-bright)]">
    <span class="min-w-0">{{ label }}</span>
  </label>
</template>
