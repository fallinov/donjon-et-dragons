<script setup lang="ts">
import { computed } from 'vue'
import type { Character, Spell, SpellSlotLevel } from '~~/shared/types/character'
import { useCharacterState } from '~/composables/useCharacterState'

const props = defineProps<{ character: Character }>()
const sc = computed(() => props.character.spellcasting!)
const { state, castSpell } = useCharacterState(props.character)

function slotsRemaining(levelIndex: number): number {
  const max = sc.value.slotLevels[levelIndex]?.slots ?? 0
  const used = state.value.spellSlotsUsed[levelIndex] ?? 0
  return max - used
}

function isDailyUsed(spell: Spell): boolean {
  return state.value.dailySpellsUsed.includes(spell.title)
}

function canCast(spell: Spell): boolean {
  if (spell.cost === 'cantrip') return true
  if (spell.cost === 'daily') return !isDailyUsed(spell)
  if (spell.cost === 'slot') {
    const levelIndex = spell.level - 1
    return slotsRemaining(levelIndex) > 0
  }
  return false
}

function cast(spell: Spell): void {
  castSpell(spell)
}

const cantrips = computed(() => sc.value.spells.filter(s => s.cost === 'cantrip'))
const dailySpells = computed(() => sc.value.spells.filter(s => s.cost === 'daily'))

function spellsByLevel(level: number): Spell[] {
  return sc.value.spells.filter(s => s.level === level && s.cost === 'slot')
}

function costLabel(spell: Spell): string {
  if (spell.cost === 'cantrip') return 'Sort mineur'
  if (spell.cost === 'daily') return '1 / repos long'
  return `Niveau ${spell.level}`
}
</script>

<template>
  <div class="space-y-6">
    <!-- DD de sauvegarde -->
    <div class="flex flex-wrap gap-4 items-baseline">
      <p class="font-display text-sm tracking-wider-4 text-gold uppercase">DD de sauvegarde des sorts</p>
      <p class="font-display text-3xl text-gold-bright">{{ sc.saveDc }}</p>
      <p v-if="sc.attackBonus" class="text-sm text-parchment-dim">Bonus d'attaque +{{ sc.attackBonus }}</p>
    </div>

    <!-- Emplacements par niveau (non cliquables, état visuel) -->
    <div v-for="(slotLevel, idx) in sc.slotLevels" :key="slotLevel.level" class="flex items-center gap-3">
      <p class="font-display text-sm tracking-wider-4 text-gold uppercase min-w-[80px]" aria-live="polite">
        Niv. {{ slotLevel.level }}
        <span id="slots-count" class="text-gold-bright ml-1">{{ slotsRemaining(idx) }} / {{ slotLevel.slots }}</span>
      </p>
      <div class="flex gap-2" role="group" :aria-label="`Emplacements niveau ${slotLevel.level}`">
        <span
          v-for="i in slotLevel.slots"
          :key="i"
          data-slot
          class="w-5 h-5 rotate-45 border border-ember-bright/60 inline-block"
          :class="i <= (state.spellSlotsUsed[idx] ?? 0) ? 'bg-charcoal opacity-25' : 'bg-ember'"
        />
      </div>
    </div>

    <!-- Sorts mineurs (cantrips) -->
    <div v-if="cantrips.length">
      <p class="font-display text-sm tracking-wider-3 text-gold/70 uppercase mb-3 pb-1 border-b border-gold/20">Sorts mineurs</p>
      <ul class="space-y-3">
        <li v-for="spell in cantrips" :key="spell.title" class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <strong class="block font-display text-xs tracking-wider-3 text-gold-bright uppercase mb-0.5">{{ spell.title }}</strong>
            <span class="text-parchment-dim text-sm">{{ spell.description }}</span>
          </div>
          <span class="shrink-0 text-xs text-parchment-mute font-display tracking-wider-2 uppercase mt-1">∞</span>
        </li>
      </ul>
    </div>

    <!-- Sorts par niveau (slot) -->
    <div v-for="slotLevel in sc.slotLevels" :key="`spells-${slotLevel.level}`">
      <p class="font-display text-sm tracking-wider-3 text-gold/70 uppercase mb-3 pb-1 border-b border-gold/20">Sorts de niveau {{ slotLevel.level }}</p>
      <ul class="space-y-3">
        <li v-for="spell in spellsByLevel(slotLevel.level)" :key="spell.title" class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <strong class="block font-display text-xs tracking-wider-3 text-gold-bright uppercase mb-0.5">{{ spell.title }}</strong>
            <span class="text-parchment-dim text-sm">{{ spell.description }}</span>
          </div>
          <button
            type="button"
            :disabled="!canCast(spell)"
            class="shrink-0 min-h-9 border border-gold/40 bg-charcoal text-gold-bright hover:bg-gold/10 disabled:opacity-30 disabled:hover:bg-transparent font-display text-xs tracking-wider-2 uppercase px-3 py-1.5 transition-colors"
            @click="cast(spell)"
          >Lancer</button>
        </li>
      </ul>
    </div>

    <!-- Sorts daily (raciaux, etc.) -->
    <div v-if="dailySpells.length">
      <p class="font-display text-sm tracking-wider-3 text-gold/70 uppercase mb-3 pb-1 border-b border-gold/20">Sorts spéciaux</p>
      <ul class="space-y-3">
        <li v-for="spell in dailySpells" :key="spell.title" class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <strong class="block font-display text-xs tracking-wider-3 text-gold-bright uppercase mb-0.5">{{ spell.title }}</strong>
            <span class="text-parchment-dim text-sm">{{ spell.description }}</span>
            <span class="text-xs text-parchment-mute ml-1">({{ costLabel(spell) }})</span>
          </div>
          <button
            type="button"
            :disabled="!canCast(spell)"
            class="shrink-0 min-h-9 border border-gold/40 bg-charcoal text-gold-bright hover:bg-gold/10 disabled:opacity-30 disabled:hover:bg-transparent font-display text-xs tracking-wider-2 uppercase px-3 py-1.5 transition-colors"
            @click="cast(spell)"
          >{{ isDailyUsed(spell) ? 'Utilisé' : 'Lancer' }}</button>
        </li>
      </ul>
    </div>
  </div>
</template>
