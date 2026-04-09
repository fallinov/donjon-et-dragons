<script setup lang="ts">
import { computed } from 'vue'
import type { Character, Spell, SpellSlotLevel } from '~~/shared/types/character'
import { useCharacterState } from '~/composables/useCharacterState'

const props = defineProps<{ character: Character }>()
const sc = computed(() => props.character.spellcasting!)
const { state, castSpell, shortRest, longRest } = useCharacterState(props.character)

function doShortRest(): void {
  shortRest()
}

function doLongRest(): void {
  if (!confirm('Repos long : restaure emplacements et sorts quotidiens. Confirmer ?')) return
  longRest()
}

function slotsRemaining(levelIndex: number): number {
  const max = sc.value.slotLevels[levelIndex]?.slots ?? 0
  const used = state.value.spellSlotsUsed[levelIndex] ?? 0
  return max - used
}

function isDailyUsed(spell: Spell): boolean {
  return state.value.dailySpellsUsed.includes(spell.title)
}

function slotLevelIndex(spellLevel: number): number {
  return sc.value.slotLevels.findIndex(sl => sl.level === spellLevel)
}

function canCast(spell: Spell): boolean {
  if (spell.cost === 'cantrip') return true
  if (spell.cost === 'daily') return !isDailyUsed(spell)
  if (spell.cost === 'slot') {
    const idx = slotLevelIndex(spell.level)
    return idx >= 0 && slotsRemaining(idx) > 0
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
  <div class="space-y-5">
    <!-- ═══ Bandeau : Difficulté + emplacements + repos ═══ -->
    <div class="space-y-3 bg-charcoal/30 px-4 py-4 border border-gold/10 rounded">
      <!-- Difficulté de sauvegarde -->
      <div class="flex items-baseline justify-between">
        <p class="font-display text-xs tracking-wider-3 text-gold uppercase">Difficulté de sauvegarde</p>
        <div class="flex items-baseline gap-2">
          <p class="font-display text-2xl text-gold-bright">{{ sc.saveDc }}</p>
          <p v-if="sc.attackBonus" class="text-xs text-parchment-mute">+{{ sc.attackBonus }} att.</p>
        </div>
      </div>

      <!-- Emplacements par niveau -->
      <div v-for="(slotLevel, idx) in sc.slotLevels" :key="slotLevel.level" class="flex items-center justify-between">
        <p class="font-display text-xs tracking-wider-3 text-gold uppercase" aria-live="polite">
          Niv. {{ slotLevel.level }}
          <span :id="`slots-count-${slotLevel.level}`" class="text-gold-bright ml-1">{{ slotsRemaining(idx) }} / {{ slotLevel.slots }}</span>
        </p>
        <div class="flex gap-1.5" role="group" :aria-label="`Emplacements niveau ${slotLevel.level}`">
          <span
            v-for="i in slotLevel.slots"
            :key="i"
            data-slot
            class="w-4 h-4 rotate-45 border border-ember-bright/60 inline-block"
            :class="i <= (state.spellSlotsUsed[idx] ?? 0) ? 'bg-charcoal opacity-25' : 'bg-ember'"
          />
        </div>
      </div>

      <!-- Boutons repos -->
      <div class="flex gap-2 pt-1">
        <button type="button" class="flex-1 border border-gold/20 text-parchment-mute hover:text-gold-bright font-display text-xs tracking-wider-2 uppercase py-2 transition-colors" @click="doShortRest">Repos court</button>
        <button type="button" class="flex-1 border border-gold/30 bg-gold/5 text-gold hover:text-gold-bright hover:bg-gold/15 font-display text-xs tracking-wider-2 uppercase py-2 transition-colors" @click="doLongRest">Repos long</button>
      </div>
    </div>

    <!-- ═══ Sorts mineurs (cantrips) ═══ -->
    <div v-if="cantrips.length">
      <p class="font-display text-xs tracking-wider-3 text-gold/60 uppercase mb-2">Sorts mineurs</p>
      <ul class="space-y-2">
        <li v-for="spell in cantrips" :key="spell.title" class="flex items-start justify-between gap-3 py-2 border-b border-gold/5 last:border-0">
          <div class="flex-1 min-w-0">
            <strong class="block font-display text-xs tracking-wider-3 text-gold-bright uppercase">{{ spell.title }}</strong>
            <span class="text-parchment-dim text-sm leading-snug">{{ spell.description }}</span>
          </div>
          <span class="shrink-0 text-xs text-parchment-mute/50 font-display mt-0.5">∞</span>
        </li>
      </ul>
    </div>

    <!-- ═══ Sorts par niveau (slot) ═══ -->
    <div v-for="slotLevel in sc.slotLevels" :key="`spells-${slotLevel.level}`">
      <p class="font-display text-xs tracking-wider-3 text-gold/60 uppercase mb-2">Sorts de niveau {{ slotLevel.level }}</p>
      <ul class="space-y-1">
        <li v-for="spell in spellsByLevel(slotLevel.level)" :key="spell.title" class="flex items-start justify-between gap-2 py-2.5 border-b border-gold/5 last:border-0">
          <div class="flex-1 min-w-0">
            <strong class="block font-display text-xs tracking-wider-3 text-gold-bright uppercase">{{ spell.title }}</strong>
            <span class="text-parchment-dim text-sm leading-snug">{{ spell.description }}</span>
          </div>
          <button
            type="button"
            :disabled="!canCast(spell)"
            class="shrink-0 self-center border border-gold/30 bg-charcoal text-gold-bright hover:bg-gold/10 disabled:opacity-25 disabled:hover:bg-transparent font-display text-xs tracking-wider-2 uppercase px-3 py-1.5 transition-colors"
            @click="cast(spell)"
          >Lancer</button>
        </li>
      </ul>
    </div>

    <!-- ═══ Sorts daily (raciaux, etc.) ═══ -->
    <div v-if="dailySpells.length">
      <p class="font-display text-xs tracking-wider-3 text-gold/60 uppercase mb-2">Sorts spéciaux</p>
      <ul class="space-y-1">
        <li v-for="spell in dailySpells" :key="spell.title" class="flex items-start justify-between gap-2 py-2.5 border-b border-gold/5 last:border-0">
          <div class="flex-1 min-w-0">
            <strong class="block font-display text-xs tracking-wider-3 text-gold-bright uppercase">{{ spell.title }}</strong>
            <span class="text-parchment-dim text-sm leading-snug">{{ spell.description }}</span>
            <span class="text-xs text-parchment-mute ml-1">({{ costLabel(spell) }})</span>
          </div>
          <button
            type="button"
            :disabled="!canCast(spell)"
            class="shrink-0 self-center border border-gold/30 bg-charcoal text-gold-bright hover:bg-gold/10 disabled:opacity-25 disabled:hover:bg-transparent font-display text-xs tracking-wider-2 uppercase px-3 py-1.5 transition-colors"
            @click="cast(spell)"
          >{{ isDailyUsed(spell) ? 'Utilisé' : 'Lancer' }}</button>
        </li>
      </ul>
    </div>
  </div>
</template>
