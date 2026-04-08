<script setup lang="ts">
import { computed } from 'vue'
import type { Ability, AbilityKey } from '~~/shared/types/character'

const props = defineProps<{ abilities: Record<AbilityKey, Ability> }>()

const order: AbilityKey[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

function fmt(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

const items = computed(() => order.map(key => ({ key, ability: props.abilities[key] })))
</script>

<template>
  <section aria-labelledby="caracs-title" class="space-y-3">
    <h2 id="caracs-title" class="sr-only">Caractéristiques</h2>

    <div
      v-for="item in items"
      :key="item.key"
      class="p-4 flex items-center justify-between"
      :class="item.ability.proficient
        ? 'border border-gold bg-gradient-to-br from-charcoal to-ash shadow-[inset_0_0_20px_rgba(201,162,74,0.15)]'
        : 'border border-gold/30 bg-charcoal/50'"
    >
      <div>
        <p
          class="font-display text-xs tracking-wider-4 uppercase"
          :class="item.ability.proficient ? 'text-gold-bright' : 'text-gold'"
        >
          {{ item.ability.label }}
        </p>
        <p class="font-display text-3xl text-parchment mt-1">{{ item.ability.score }}</p>
        <p
          class="text-xs mt-1"
          :class="item.ability.proficient ? 'text-gold' : 'text-parchment-mute'"
        >
          sauv · {{ fmt(item.ability.saveModifier) }}
          <abbr
            v-if="item.ability.proficient"
            title="Maîtrise"
            class="ml-1 inline-block border border-gold-bright text-gold-bright text-[10px] font-display tracking-wider-2 px-1.5 leading-none py-0.5 no-underline"
          >M</abbr>
        </p>
      </div>
      <p class="font-display text-3xl text-gold-bright">{{ fmt(item.ability.modifier) }}</p>
    </div>
  </section>
</template>
