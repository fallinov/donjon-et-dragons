<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Character } from '~~/shared/types/character'
import { useCharacterState, computePassivePerception } from '~/composables/useCharacterState'

const props = defineProps<{ character: Character }>()

const {
  state,
  damage,
  heal,
  toggleInspiration,
  spendHitDie,
  toggleDeathSaveSuccess,
  toggleDeathSaveFailure,
  shortRest,
  longRest,
} = useCharacterState(props.character)

const passivePerception = computed(() => computePassivePerception(props.character))
const hitDiceRemaining = computed(() => props.character.hitDice.total - state.value.hitDiceUsed)
const isDown = computed(() => state.value.hpCurrent === 0)

const damageInput = ref(1)
const healInput = ref(1)
const toast = ref('')

function applyDamage(): void {
  if (damageInput.value > 0) damage(damageInput.value)
}

function applyHeal(): void {
  if (healInput.value > 0) heal(healInput.value)
}

function fmtBonus(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

function showToast(msg: string): void {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

function doShortRest(): void {
  shortRest()
  showToast('Repos court effectué')
}

function doLongRest(): void {
  if (!confirm('Repos long : restaure HP, emplacements et dés de vie. Confirmer ?')) return
  longRest()
  showToast(`Repos long effectué — HP restaurés à ${props.character.maxHp}`)
}
</script>

<template>
  <section
    aria-label="Tableau de bord du personnage"
    class="no-print mb-8 border border-gold/40 bg-charcoal/60 p-4 sm:p-5 flex flex-wrap gap-6 items-start motion-safe:animate-rise"
  >
    <!-- Toast feedback -->
    <Transition name="fade">
      <p
        v-if="toast"
        role="status"
        aria-live="polite"
        class="w-full text-center font-display text-sm text-gold-bright bg-gold/10 border border-gold/30 px-3 py-2"
      >
        {{ toast }}
      </p>
    </Transition>

    <!-- HP Tracker -->
    <div class="flex flex-col gap-2 flex-1 min-w-[260px]">
      <div class="flex items-baseline justify-between">
        <p class="font-display text-sm tracking-wider-4 text-gold uppercase">Points de vie</p>
        <p class="text-sm text-parchment-mute" v-if="state.hpTemp > 0">+{{ state.hpTemp }} temp</p>
      </div>
      <div class="flex items-center gap-3" aria-live="polite" aria-atomic="true">
        <p class="font-display text-3xl text-gold-bright tabular-nums">
          {{ state.hpCurrent }}<span class="text-parchment-mute text-xl"> / {{ character.maxHp }}</span>
        </p>
      </div>
      <div class="h-2 bg-charcoal border border-gold/30 overflow-hidden" role="progressbar" :aria-valuenow="state.hpCurrent" :aria-valuemin="0" :aria-valuemax="character.maxHp" :aria-label="`${state.hpCurrent} sur ${character.maxHp} points de vie`">
        <div
          class="h-full transition-all"
          :class="state.hpCurrent > character.maxHp / 2 ? 'bg-gold-bright' : state.hpCurrent > character.maxHp / 4 ? 'bg-ember-bright' : 'bg-ember'"
          :style="{ width: `${Math.min(100, (state.hpCurrent / character.maxHp) * 100)}%` }"
        />
      </div>
      <div class="flex flex-wrap items-center gap-2 mt-1">
        <label class="flex items-center gap-1 text-sm text-parchment-dim">
          <span>Dégâts</span>
          <input
            v-model.number="damageInput"
            type="number"
            min="1"
            class="w-14 bg-obsidian border border-gold/40 text-parchment font-display text-base sm:text-sm px-2 py-1.5"
          >
          <button
            type="button"
            class="border border-ember bg-blood/40 text-ember-bright font-display text-sm tracking-wider-2 uppercase min-h-11 min-w-11 px-3 py-2 hover:bg-blood/60"
            @click="applyDamage"
          >−</button>
        </label>
        <label class="flex items-center gap-1 text-sm text-parchment-dim">
          <span>Soin</span>
          <input
            v-model.number="healInput"
            type="number"
            min="1"
            class="w-14 bg-obsidian border border-gold/40 text-parchment font-display text-base sm:text-sm px-2 py-1.5"
          >
          <button
            type="button"
            class="border border-gold bg-charcoal text-gold-bright font-display text-sm tracking-wider-2 uppercase min-h-11 min-w-11 px-3 py-2 hover:bg-gold/20"
            @click="applyHeal"
          >+</button>
        </label>
      </div>
    </div>

    <!-- Stats fixes -->
    <div class="flex flex-wrap gap-x-8 gap-y-3 text-center sm:text-left">
      <div>
        <p class="font-display text-sm tracking-wider-4 text-gold uppercase">Maîtrise</p>
        <p class="font-display text-2xl text-gold-bright mt-1">{{ fmtBonus(character.proficiencyBonus) }}</p>
      </div>
      <div>
        <p class="font-display text-sm tracking-wider-4 text-gold uppercase">Sag. passive</p>
        <p class="font-display text-2xl text-gold-bright mt-1">{{ passivePerception }}</p>
      </div>
      <div>
        <p class="font-display text-sm tracking-wider-4 text-gold uppercase">Dés de vie</p>
        <p class="font-display text-2xl text-gold-bright mt-1 tabular-nums">{{ hitDiceRemaining }}<span class="text-parchment-mute text-sm">d{{ character.hitDice.die }}</span></p>
        <button
          type="button"
          :disabled="hitDiceRemaining === 0"
          class="mt-1 border border-gold/40 bg-charcoal text-parchment-dim hover:text-gold-bright font-display text-sm tracking-wider-2 uppercase min-h-11 px-2 py-1.5 disabled:opacity-30"
          @click="spendHitDie"
        >Dépenser un dé</button>
      </div>
    </div>

    <!-- Inspiration + repos -->
    <div class="flex flex-col gap-2 items-start min-w-[200px]">
      <button
        type="button"
        :aria-pressed="state.inspiration"
        class="inline-flex items-center gap-2 border border-gold-bright/60 min-h-11 px-4 py-2 font-display text-sm tracking-wider-3 uppercase transition-colors"
        :class="state.inspiration ? 'bg-gold-bright text-obsidian' : 'text-gold-bright hover:bg-gold-bright/10'"
        @click="toggleInspiration"
      >
        <span>✦</span>
        Inspiration
      </button>
      <div class="flex gap-2 w-full">
        <button
          type="button"
          class="flex-1 border border-gold/40 bg-charcoal text-gold-bright hover:bg-gold/10 font-display text-sm tracking-wider-2 uppercase min-h-11 px-3 py-2"
          @click="doShortRest"
        >Repos court</button>
        <button
          type="button"
          class="flex-1 border border-gold bg-gold/15 text-gold-bright hover:bg-gold/25 font-display text-sm tracking-wider-2 uppercase min-h-11 px-3 py-2"
          @click="doLongRest"
        >Repos long</button>
      </div>
    </div>

    <!-- Death saves (visible seulement quand HP = 0) -->
    <div v-if="isDown" class="flex flex-col gap-2 w-full border-t border-gold/30 pt-3 mt-1">
      <p class="font-display text-sm tracking-wider-4 text-ember-bright uppercase">⚠ Jets de sauvegarde contre la mort</p>
      <div class="flex flex-wrap gap-6 items-center">
        <div class="flex items-center gap-3">
          <span class="text-sm text-parchment-dim">Succès</span>
          <div class="flex gap-2" role="group" aria-label="Succès contre la mort">
            <button
              v-for="i in 3"
              :key="`s-${i}`"
              type="button"
              :aria-pressed="i <= state.deathSaves.successes"
              :aria-label="`Succès ${i}`"
              class="w-11 h-11 rounded-full border-2 border-gold-bright/60 flex items-center justify-center"
              :class="i <= state.deathSaves.successes ? 'bg-gold-bright' : 'bg-transparent'"
              @click="toggleDeathSaveSuccess(i - 1)"
            >
              <span v-if="i <= state.deathSaves.successes" class="text-obsidian font-bold">✓</span>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-parchment-dim">Échecs</span>
          <div class="flex gap-2" role="group" aria-label="Échecs contre la mort">
            <button
              v-for="i in 3"
              :key="`f-${i}`"
              type="button"
              :aria-pressed="i <= state.deathSaves.failures"
              :aria-label="`Échec ${i}`"
              class="w-11 h-11 rounded-full border-2 border-ember-bright/70 flex items-center justify-center"
              :class="i <= state.deathSaves.failures ? 'bg-ember' : 'bg-transparent'"
              @click="toggleDeathSaveFailure(i - 1)"
            >
              <span v-if="i <= state.deathSaves.failures" class="text-parchment font-bold">✗</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
