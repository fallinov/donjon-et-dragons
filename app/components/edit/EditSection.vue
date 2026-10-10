<script setup lang="ts">
defineProps<{ id: string, title: string, hint?: string }>()
</script>

<template>
  <section :aria-labelledby="id" class="border-t border-gold/30 pt-5 sm:border sm:border-gold/25 sm:bg-charcoal/30 sm:p-6">
    <h2 :id="id" class="font-display text-base tracking-wider-3 text-gold-bright uppercase mb-1">{{ title }}</h2>
    <p v-if="hint" class="text-sm text-parchment-mute italic mb-4">{{ hint }}</p>
    <div :class="hint ? '' : 'mt-4'">
      <slot />
    </div>
  </section>
</template>
