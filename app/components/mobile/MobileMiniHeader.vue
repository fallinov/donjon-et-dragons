<script setup lang="ts">
import type { Character } from '~~/shared/types/character'

defineProps<{ character: Character }>()
</script>

<template>
  <div class="sticky top-0 z-20 bg-charcoal/95 backdrop-blur-md px-4 py-2 flex items-center justify-between gap-3 lg:hidden">
    <div class="flex items-center gap-3 min-w-0">
      <NuxtLink to="/" class="text-parchment-dim hover:text-gold-bright shrink-0" aria-label="Retour aux codex">
        <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
      </NuxtLink>
      <h1 class="font-display text-sm text-gold-bright uppercase tracking-wider-2 truncate">
        {{ character.firstName }}{{ character.lastName ? ` ${character.lastName}` : '' }}
      </h1>
    </div>
    <dl class="flex items-center gap-3 shrink-0">
      <div class="text-center">
        <dd class="font-display text-base text-parchment tabular-nums leading-none">{{ character.vitals.find(v => v.label === "Classe d'armure")?.value }}</dd>
        <dt class="font-display text-[8px] tracking-wider-3 text-gold/60 uppercase">CA</dt>
      </div>
      <div class="text-center">
        <dd class="font-display text-base text-parchment tabular-nums leading-none">{{ character.vitals.find(v => v.label === 'Initiative')?.value }}</dd>
        <dt class="font-display text-[8px] tracking-wider-3 text-gold/60 uppercase">Init</dt>
      </div>
      <div class="text-center">
        <dd class="font-display text-base text-parchment tabular-nums leading-none">+{{ character.proficiencyBonus }}</dd>
        <dt class="font-display text-[8px] tracking-wider-3 text-gold/60 uppercase">Maîtr</dt>
      </div>
    </dl>
  </div>
</template>
