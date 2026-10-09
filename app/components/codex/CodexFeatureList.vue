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
      <ul v-if="feature.benefits?.length" class="mt-2 space-y-1" data-feature-benefits>
        <li
          v-for="benefit in feature.benefits"
          :key="benefit"
          class="flex gap-2 text-sm text-parchment-dim leading-snug"
        >
          <span class="text-ember shrink-0" aria-hidden="true">◆</span>
          <span>{{ benefit }}</span>
        </li>
      </ul>
    </li>
  </ul>
</template>
