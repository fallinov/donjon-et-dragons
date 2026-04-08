<script setup lang="ts">
import { getCharacter } from '~/data/characters'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const character = computed(() => getCharacter(slug.value))

if (!character.value) {
  throw createError({ statusCode: 404, statusMessage: 'Personnage introuvable', fatal: true })
}

useSeoMeta({
  title: () => `Codex — ${character.value!.firstName} ${character.value!.lastName}`,
  description: () => `Fiche de personnage D&D 5e : ${character.value!.firstName} ${character.value!.lastName}, ${character.value!.race} ${character.value!.className} niveau ${character.value!.level}.`,
})
</script>

<template>
  <div v-if="character">
    <PrintButton />

    <main
      id="contenu"
      class="codex font-body text-parchment text-base leading-relaxed min-h-screen px-4 py-6 sm:px-8 sm:py-12 lg:px-10 lg:py-16 relative z-10 max-w-6xl mx-auto"
    >
      <NuxtLink
        to="/"
        class="no-print inline-block mb-6 text-xs font-display tracking-wider-3 text-parchment-dim hover:text-gold-bright uppercase"
      >
        ← Retour aux codex
      </NuxtLink>

      <CodexHero :character="character" />

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
            <CodexSpells :spellcasting="character.spellcasting" />
          </CodexSection>

          <CodexSection id="langues-title" title="Langues">
            <CodexLanguages :languages="character.languages" />
          </CodexSection>
        </div>
      </div>

      <CodexRituals :rituals="character.rituals" />

      <footer class="mt-16 pt-8 border-t border-gold/30 text-center text-parchment-mute italic text-xs tracking-wider-2">
        <p class="text-gold not-italic text-lg mb-4" aria-hidden="true">☩</p>
        {{ character.colophon }}
      </footer>
    </main>
  </div>
</template>
