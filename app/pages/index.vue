<script setup lang="ts">
import { useCharacterList } from '~/composables/useCharacters'
import { t, tCount } from '~/composables/useT'

const { characters, status } = useCharacterList()

useSeoMeta({
  title: t('home.seo.title'),
  description: t('home.seo.description'),
})
</script>

<template>
  <main id="contenu" class="font-body text-parchment min-h-screen px-4 py-10 sm:px-8 sm:py-16 lg:px-10 lg:py-20 relative z-10">
    <div class="max-w-5xl mx-auto">
      <header class="text-center mb-12 motion-safe:animate-rise">
        <p class="font-display text-xs tracking-wider-5 text-parchment-dim uppercase mb-3">{{ t('home.eyebrow') }}</p>
        <h1 class="font-display uppercase tracking-wider-2 font-normal text-gold-bright text-[clamp(2rem,6vw,3.5rem)]">
          {{ t('home.title') }}
        </h1>
        <p v-if="status === 'ready'" class="mt-4 text-parchment-dim italic">
          {{ tCount('home.count', characters.length) }}
        </p>
        <p v-else-if="status === 'error'" class="mt-4 text-ember-bright italic" role="alert">
          {{ t('home.loadError') }}
        </p>
      </header>

      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <li v-for="character in characters" :key="character.id">
          <CodexCharacterCard :character="character" />
        </li>
      </ul>
    </div>
  </main>
</template>
