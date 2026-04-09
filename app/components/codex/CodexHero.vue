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

          <!-- Vitals : 3 cases glassmorphism -->
          <dl class="mt-3 grid grid-cols-3 gap-2">
            <div class="backdrop-blur-md border border-gold/40 rounded px-2 py-2 text-center">
              <dd class="font-display text-xl text-parchment tabular-nums leading-none">{{ character.vitals.find(v => v.label === "Classe d'armure")?.value }}</dd>
              <dt class="font-display text-[10px] tracking-wider-3 text-gold/70 uppercase mt-1">Armure</dt>
            </div>
            <div class="backdrop-blur-md border border-gold/40 rounded px-2 py-2 text-center">
              <dd class="font-display text-xl text-parchment tabular-nums leading-none">{{ character.vitals.find(v => v.label === 'Initiative')?.value }}</dd>
              <dt class="font-display text-[10px] tracking-wider-3 text-gold/70 uppercase mt-1">Initiative</dt>
            </div>
            <div class="backdrop-blur-md border border-gold/40 rounded px-2 py-2 text-center">
              <dd class="font-display text-xl text-parchment tabular-nums leading-none">{{ character.vitals.find(v => v.label === 'Vitesse')?.value }}<span class="text-xs text-parchment-mute">{{ character.vitals.find(v => v.label === 'Vitesse')?.unit }}</span></dd>
              <dt class="font-display text-[10px] tracking-wider-3 text-gold/70 uppercase mt-1">Vitesse</dt>
            </div>
          </dl>
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
