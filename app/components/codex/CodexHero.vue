<script setup lang="ts">
import type { Character } from '~~/shared/types/character'

defineProps<{ character: Character }>()
</script>

<template>
  <header class="print-hero relative pb-10 mb-10 border-b border-gold/35 divider-fleuron motion-safe:animate-rise grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-center gap-8 lg:gap-12 text-center lg:text-left">
    <figure class="justify-self-center lg:justify-self-end relative w-44 h-60 sm:w-48 sm:h-64 rounded border border-gold/80 overflow-hidden shadow-[0_0_30px_rgba(201,162,74,0.25),inset_0_0_40px_rgba(0,0,0,0.5)]">
      <img
        :src="character.portrait.src"
        :alt="character.portrait.alt"
        class="block w-full h-full object-cover saturate-90 contrast-105"
      >
    </figure>

    <div class="min-w-0">
      <p class="font-display text-xs sm:text-xs tracking-wider-5 text-parchment-dim uppercase mb-3">
        {{ character.eyebrow }}
      </p>
      <h1 class="font-display uppercase tracking-wider-2 font-normal leading-[0.95] text-gold-bright text-[clamp(2rem,8vw,4.25rem)]">
        <span class="block sm:inline">{{ character.firstName }}</span>
        <span class="block sm:inline sm:ml-3">{{ character.lastName }}</span>
      </h1>
      <p class="mt-4 text-parchment-dim italic text-sm sm:text-base flex flex-wrap gap-x-3 gap-y-1 justify-center lg:justify-start">
        <span>{{ character.race }}</span><span aria-hidden="true">·</span>
        <span>{{ character.className }} niveau {{ character.level }}</span><span aria-hidden="true">·</span>
        <span>{{ character.background }}</span><span aria-hidden="true">·</span>
        <span>{{ character.alignment }}</span>
      </p>
    </div>

    <dl class="justify-self-center lg:justify-self-end grid grid-cols-2 gap-3 sm:gap-4 text-left">
      <div
        v-for="vital in character.vitals"
        :key="vital.label"
        class="border border-gold/40 bg-charcoal/60 px-3 py-2 min-w-[88px]"
      >
        <dt class="font-display text-xs tracking-wider-4 text-gold uppercase">{{ vital.label }}</dt>
        <dd class="font-display text-2xl text-parchment mt-1">
          {{ vital.value }}<span v-if="vital.unit" class="text-xs tracking-wider-3 text-parchment-mute ml-1">{{ vital.unit }}</span>
        </dd>
      </div>
    </dl>
  </header>
</template>
