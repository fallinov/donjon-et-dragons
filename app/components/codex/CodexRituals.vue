<script setup lang="ts">
import type { Ritual } from '~~/shared/types/character'

defineProps<{ rituals: Ritual[] }>()
</script>

<template>
  <section
    aria-labelledby="rites-title"
    class="mt-16 p-6 sm:p-10 border border-gold/30 bg-gradient-to-br from-charcoal/70 to-obsidian/80 motion-safe:animate-rise"
  >
    <header class="text-center mb-8">
      <h2 id="rites-title" class="font-display text-xl sm:text-2xl tracking-wider-3 text-gold-bright uppercase">Rites de combat</h2>
      <p class="mt-2 text-parchment-dim italic text-sm">— trois séquences à graver dans la mémoire du bras —</p>
    </header>

    <div class="print-rituals-grid grid grid-cols-1 md:grid-cols-3 gap-6">
      <article
        v-for="ritual in rituals"
        :key="ritual.number"
        class="border-l-2 border-gold pl-5"
      >
        <p class="font-display text-xs tracking-wider-4 text-gold uppercase mb-2">— {{ ritual.number }}</p>
        <h3 class="font-display text-base sm:text-lg tracking-wider-2 text-parchment uppercase mb-3">
          {{ ritual.title }}
        </h3>
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
      </article>
    </div>
  </section>
</template>
