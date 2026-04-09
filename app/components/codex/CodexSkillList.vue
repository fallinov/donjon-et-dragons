<script setup lang="ts">
import type { Skill } from '~~/shared/types/character'

defineProps<{ skills: Skill[] }>()

function fmt(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}
</script>

<template>
  <ul class="grid grid-cols-2 gap-x-6 gap-y-2">
    <li
      v-for="skill in skills"
      :key="skill.name"
      class="flex justify-between"
      :class="skill.proficient ? 'text-gold-bright' : 'text-parchment-dim'"
    >
      <span :class="skill.proficient ? 'font-semibold' : ''">
        <span v-if="skill.proficient" class="text-ember-bright mr-1" aria-hidden="true">●</span>{{ skill.name }}
        <span class="text-parchment-mute text-xs">({{ skill.ability }})</span>
      </span>
      <span class="font-display">{{ fmt(skill.modifier) }}</span>
    </li>
  </ul>
</template>
