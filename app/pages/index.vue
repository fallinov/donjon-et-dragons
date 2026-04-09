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
          <CodexCharacterCard :character="character" />
        </li>
      </ul>
    </div>
  </main>
</template>
