<script setup lang="ts">
import type { Character } from '~~/shared/types/character'

defineProps<{ languages: Character['languages'] }>()
</script>

<template>
  <ul class="flex flex-wrap gap-2">
    <li
      v-for="lang in languages"
      :key="lang.name"
      class="px-3 py-1 text-xs font-display tracking-wider-3 uppercase border"
      :class="lang.rare
        ? 'border-ember bg-blood/40 text-ember-bright'
        : 'border-gold/40 bg-charcoal/50 text-parchment'"
    >
      {{ lang.name }}
    </li>
  </ul>
</template>
