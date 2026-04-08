<script setup lang="ts">
import { characters } from '~/data/characters'

useSeoMeta({
  title: 'Donjon et Dragons — Codex des personnages',
  description: 'Bibliothèque de personnages D&D 5e en codex médiévaux.',
})
</script>

<template>
  <main id="contenu" class="font-body text-parchment min-h-screen px-4 py-10 sm:px-8 sm:py-16 lg:px-10 lg:py-20 relative z-10">
    <div class="max-w-5xl mx-auto">
      <header class="text-center mb-12 motion-safe:animate-rise">
        <p class="font-display text-xs tracking-wider-5 text-parchment-dim uppercase mb-3">Bibliothèque de codex</p>
        <h1 class="font-display uppercase tracking-wider-2 font-normal text-gold-bright text-[clamp(2rem,6vw,3.5rem)]">
          Donjon &amp; Dragons
        </h1>
        <p class="mt-4 text-parchment-dim italic">
          {{ characters.length }} personnage{{ characters.length > 1 ? 's' : '' }} consigné{{ characters.length > 1 ? 's' : '' }}
        </p>
      </header>

      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <li v-for="character in characters" :key="character.slug">
          <NuxtLink
            :to="`/personnages/${character.slug}`"
            class="block border border-gold/30 bg-charcoal/50 hover:bg-charcoal/70 hover:border-gold transition-colors p-5 group"
          >
            <figure class="aspect-[3/4] mb-4 border border-gold/40 overflow-hidden">
              <img
                :src="character.portrait.src"
                :alt="character.portrait.alt"
                class="w-full h-full object-cover saturate-90 group-hover:saturate-100 transition"
              >
            </figure>
            <p class="font-display text-xs tracking-wider-4 text-gold uppercase mb-1">
              {{ character.eyebrow }}
            </p>
            <h2 class="font-display text-2xl text-gold-bright uppercase tracking-wider-2 leading-tight">
              {{ character.firstName }} {{ character.lastName }}
            </h2>
            <p class="mt-2 text-sm text-parchment-dim italic">
              {{ character.race }} · {{ character.className }} niveau {{ character.level }}
            </p>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </main>
</template>
