<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Character } from '~~/shared/types/character'

defineProps<{ character: Character }>()

const cardRef = ref<HTMLElement>()
const fogAnimating = ref(false)
const fogRevealed = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  const el = cardRef.value?.$el as HTMLElement | undefined
  if (!el) return
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        fogAnimating.value = true
        setTimeout(() => { fogRevealed.value = true }, 300)
        observer?.disconnect()
      }
    },
    { threshold: 0.3 },
  )
  observer.observe(el)
})

onBeforeUnmount(() => { observer?.disconnect() })
</script>

<template>
  <NuxtLink
    ref="cardRef"
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

      <!-- Brouillard multi-couches → dissipation au scroll -->
      <div
        class="absolute -inset-px pointer-events-none z-10 overflow-hidden"
        :style="{ opacity: fogRevealed ? 0 : 1, filter: fogRevealed ? 'blur(6px)' : 'blur(1px) sepia(0.3)', transition: 'opacity 4s ease-in-out, filter 4s ease-in-out' }"
        aria-hidden="true"
      >
        <div class="absolute inset-0 bg-obsidian" />
        <div class="fog-layer" :class="fogAnimating ? 'fog-layer-1' : 'fog-static-1'" />
        <div class="fog-layer" :class="fogAnimating ? 'fog-layer-1b' : 'fog-static-1b'" />
        <div class="fog-layer" :class="fogAnimating ? 'fog-layer-2' : 'fog-static-2'" />
        <div class="fog-layer" :class="fogAnimating ? 'fog-layer-2b' : 'fog-static-2b'" />
        <div class="fog-layer" :class="fogAnimating ? 'fog-layer-3' : 'fog-static-3'" />
        <div class="fog-layer" :class="fogAnimating ? 'fog-layer-3b' : 'fog-static-3b'" />
      </div>

      <div class="absolute bottom-0 left-0 right-0 z-20 p-4">
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

<style scoped>
.fog-layer {
  position: absolute;
  top: 0;
  height: 100%;
  width: 200%;
  transform-origin: center;
  scale: 1.2;
}
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
@keyframes fog-opacity-1 {
  0% { opacity: 0.1; } 25% { opacity: 0.4; }
  50% { opacity: 0.15; } 75% { opacity: 0.45; }
  100% { opacity: 0.1; }
}
@keyframes fog-opacity-2 {
  0% { opacity: 0.5; } 25% { opacity: 0.2; }
  50% { opacity: 0.1; } 75% { opacity: 0.4; }
  100% { opacity: 0.5; }
}
@keyframes fog-opacity-3 {
  0% { opacity: 0.3; } 25% { opacity: 0.5; }
  50% { opacity: 0.2; } 75% { opacity: 0.45; }
  100% { opacity: 0.3; }
}

/* État statique : même fond, aucune animation */
.fog-static-1, .fog-static-1b { background: url('/img/fog1.png') repeat-x center / cover; opacity: 0.3; }
.fog-static-1b { left: -100%; }
.fog-static-2, .fog-static-2b { background: url('/img/fog2.png') repeat-x center / cover; opacity: 0.3; }
.fog-static-2b { left: -100%; }
.fog-static-3, .fog-static-3b { background: url('/img/fog2.png') repeat-x center / cover; opacity: 0.3; scale: 1.2 1.5; }
.fog-static-3b { left: -100%; }

@media (prefers-reduced-motion: reduce) {
  .fog-layer { animation: none !important; }
}
</style>
