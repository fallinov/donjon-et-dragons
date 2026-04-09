<script setup lang="ts">
import { computed } from 'vue'
import type { Character } from '~~/shared/types/character'
import { useCharacterState } from '~/composables/useCharacterState'

const props = defineProps<{ character: Character }>()

const spellcasting = computed(() => props.character.spellcasting!)
const { state, consumeSpellSlot, restoreSpellSlot } = useCharacterState(props.character)

const total = computed(() => spellcasting.value.slots)
const remaining = computed(() => total.value - state.value.spellSlotsUsed)
const slots = computed(() =>
  Array.from({ length: total.value }, (_, i) => ({
    index: i,
    used: i < state.value.spellSlotsUsed,
  })),
)

function toggle(slot: { index: number, used: boolean }): void {
  if (slot.used) restoreSpellSlot()
  else consumeSpellSlot()
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-4">
      <div>
        <p class="font-display text-sm tracking-wider-4 text-gold uppercase mb-2" aria-live="polite" aria-atomic="true">
          Sorts de niveau {{ spellcasting.level }} — emplacements
          <span id="slots-count" class="text-gold-bright ml-1">{{ remaining }} / {{ total }}</span>
        </p>
        <div id="spell-slots" class="flex gap-3" role="group" aria-label="Emplacements de sort">
          <button
            v-for="slot in slots"
            :key="slot.index"
            type="button"
            data-slot
            :aria-pressed="slot.used"
            :aria-label="`Emplacement de sort ${slot.index + 1}, ${slot.used ? 'consommé' : 'disponible'}`"
            class="w-11 h-11 flex items-center justify-center cursor-pointer"
            @click="toggle(slot)"
          >
            <span
              class="w-5 h-5 block rotate-45 motion-safe:animate-ember border border-ember-bright/60"
              :class="slot.used ? 'bg-charcoal opacity-25' : 'bg-ember'"
              :style="{ animationDelay: `${slot.index * 0.6}s` }"
            />
          </button>
        </div>
      </div>
      <div class="text-right">
        <p class="font-display text-xs tracking-wider-4 text-gold uppercase">DD de sauvegarde des sorts</p>
        <p class="font-display text-3xl text-gold-bright">{{ spellcasting.saveDc }}</p>
      </div>
    </div>

    <ul class="space-y-4">
      <li v-for="spell in spellcasting.spells" :key="spell.title">
        <strong class="block font-display text-xs tracking-wider-3 text-gold-bright uppercase mb-1">
          — {{ spell.title }}
        </strong>
        <span class="text-parchment-dim">{{ spell.description }}</span>
      </li>
    </ul>
  </div>
</template>
