<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Ritual } from '~~/shared/types/character'

const props = withDefaults(defineProps<{
  rituals: Ritual[]
  /** Rappel affiché sous les rites. */
  note?: string
  /** Affiche chaque rite en accordéon (mobile). Tous fermés au départ, plusieurs ouverts possibles. */
  collapsible?: boolean
}>(), { collapsible: false })

const COUNT_WORDS: Record<number, string> = { 1: 'une', 2: 'deux', 3: 'trois', 4: 'quatre', 5: 'cinq', 6: 'six' }

const subtitle = computed(() => {
  const n = props.rituals.length
  const word = COUNT_WORDS[n] ?? String(n)
  return `— ${word} séquence${n > 1 ? 's' : ''} à graver dans la mémoire du bras —`
})

const openRituals = ref<Set<string>>(new Set())

function isOpen(number: string): boolean {
  return !props.collapsible || openRituals.value.has(number)
}

function toggle(number: string): void {
  const next = new Set(openRituals.value)
  if (next.has(number)) next.delete(number)
  else next.add(number)
  openRituals.value = next
}

function panelId(index: number): string {
  return `rite-panel-${index}`
}
</script>

<template>
  <section
    aria-labelledby="rites-title"
    class="mt-16 p-6 sm:p-10 border border-gold/30 bg-gradient-to-br from-charcoal/70 to-obsidian/80 motion-safe:animate-rise"
  >
    <header class="text-center mb-8">
      <h2 id="rites-title" class="font-display text-xl sm:text-2xl tracking-wider-3 text-gold-bright uppercase">Rites de combat</h2>
      <p class="mt-2 text-parchment-dim italic text-sm">{{ subtitle }}</p>
    </header>

    <div
      class="print-rituals-grid grid grid-cols-1"
      :class="collapsible ? 'gap-3' : 'md:grid-cols-3 gap-6'"
    >
      <article
        v-for="(ritual, index) in rituals"
        :key="ritual.number"
        class="border-l-2 border-gold pl-5"
        :data-ritual="ritual.number"
      >
        <h3 v-if="collapsible" class="font-display uppercase">
          <button
            type="button"
            class="w-full min-h-11 flex items-center justify-between gap-3 py-2 text-left"
            :aria-expanded="isOpen(ritual.number)"
            :aria-controls="panelId(index)"
            @click="toggle(ritual.number)"
          >
            <span>
              <span class="block text-xs tracking-wider-4 text-gold mb-1">— {{ ritual.number }}</span>
              <span class="block text-base tracking-wider-2 text-parchment">{{ ritual.title }}</span>
            </span>
            <svg
              class="no-print w-5 h-5 shrink-0 text-gold motion-safe:transition-transform"
              :class="{ 'rotate-180': isOpen(ritual.number) }"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            ><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>
          </button>
        </h3>
        <template v-else>
          <p class="font-display text-xs tracking-wider-4 text-gold uppercase mb-2">— {{ ritual.number }}</p>
          <h3 class="font-display text-base sm:text-lg tracking-wider-2 text-parchment uppercase mb-3">
            {{ ritual.title }}
          </h3>
        </template>

        <div
          v-show="isOpen(ritual.number)"
          :id="panelId(index)"
          class="print:!block"
          :class="{ 'pb-3': collapsible }"
        >
          <p
            v-for="(step, i) in ritual.steps"
            :key="i"
            class="text-sm text-parchment-dim mb-1"
          >
            {{ step.text }}<em v-if="step.emphasis" class="text-bone">{{ step.emphasis }}</em>
          </p>
          <p
            v-for="(formula, i) in ritual.formulas"
            :key="`f-${i}`"
            class="font-display text-sm text-gold-bright bg-charcoal/60 px-3 py-2 border-l border-ember mt-2"
          >
            {{ formula }}
          </p>
          <p v-if="ritual.footnote" class="mt-3 text-xs text-parchment-mute italic">
            {{ ritual.footnote }}
          </p>
        </div>
      </article>
    </div>

    <p
      v-if="note"
      class="mt-6 border border-ember/40 bg-blood/20 px-4 py-3 text-sm text-parchment italic"
      data-rituals-note
    >
      <span class="not-italic font-display text-xs tracking-wider-3 text-ember-bright uppercase mr-2">Attention</span>{{ note }}
    </p>
  </section>
</template>
