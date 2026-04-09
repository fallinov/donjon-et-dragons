<script setup lang="ts">
import type { Character } from '~~/shared/types/character'

defineProps<{ character: Character }>()
</script>

<template>
  <header class="print-hero relative mb-10 motion-safe:animate-rise">

    <!-- ═══ MOBILE : carte de jeu pleine largeur ═══ -->
    <div class="xl:hidden">
      <!-- Photo arrière-plan avec gradient -->
      <div class="relative w-full aspect-[3/4] sm:aspect-[16/9] overflow-hidden -mx-4 sm:-mx-8 lg:-mx-10 w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] lg:w-[calc(100%+5rem)]">
        <NuxtImg
          :src="character.portrait.src"
          :alt="character.portrait.alt"
          loading="eager"
          class="absolute inset-0 w-full h-full object-cover object-top"
        />
        <!-- Gradient bas : noir vers transparent -->
        <div class="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent" />

        <!-- Vitals badges (coin haut-droit, sur la carte) -->
        <dl class="absolute top-3 right-3 flex flex-col gap-1.5">
          <div class="flex items-center gap-1.5 bg-obsidian/70 backdrop-blur-sm border border-gold/40 rounded px-2 py-1">
            <svg class="w-4 h-4 text-gold shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/></svg>
            <dt class="sr-only">Classe d'armure</dt>
            <dd class="font-display text-sm text-parchment tabular-nums">{{ character.vitals.find(v => v.label === "Classe d'armure")?.value }}</dd>
          </div>
          <div class="flex items-center gap-1.5 bg-obsidian/70 backdrop-blur-sm border border-gold/40 rounded px-2 py-1">
            <svg class="w-4 h-4 text-gold shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
            <dt class="sr-only">Initiative</dt>
            <dd class="font-display text-sm text-parchment tabular-nums">{{ character.vitals.find(v => v.label === 'Initiative')?.value }}</dd>
          </div>
          <div class="flex items-center gap-1.5 bg-obsidian/70 backdrop-blur-sm border border-gold/40 rounded px-2 py-1">
            <svg class="w-4 h-4 text-gold shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6.99 8.48v5h2v-3.5l1.8-.7-1.6 8.1-4.7-1-.4 2 6.3 1z"/></svg>
            <dt class="sr-only">Vitesse</dt>
            <dd class="font-display text-sm text-parchment tabular-nums">{{ character.vitals.find(v => v.label === 'Vitesse')?.value }}{{ character.vitals.find(v => v.label === 'Vitesse')?.unit ? ` ${character.vitals.find(v => v.label === 'Vitesse')?.unit}` : '' }}</dd>
          </div>
        </dl>

        <!-- Texte superposé en bas de la carte -->
        <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <p class="font-display text-xs tracking-wider-5 text-parchment-dim/80 uppercase mb-1">
            {{ character.eyebrow }}
          </p>
          <h1 class="font-display uppercase tracking-wider-2 font-normal leading-[0.95] text-gold-bright text-[clamp(2rem,10vw,3.5rem)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {{ character.firstName }}{{ character.lastName ? ` ${character.lastName}` : '' }}
          </h1>
          <p class="mt-2 text-parchment-dim text-sm flex flex-wrap gap-x-2 gap-y-1">
            <span>{{ character.race }}</span><span class="text-gold/60">·</span>
            <span>{{ character.className }} niv. {{ character.level }}</span><span class="text-gold/60">·</span>
            <span>{{ character.background }}</span><span class="text-gold/60">·</span>
            <span>{{ character.alignment }}</span>
          </p>
        </div>
      </div>

    </div>

    <!-- ═══ DESKTOP : layout 3 colonnes classique ═══ -->
    <div class="hidden xl:grid xl:grid-cols-[auto_1fr_auto] items-center gap-10 pb-10 border-b border-gold/35 divider-fleuron">
      <figure class="justify-self-end relative w-48 h-64 rounded border border-gold/80 overflow-hidden shadow-[0_0_30px_rgba(201,162,74,0.25),inset_0_0_40px_rgba(0,0,0,0.5)]">
        <NuxtImg
          :src="character.portrait.src"
          :alt="character.portrait.alt"
          loading="lazy"
          sizes="192px"
          class="block w-full h-full object-cover saturate-90 contrast-105"
        />
      </figure>

      <div class="min-w-0">
        <p class="font-display text-xs tracking-wider-5 text-parchment-dim uppercase mb-3">
          {{ character.eyebrow }}
        </p>
        <h1 class="font-display uppercase tracking-wider-2 font-normal leading-[0.95] text-gold-bright text-[clamp(2rem,5vw,3.5rem)]">
          <span class="block">{{ character.firstName }}</span>
          <span v-if="character.lastName" class="block">{{ character.lastName }}</span>
        </h1>
        <p class="mt-4 text-parchment-dim italic text-base flex flex-wrap gap-x-3 gap-y-1">
          <span>{{ character.race }}</span><span aria-hidden="true">·</span>
          <span>{{ character.className }} niveau {{ character.level }}</span><span aria-hidden="true">·</span>
          <span>{{ character.background }}</span><span aria-hidden="true">·</span>
          <span>{{ character.alignment }}</span>
        </p>
      </div>

      <dl class="justify-self-end grid grid-cols-2 gap-4 text-left">
        <div
          v-for="vital in character.vitals.filter(v => v.label !== 'Points de vie')"
          :key="vital.label"
          class="border border-gold/40 bg-charcoal/60 px-3 py-2 min-w-[80px]"
        >
          <dt class="font-display text-xs tracking-wider-4 text-gold uppercase">{{ vital.label }}</dt>
          <dd class="font-display text-2xl text-parchment mt-1">
            {{ vital.value }}<span v-if="vital.unit" class="text-xs tracking-wider-3 text-parchment-mute ml-1">{{ vital.unit }}</span>
          </dd>
        </div>
      </dl>
    </div>

  </header>
</template>
