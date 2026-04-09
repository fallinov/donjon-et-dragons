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
const hpPercent = computed(() => Math.min(100, (state.value.hpCurrent / props.character.maxHp) * 100))

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
    class="no-print mb-8 motion-safe:animate-rise"
  >
    <!-- Toast feedback (pleine largeur au-dessus) -->
    <Transition name="fade">
      <p
        v-if="toast"
        role="status"
        aria-live="polite"
        class="mb-3 text-center font-display text-sm text-gold-bright bg-gold/10 border border-gold/30 px-3 py-2"
      >
        {{ toast }}
      </p>
    </Transition>

    <!-- Grille principale : 4 blocs hiérarchisés -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(320px,2fr)_minmax(180px,1fr)_auto_auto] gap-4 xl:gap-5">

      <!-- ═══ BLOC 1 — HP (dominant, usage haute fréquence) ═══ -->
      <div
        class="border border-gold/40 p-4 sm:p-5 md:col-span-2 xl:col-span-1 transition-colors"
        :class="isDown ? 'bg-blood/30 border-ember' : 'bg-charcoal/60'"
      >
        <div class="flex items-baseline justify-between mb-2">
          <p class="font-display text-sm tracking-wider-4 text-gold uppercase">Points de vie</p>
          <p v-if="state.hpTemp > 0" class="text-sm text-gold-bright font-display">+{{ state.hpTemp }} temp</p>
        </div>

        <!-- Nombre HP — taille dominante (Fitts + Krug : scannable) -->
        <div aria-live="polite" aria-atomic="true" class="mb-3">
          <p class="font-display tabular-nums leading-none"
             :class="isDown ? 'text-ember-bright' : hpPercent > 50 ? 'text-gold-bright' : hpPercent > 25 ? 'text-ember-bright' : 'text-ember'"
          >
            <span class="text-5xl sm:text-6xl">{{ state.hpCurrent }}</span>
            <span class="text-2xl text-parchment-mute"> / {{ character.maxHp }}</span>
          </p>
        </div>

        <!-- Barre de progression HP -->
        <div
          v-if="!isDown"
          class="h-3 bg-obsidian border border-gold/30 overflow-hidden mb-4"
          role="progressbar"
          :aria-valuenow="state.hpCurrent"
          :aria-valuemin="0"
          :aria-valuemax="character.maxHp"
          :aria-label="`${state.hpCurrent} sur ${character.maxHp} points de vie`"
        >
          <div
            class="h-full transition-all duration-300"
            :class="hpPercent > 50 ? 'bg-gold-bright' : hpPercent > 25 ? 'bg-ember-bright' : 'bg-ember motion-safe:animate-ember'"
            :style="{ width: `${hpPercent}%` }"
          />
        </div>

        <!-- Death saves (remplace la barre quand HP = 0) (Hick : conditionnel) -->
        <div v-if="isDown" class="mb-4 py-3 border-y border-ember/40">
          <p class="font-display text-sm tracking-wider-4 text-ember-bright uppercase mb-3">⚠ Sauvegardes contre la mort</p>
          <div class="flex flex-wrap gap-6 items-center">
            <div class="flex items-center gap-3">
              <span class="text-sm text-parchment-dim">Succès</span>
              <div class="flex gap-2" role="group" aria-label="Succès contre la mort">
                <button
                  v-for="i in 3" :key="`s-${i}`" type="button"
                  :aria-pressed="i <= state.deathSaves.successes"
                  :aria-label="`Succès ${i}`"
                  class="w-11 h-11 rounded-full border-2 border-gold-bright/60 flex items-center justify-center transition-colors"
                  :class="i <= state.deathSaves.successes ? 'bg-gold-bright' : 'bg-transparent hover:bg-gold-bright/10'"
                  @click="toggleDeathSaveSuccess(i - 1)"
                ><span v-if="i <= state.deathSaves.successes" class="text-obsidian font-bold">✓</span></button>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm text-parchment-dim">Échecs</span>
              <div class="flex gap-2" role="group" aria-label="Échecs contre la mort">
                <button
                  v-for="i in 3" :key="`f-${i}`" type="button"
                  :aria-pressed="i <= state.deathSaves.failures"
                  :aria-label="`Échec ${i}`"
                  class="w-11 h-11 rounded-full border-2 border-ember-bright/70 flex items-center justify-center transition-colors"
                  :class="i <= state.deathSaves.failures ? 'bg-ember' : 'bg-transparent hover:bg-ember/10'"
                  @click="toggleDeathSaveFailure(i - 1)"
                ><span v-if="i <= state.deathSaves.failures" class="text-parchment font-bold">✗</span></button>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions dégâts / soins (Fitts : boutons larges, les plus cliqués) -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <label for="dmg-input" class="text-sm text-parchment-dim">Dégâts</label>
            <input
              id="dmg-input"
              v-model.number="damageInput"
              type="number" min="1"
              class="w-16 bg-obsidian border border-gold/40 text-parchment font-display text-base sm:text-sm px-2 py-2 text-center"
            >
            <button
              type="button"
              class="min-h-11 min-w-14 border-2 border-ember bg-blood/40 text-ember-bright font-display text-base uppercase px-3 py-2 hover:bg-blood/60 active:bg-blood/80 transition-colors"
              @click="applyDamage"
            >− HP</button>
          </div>
          <div class="flex items-center gap-2">
            <label for="heal-input" class="text-sm text-parchment-dim">Soin</label>
            <input
              id="heal-input"
              v-model.number="healInput"
              type="number" min="1"
              class="w-16 bg-obsidian border border-gold/40 text-parchment font-display text-base sm:text-sm px-2 py-2 text-center"
            >
            <button
              type="button"
              class="min-h-11 min-w-14 border-2 border-gold bg-gold/15 text-gold-bright font-display text-base uppercase px-3 py-2 hover:bg-gold/25 active:bg-gold/35 transition-colors"
              @click="applyHeal"
            >+ HP</button>
          </div>
        </div>
      </div>

      <!-- ═══ BLOC 2 — Ressources de combat (usage moyen) ═══ -->
      <div class="border border-gold/30 bg-charcoal/40 p-4 flex flex-col gap-4">
        <p class="font-display text-sm tracking-wider-4 text-gold/70 uppercase">Combat</p>

        <!-- Inspiration (toggle prominent) (Norman : affordance toggle) -->
        <button
          type="button"
          :aria-pressed="state.inspiration"
          class="w-full min-h-12 inline-flex items-center justify-center gap-2 border-2 px-4 py-2.5 font-display text-base tracking-wider-3 uppercase transition-all"
          :class="state.inspiration
            ? 'border-gold-bright bg-gold-bright text-obsidian shadow-[0_0_16px_rgba(242,208,122,0.4)]'
            : 'border-gold-bright/40 text-gold-bright hover:bg-gold-bright/10'"
          @click="toggleInspiration"
        >
          <span class="text-lg">{{ state.inspiration ? '★' : '☆' }}</span>
          Inspiration
        </button>

        <!-- Hit dice -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="font-display text-sm tracking-wider-4 text-gold/70 uppercase">Dés de vie</p>
            <p class="font-display text-2xl text-gold-bright tabular-nums">
              {{ hitDiceRemaining }}<span class="text-parchment-mute text-base">d{{ character.hitDice.die }}</span>
            </p>
          </div>
          <button
            type="button"
            :disabled="hitDiceRemaining === 0"
            class="min-h-11 border border-gold/40 bg-charcoal text-parchment-dim hover:text-gold-bright font-display text-sm uppercase px-3 py-2 disabled:opacity-30 transition-colors"
            @click="spendHitDie"
          >Dépenser</button>
        </div>
      </div>

      <!-- ═══ BLOC 3 — Stats passives (lecture seule, discret) ═══ -->
      <div class="border border-gold/20 bg-charcoal/30 p-4 flex flex-col gap-3">
        <p class="font-display text-sm tracking-wider-4 text-gold/50 uppercase">Passif</p>
        <div>
          <p class="text-xs text-parchment-mute uppercase tracking-wider-3">Maîtrise</p>
          <p class="font-display text-xl text-parchment">{{ fmtBonus(character.proficiencyBonus) }}</p>
        </div>
        <div>
          <p class="text-xs text-parchment-mute uppercase tracking-wider-3">Perception</p>
          <p class="font-display text-xl text-parchment">{{ passivePerception }}</p>
        </div>
      </div>

      <!-- ═══ BLOC 4 — Repos (usage rare, le moins proéminent) ═══ -->
      <div class="border border-gold/20 bg-charcoal/30 p-4 flex flex-col gap-3 justify-center">
        <p class="font-display text-sm tracking-wider-4 text-gold/50 uppercase">Repos</p>
        <button
          type="button"
          class="min-h-11 border border-gold/30 bg-charcoal/50 text-parchment-dim hover:text-gold-bright hover:border-gold/60 font-display text-sm tracking-wider-2 uppercase px-3 py-2 transition-colors"
          @click="doShortRest"
        >Court</button>
        <button
          type="button"
          class="min-h-11 border border-gold/40 bg-gold/10 text-gold hover:text-gold-bright hover:bg-gold/20 font-display text-sm tracking-wider-2 uppercase px-3 py-2 transition-colors"
          @click="doLongRest"
        >Long</button>
      </div>

    </div>
  </section>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
