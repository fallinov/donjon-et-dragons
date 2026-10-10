<script setup lang="ts">
defineProps<{ id: string, title: string, hint?: string }>()
</script>

<template>
  <section :aria-labelledby="id" class="border border-gold/25 bg-charcoal/30 p-4 sm:p-6">
    <h2 :id="id" class="font-display text-sm tracking-wider-3 text-gold-bright uppercase mb-1">{{ title }}</h2>
    <p v-if="hint" class="text-xs text-parchment-mute italic mb-4">{{ hint }}</p>
    <div :class="hint ? '' : 'mt-4'">
      <slot />
    </div>
  </section>
</template>
