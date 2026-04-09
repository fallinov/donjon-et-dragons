<script setup lang="ts">
import type { Character } from '~~/shared/types/character'

defineProps<{ character: Character }>()
</script>

<template>
  <NuxtLink
    :to="`/personnages/${character.slug}`"
    class="block border border-gold/30 bg-charcoal/50 hover:bg-charcoal/70 hover:border-gold transition-colors group overflow-hidden"
  >
    <figure class="relative aspect-[3/4] overflow-hidden">
      <NuxtImg
        :src="character.portrait.src"
        :alt="character.portrait.alt"
        loading="lazy"
        sizes="320px sm:280px lg:300px"
        class="w-full h-full object-cover saturate-90 group-hover:saturate-100 transition"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 via-30% to-transparent to-60%" />
      <div class="absolute bottom-0 left-0 right-0 p-4">
        <p class="font-display text-xs tracking-wider-4 text-gold/80 uppercase mb-1">
          {{ character.eyebrow }}
        </p>
        <h2 class="font-display text-2xl text-gold-bright uppercase tracking-wider-2 leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          {{ character.firstName }}{{ character.lastName ? ` ${character.lastName}` : '' }}
        </h2>
        <p class="mt-1 text-sm text-parchment-dim">
          {{ character.race }} · {{ character.className }} niv. {{ character.level }}
        </p>
      </div>
    </figure>
  </NuxtLink>
</template>
