<script setup lang="ts">
defineProps<{ id: string, title: string }>()
</script>

<template>
  <section :aria-labelledby="id">
    <h2
      :id="id"
      class="section-title font-display text-sm tracking-wider-3 text-gold uppercase mb-4 pb-2 border-b border-gold/25"
    >
      {{ title }}
    </h2>
    <slot />
  </section>
</template>
