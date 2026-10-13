<script setup lang="ts">
import { computed, ref } from 'vue'
import { importCharacter, useImportConflict } from '~/composables/useCharacterImport'
import { useCharacterList } from '~/composables/useCharacters'
import { t, tCount, type MessageKey } from '~/composables/useT'
import { seeds } from '~/data/characters'
import { fetchPortrait, restoreBuiltin } from '~/db/seed'
import { readCharacterFile } from '~/utils/characterFile'

const { characters, status, refresh } = useCharacterList()

useSeoMeta({
  title: t('home.seo.title'),
  description: t('home.seo.description'),
})

// Import d'une fiche (fichier .codex.json reçu par email, message, Fichiers…)
const importInput = ref<HTMLInputElement>()
const importError = ref<MessageKey>()
const importing = ref(false)
const resolveConflict = useImportConflict()

async function onImport(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  importing.value = true
  importError.value = undefined
  try {
    const result = await readCharacterFile(file)
    if (!result.ok) {
      importError.value = result.error
      return
    }
    const id = await importCharacter(result.value, resolveConflict)
    if (id) await navigateTo(`/personnages/${id}`)
  }
  catch (error) {
    console.error(error)
    importError.value = 'import.error.failed'
  }
  finally {
    importing.value = false
  }
}

// Fiches de départ supprimées par le joueur, restaurables
const deletedSeeds = computed(() => status.value === 'ready'
  ? seeds.filter(seed => !characters.value.some(c => c.id === seed.slug))
  : [])

async function restore(slug: string): Promise<void> {
  const seed = seeds.find(s => s.slug === slug)
  if (!seed) return
  await restoreBuiltin(seed, fetchPortrait)
  await refresh()
}
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
        <NuxtLink
          v-if="status === 'ready'"
          to="/personnages/nouveau"
          class="mt-6 inline-flex min-h-11 items-center gap-2 border border-gold/50 bg-gold/10 px-5 font-display text-sm tracking-wider-2 uppercase text-gold-bright hover:bg-gold/20 transition-colors"
        >
          <span aria-hidden="true">+</span> {{ t('actions.newCharacter') }}
        </NuxtLink>
        <button
          v-if="status === 'ready'"
          type="button"
          class="mt-3 ml-0 inline-flex min-h-11 items-center gap-2 border border-gold/30 px-5 font-display text-sm tracking-wider-2 uppercase text-parchment-dim hover:text-gold-bright hover:border-gold/60 transition-colors disabled:opacity-50 sm:mt-6 sm:ml-3"
          :disabled="importing"
          data-import-button
          @click="importInput?.click()"
        >{{ t('import.button') }}</button>
        <input
          ref="importInput"
          type="file"
          accept=".json,application/json"
          class="sr-only"
          tabindex="-1"
          aria-hidden="true"
          data-import-input
          @change="onImport"
        >
        <p v-if="importError" role="alert" class="mx-auto mt-4 max-w-md text-ember-light" data-import-error>{{ t(importError) }}</p>
        <p v-else-if="status === 'error'" class="mt-4 text-ember-light italic" role="alert">
          {{ t('home.loadError') }}
        </p>
      </header>

      <PwaInstallHint />

      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <li v-for="character in characters" :key="character.id">
          <CodexCharacterCard :character="character" />
        </li>
        <li v-if="status === 'ready'" class="hidden sm:block" aria-hidden="true">
          <NuxtLink
            tabindex="-1"
            to="/personnages/nouveau"
            class="flex aspect-[3/4] flex-col items-center justify-center gap-3 border border-dashed border-gold/50 bg-charcoal/30 text-gold hover:border-gold hover:bg-charcoal/60 hover:text-gold-bright transition-colors"
          >
            <span class="font-display text-5xl leading-none" aria-hidden="true">+</span>
            <span class="font-display text-lg tracking-wider-3 uppercase">{{ t('actions.newCharacter') }}</span>
            <span class="text-sm italic text-parchment-dim">{{ t('actions.newCharacterHint') }}</span>
          </NuxtLink>
        </li>
      </ul>

      <section v-if="deletedSeeds.length" aria-labelledby="deleted-seeds" class="mt-12 border-t border-gold/30 pt-6">
        <h2 id="deleted-seeds" class="font-display text-sm tracking-wider-3 text-gold uppercase mb-3">{{ t('home.deletedSeeds') }}</h2>
        <ul class="flex flex-wrap gap-3">
          <li v-for="seed in deletedSeeds" :key="seed.slug">
            <button
              type="button"
              class="min-h-11 border border-gold/40 px-4 font-display text-sm tracking-wider-2 uppercase text-gold hover:text-gold-bright hover:border-gold transition-colors"
              @click="restore(seed.slug)"
            >{{ t('home.restoreSeed', { name: `${seed.firstName}${seed.lastName ? ` ${seed.lastName}` : ''}` }) }}</button>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>
