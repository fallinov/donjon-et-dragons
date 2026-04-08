<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SpellLevel } from '~~/shared/types/character'

const props = defineProps<{ spellcasting: SpellLevel }>()

const used = ref<boolean[]>(Array.from({ length: props.spellcasting.slots }, () => false))

const remaining = computed(() => used.value.filter(v => !v).length)
const total = computed(() => used.value.length)

function toggle(index: number): void {
  used.value[index] = !used.value[index]
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4 mb-4">
      <div>
        <p class="font-display text-xs tracking-wider-4 text-gold uppercase mb-2">
          Sorts de niveau {{ spellcasting.level }} — emplacements
          <span id="slots-count" class="text-gold-bright ml-1">{{ remaining }} / {{ total }}</span>
        </p>
        <div id="spell-slots" class="flex gap-2" role="group" aria-label="Emplacements de sort">
          <button
            v-for="(isUsed, i) in used"
            :key="i"
            type="button"
            data-slot
            :aria-pressed="isUsed"
            :aria-label="`Emplacement de sort ${i + 1}, ${isUsed ? 'consommé' : 'disponible'}`"
            class="w-5 h-5 rotate-45 motion-safe:animate-ember border border-ember-bright/60 cursor-pointer"
            :class="isUsed ? 'bg-charcoal opacity-25' : 'bg-ember'"
            :style="{ animationDelay: `${i * 0.6}s` }"
            @click="toggle(i)"
          />
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
