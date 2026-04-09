<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Character } from '~~/shared/types/character'

defineProps<{ character: Character }>()

const fogRevealed = ref(false)

onMounted(() => {
  // Petit délai pour que le brouillard soit visible avant la dissipation
  setTimeout(() => { fogRevealed.value = true }, 300)
})
</script>

<template>
  <header class="print-hero relative mb-10 motion-safe:animate-rise">

    <!-- ═══ MOBILE : carte de jeu pleine largeur ═══ -->
    <div class="lg:hidden" ref="mobileCard">
      <!-- Lien retour au-dessus de la carte -->
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-1 text-sm font-display tracking-wider-3 text-parchment-dim hover:text-gold-bright uppercase mb-2"
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
        Retour aux codex
      </NuxtLink>
      <!-- Photo arrière-plan avec gradient -->
      <div class="relative aspect-[3/4] sm:aspect-[16/9] overflow-hidden w-screen -ml-4 sm:-ml-8 lg:-ml-10">
        <NuxtImg
          :src="character.portrait.src"
          :alt="character.portrait.alt"
          loading="eager"
          class="absolute inset-0 w-full h-full object-cover object-top"
        />
        <!-- Gradient bas : noir vers transparent -->
        <div class="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/50 via-40% to-transparent to-75%" />

        <!-- Brouillard multi-couches qui se dissipe -->
        <div
          class="absolute -inset-px pointer-events-none z-10 overflow-hidden"
          :style="{ opacity: fogRevealed ? 0 : 1, filter: fogRevealed ? 'blur(6px)' : 'blur(1px) sepia(0.3)', transition: 'opacity 4s ease-in-out, filter 4s ease-in-out' }"
          aria-hidden="true"
        >
          <!-- Fond opaque pour rendre les PNG fog visibles -->
          <div class="absolute inset-0 bg-obsidian" />
          <div class="fog-layer fog-layer-1" />
          <div class="fog-layer fog-layer-1b" />
          <div class="fog-layer fog-layer-2" />
          <div class="fog-layer fog-layer-2b" />
          <div class="fog-layer fog-layer-3" />
          <div class="fog-layer fog-layer-3b" />
        </div>

        <!-- Texte superposé en bas de la carte (au-dessus du brouillard) -->
        <div class="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3 pt-4 sm:px-5 sm:pb-5 sm:pt-6">
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

          <!-- Vitals : 4 cases glassmorphism -->
          <dl class="mt-3 grid grid-cols-4 gap-1.5">
            <div class="backdrop-blur-md border border-gold/40 px-1.5 py-2 text-center">
              <dd class="font-display text-lg text-parchment tabular-nums leading-none">{{ character.vitals.find(v => v.label === "Classe d'armure")?.value }}</dd>
              <dt class="font-display text-[9px] tracking-wider-3 text-gold/70 uppercase mt-1">Armure</dt>
            </div>
            <div class="backdrop-blur-md border border-gold/40 px-1.5 py-2 text-center">
              <dd class="font-display text-lg text-parchment tabular-nums leading-none">{{ character.vitals.find(v => v.label === 'Initiative')?.value }}</dd>
              <dt class="font-display text-[9px] tracking-wider-3 text-gold/70 uppercase mt-1">Init.</dt>
            </div>
            <div class="backdrop-blur-md border border-gold/40 px-1.5 py-2 text-center">
              <dd class="font-display text-lg text-gold-bright tabular-nums leading-none">+{{ character.proficiencyBonus }}</dd>
              <dt class="font-display text-[9px] tracking-wider-3 text-gold/70 uppercase mt-1">Maîtr.</dt>
            </div>
            <div class="backdrop-blur-md border border-gold/40 px-1.5 py-2 text-center">
              <dd class="font-display text-lg text-parchment tabular-nums leading-none">{{ character.vitals.find(v => v.label === 'Vitesse')?.value }}<span class="text-[9px] text-parchment-mute">{{ character.vitals.find(v => v.label === 'Vitesse')?.unit }}</span></dd>
              <dt class="font-display text-[9px] tracking-wider-3 text-gold/70 uppercase mt-1">Vitesse</dt>
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

<style scoped>
/* ── Brouillard dense multi-couches (PNG avec canal alpha) ── */
.fog-layer {
  position: absolute;
  top: 0;
  height: 100%;
  width: 200%;
  transform-origin: center;
  scale: 1.2;
}

/* Couche 1 — rapide, opacité basse */
.fog-layer-1 {
  background: url('/img/fog1.png') repeat-x center / cover;
  left: 0;
  animation: fog-drift 15s linear infinite, fog-opacity-1 10s ease-in-out infinite;
}
.fog-layer-1b {
  background: url('/img/fog1.png') repeat-x center / cover;
  left: -100%;
  animation: fog-drift 15s linear infinite, fog-opacity-1 10s ease-in-out infinite;
}

/* Couche 2 — moyenne, direction opposée */
.fog-layer-2 {
  background: url('/img/fog2.png') repeat-x center / cover;
  left: 0;
  animation: fog-drift-reverse 13s linear infinite, fog-opacity-2 21s ease-in-out infinite;
}
.fog-layer-2b {
  background: url('/img/fog2.png') repeat-x center / cover;
  left: -100%;
  animation: fog-drift-reverse 13s linear infinite, fog-opacity-2 21s ease-in-out infinite;
}

/* Couche 3 — lente, plus épaisse */
.fog-layer-3 {
  background: url('/img/fog2.png') repeat-x center / cover;
  left: 0;
  scale: 1.2 1.5;
  animation: fog-drift 25s linear infinite, fog-opacity-3 17s ease-in-out infinite;
}
.fog-layer-3b {
  background: url('/img/fog2.png') repeat-x center / cover;
  left: -100%;
  scale: 1.2 1.5;
  animation: fog-drift 25s linear infinite, fog-opacity-3 17s ease-in-out infinite;
}

@keyframes fog-drift {
  0% { transform: translateX(0); }
  100% { transform: translateX(50%); }
}
@keyframes fog-drift-reverse {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
/* Opacités basses + durées non-multiples → pas de pattern répétitif */
@keyframes fog-opacity-1 {
  0% { opacity: 0.1; }
  25% { opacity: 0.4; }
  50% { opacity: 0.15; }
  75% { opacity: 0.45; }
  100% { opacity: 0.1; }
}
@keyframes fog-opacity-2 {
  0% { opacity: 0.5; }
  25% { opacity: 0.2; }
  50% { opacity: 0.1; }
  75% { opacity: 0.4; }
  100% { opacity: 0.5; }
}
@keyframes fog-opacity-3 {
  0% { opacity: 0.3; }
  25% { opacity: 0.5; }
  50% { opacity: 0.2; }
  75% { opacity: 0.45; }
  100% { opacity: 0.3; }
}

@media (prefers-reduced-motion: reduce) {
  .fog-layer { animation: none !important; }
}
</style>

