<script setup lang="ts">
import { getCharacter } from '~/data/characters'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const character = computed(() => getCharacter(slug.value))

if (!character.value) {
  throw createError({ statusCode: 404, statusMessage: 'Personnage introuvable', fatal: true })
}

useSeoMeta({
  title: () => {
    const c = character.value!
    return `Codex — ${c.firstName}${c.lastName ? ` ${c.lastName}` : ''}`
  },
  description: () => {
    const c = character.value!
    const fullName = `${c.firstName}${c.lastName ? ` ${c.lastName}` : ''}`
    return `Fiche de personnage D&D 5e : ${fullName}, ${c.race} ${c.className} niveau ${c.level}.`
  },
})
</script>

<template>
  <div v-if="character">
    <PrintButton />

    <main
      id="contenu"
      class="codex font-body text-parchment text-base leading-relaxed min-h-screen px-4 py-6 sm:px-8 sm:py-12 lg:px-10 lg:py-16 relative z-10 max-w-6xl mx-auto"
    >
      <nav aria-label="Fil d'Ariane" class="no-print mb-2 xl:mb-6">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1 text-sm font-display tracking-wider-3 text-parchment-dim hover:text-gold-bright uppercase"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
          Retour aux codex
        </NuxtLink>
      </nav>

      <CodexHero :character="character" />

      <CodexStatusBar :character="character" />

      <div class="print-body-grid grid grid-cols-1 lg:grid-cols-[260px_1fr_1fr] gap-8 lg:gap-10 motion-safe:animate-rise">
        <CodexAbilityScores :abilities="character.abilities" />

        <div class="space-y-8">
          <CodexSection id="arts-title" title="Compétences">
            <CodexSkillList :skills="character.skills" />
          </CodexSection>

          <CodexSection id="dons-title" title="Capacités et traits">
            <CodexFeatureList :features="character.features" />
          </CodexSection>

          <CodexSection id="perso-title" title="Personnalité">
            <CodexPersonality :personality="character.personality" />
          </CodexSection>
        </div>

        <div class="space-y-8">
          <CodexSection id="arsenal-title" title="Attaques et incantations">
            <CodexAttacks :attacks="character.attacks" />
          </CodexSection>

          <CodexSection v-if="character.spellcasting" id="incant-title" title="Sorts">
            <CodexSpells :character="character" />
          </CodexSection>

          <CodexSection id="langues-title" title="Langues">
            <CodexLanguages :languages="character.languages" />
          </CodexSection>
        </div>
      </div>

      <CodexRituals :rituals="character.rituals" />

      <footer class="mt-16 pt-8 border-t border-gold/30 text-center text-parchment-mute italic text-sm tracking-wider-2">
        <p class="text-gold not-italic text-lg mb-4" aria-hidden="true">☩</p>
        <p>{{ character.colophon }}</p>
      </footer>
    </main>
  </div>
</template>
