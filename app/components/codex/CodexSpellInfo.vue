<script setup lang="ts">
import { computed } from 'vue'
import type { Spell } from '~~/shared/types/character'

const props = defineProps<{ spell: Spell }>()

/** Temps d'incantation, portée et durée, dans cet ordre, sans les champs absents. */
const meta = computed(() =>
  [props.spell.castingTime, props.spell.range, props.spell.duration].filter((v): v is string => Boolean(v)),
)
</script>

<template>
  <div class="flex-1 min-w-0">
    <strong class="block font-display text-xs tracking-wider-3 text-gold-bright uppercase">{{ spell.title }}</strong>
    <p
      v-if="meta.length || spell.concentration"
      class="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-parchment-mute"
      data-spell-meta
    >
      <template v-for="(item, i) in meta" :key="item">
        <span v-if="i > 0" aria-hidden="true">·</span>
        <span>{{ item }}</span>
      </template>
      <span
        v-if="spell.concentration"
        class="ml-0.5 border border-ember/60 text-ember-bright px-1.5 py-px font-display tracking-wider-2 uppercase text-[10px]"
        data-spell-concentration
      >Concentration</span>
    </p>
    <p class="mt-1 text-parchment-dim text-sm leading-snug">
      {{ spell.description }}<slot name="suffix" />
    </p>
    <p v-if="spell.check || spell.effect" class="mt-1 flex flex-wrap gap-1.5 text-xs">
      <span v-if="spell.check" class="bg-charcoal/60 border-l border-gold px-2 py-0.5 text-bone" data-spell-check>{{ spell.check }}</span>
      <span v-if="spell.effect" class="bg-charcoal/60 border-l border-ember px-2 py-0.5 text-gold-bright font-display" data-spell-effect>{{ spell.effect }}</span>
    </p>
  </div>
</template>
