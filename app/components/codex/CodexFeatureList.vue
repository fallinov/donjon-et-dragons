<script setup lang="ts">
import type { Trait } from '~~/shared/types/character'

defineProps<{ features: Trait[] }>()
</script>

<template>
  <ul class="space-y-4">
    <li v-for="feature in features" :key="feature.title">
      <strong class="block font-display text-xs tracking-wider-3 text-gold-bright uppercase mb-1">
        — {{ feature.title }}
      </strong>
      <span class="text-parchment-dim">{{ feature.description }}</span>
    </li>
  </ul>
</template>
