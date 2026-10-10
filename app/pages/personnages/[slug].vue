<script setup lang="ts">
import { getCharacter } from '~/data/characters'
import { useMobileTab } from '~/composables/useMobileTab'
import { useIsDesktop } from '~/composables/useIsDesktop'
import { computePassivePerception, computePassiveInvestigation } from '~/composables/useCharacterState'
import { t } from '~/composables/useT'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const character = computed(() => getCharacter(slug.value))

if (!character.value) {
  throw createError({ statusCode: 404, statusMessage: t('character.notFound'), fatal: true })
}

useSeoMeta({
  title: () => {
    const c = character.value!
    return t('character.seo.title', { name: `${c.firstName}${c.lastName ? ` ${c.lastName}` : ''}` })
  },
  description: () => {
    const c = character.value!
    const fullName = `${c.firstName}${c.lastName ? ` ${c.lastName}` : ''}`
    return t('character.seo.description', { name: fullName, race: c.race, className: c.className, level: c.level })
  },
})

const { activeTab, setTab } = useMobileTab()
const isDesktop = useIsDesktop()

// Reset à l'onglet Profil à chaque ouverture de fiche
setTab('profil')
</script>

<template>
  <div v-if="character">
    <PrintButton />

    <main
      id="contenu"
      class="codex font-body text-parchment text-base leading-relaxed min-h-screen px-4 py-3 sm:px-8 sm:py-12 lg:px-10 lg:py-16 relative z-10 max-w-6xl mx-auto pb-24 lg:pb-16"
    >
      <!-- Breadcrumb (desktop uniquement, mobile = dans mini-header) -->
      <nav v-if="isDesktop" :aria-label="t('common.breadcrumb')" class="no-print mb-6">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1 text-sm font-display tracking-wider-3 text-parchment-dim hover:text-gold-bright uppercase"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
          {{ t('common.back') }}
        </NuxtLink>
      </nav>

      <!-- ═══════════════════════════════════════════════════════ -->
      <!-- MOBILE : carte plein écran sur Perso, mini-header sinon -->
      <!-- ═══════════════════════════════════════════════════════ -->
      <div v-if="!isDesktop">
        <!-- Carte plein écran seulement sur l'onglet Profil -->
        <CodexHero v-if="activeTab === 'profil'" :character="character" />
        <!-- Mini-header sticky sur les autres onglets -->
        <MobileMiniHeader v-else :character="character" />

        <MobileSwipeContainer>
          <!-- Onglet Profil (Capacités + Langues + Sens + Personnalité) -->
          <div v-if="activeTab === 'profil'" class="space-y-6">
            <CodexSection id="dons-title-m" :title="t('character.section.features')">
              <CodexFeatureList :features="character.features" />
            </CodexSection>
            <CodexSection id="langues-title-m" :title="t('character.section.languages')">
              <CodexLanguages :languages="character.languages" />
            </CodexSection>
            <CodexSection id="sens-title-m" :title="t('character.section.senses')">
              <dl class="flex flex-wrap gap-6">
                <div><dt class="text-xs text-parchment-mute uppercase tracking-wider-3">{{ t('senses.perception') }}</dt><dd class="font-display text-xl text-parchment">{{ computePassivePerception(character) }}</dd></div>
                <div><dt class="text-xs text-parchment-mute uppercase tracking-wider-3">{{ t('senses.investigation') }}</dt><dd class="font-display text-xl text-parchment">{{ computePassiveInvestigation(character) }}</dd></div>
                <div v-if="character.darkvision"><dt class="text-xs text-parchment-mute uppercase tracking-wider-3">{{ t('senses.darkvision') }}</dt><dd class="font-display text-xl text-parchment">{{ character.darkvision }}<span class="text-xs text-parchment-mute ml-0.5">{{ t('common.meters') }}</span></dd></div>
              </dl>
            </CodexSection>
            <CodexSection id="perso-title-m" :title="t('character.section.personality')">
              <CodexPersonality :personality="character.personality" />
            </CodexSection>
            <footer class="pt-8 border-t border-gold/30 text-center text-parchment-mute italic text-sm tracking-wider-2">
              <p class="text-gold not-italic text-lg mb-4" aria-hidden="true">☩</p>
              <p>{{ character.colophon }}</p>
            </footer>
          </div>

          <!-- Onglet Combat (+ Rites) -->
          <div v-if="activeTab === 'combat'" class="space-y-6">
            <CodexStatusBar :character="character" />
            <CodexSection id="arsenal-title-m" :title="t('character.section.attacks')">
              <CodexAttacks :attacks="character.attacks" />
            </CodexSection>
            <CodexRituals :rituals="character.rituals" :note="character.ritualsNote" collapsible />
          </div>

          <!-- Onglet Sorts -->
          <div v-if="activeTab === 'sorts'" class="space-y-6">
            <CodexSpells v-if="character.spellcasting" :character="character" />
            <p v-else class="text-parchment-mute italic text-center py-8">{{ t('character.noSpells') }}</p>
          </div>

          <!-- Onglet Sac -->
          <div v-if="activeTab === 'sac'" class="space-y-6">
            <CodexSection id="sac-title-m" :title="t('character.section.bag')" class="no-print">
              <CodexInventory :character="character" />
            </CodexSection>
          </div>

          <!-- Onglet Stats -->
          <div v-if="activeTab === 'stats'" class="space-y-6">
            <CodexAbilityScores :abilities="character.abilities" />
            <CodexSection id="arts-title-m" :title="t('character.section.skills')">
              <CodexSkillList :skills="character.skills" />
            </CodexSection>
          </div>
        </MobileSwipeContainer>
      </div>

      <!-- ═══════════════════════════════════════════════════════ -->
      <!-- DESKTOP : layout 3 colonnes classique (>= lg)           -->
      <!-- ═══════════════════════════════════════════════════════ -->
      <div v-if="isDesktop">
        <CodexHero :character="character" />
        <CodexStatusBar :character="character" />

        <div class="print-body-grid grid grid-cols-[260px_1fr_1fr] gap-10 motion-safe:animate-rise">
          <CodexAbilityScores :abilities="character.abilities" />

          <div class="space-y-8">
            <CodexSection id="arts-title" :title="t('character.section.skills')">
              <CodexSkillList :skills="character.skills" />
            </CodexSection>
            <CodexSection id="dons-title" :title="t('character.section.features')">
              <CodexFeatureList :features="character.features" />
            </CodexSection>
            <CodexSection id="perso-title" :title="t('character.section.personality')">
              <CodexPersonality :personality="character.personality" />
            </CodexSection>
          </div>

          <div class="space-y-8">
            <CodexSection id="arsenal-title" :title="t('character.section.attacks')">
              <CodexAttacks :attacks="character.attacks" />
            </CodexSection>
            <CodexSection v-if="character.spellcasting" id="incant-title" :title="t('character.section.spells')">
              <CodexSpells :character="character" />
            </CodexSection>
            <CodexSection id="langues-title" :title="t('character.section.languages')">
              <CodexLanguages :languages="character.languages" />
            </CodexSection>
          </div>
        </div>

        <CodexRituals :rituals="character.rituals" :note="character.ritualsNote" />

        <CodexSection id="sac-title" :title="t('character.section.bag')" class="no-print mt-16">
          <CodexInventory :character="character" />
        </CodexSection>

        <footer class="mt-16 pt-8 border-t border-gold/30 text-center text-parchment-mute italic text-sm tracking-wider-2">
          <p class="text-gold not-italic text-lg mb-4" aria-hidden="true">☩</p>
          <p>{{ character.colophon }}</p>
        </footer>
      </div>
    </main>

    <!-- Bottom tab bar mobile -->
    <MobileTabBar />
  </div>
</template>
