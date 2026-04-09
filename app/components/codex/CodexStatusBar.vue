<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
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
const isFull = computed(() => state.value.hpCurrent >= props.character.maxHp)

const toast = ref('')

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

// Repeat au maintien : accélère après 400ms, 1 par 100ms
let repeatTimer: ReturnType<typeof setTimeout> | null = null
let repeatInterval: ReturnType<typeof setInterval> | null = null

function startRepeat(action: () => void): void {
  action()
  repeatTimer = setTimeout(() => {
    repeatInterval = setInterval(action, 100)
  }, 400)
}

function stopRepeat(): void {
  if (repeatTimer) { clearTimeout(repeatTimer); repeatTimer = null }
  if (repeatInterval) { clearInterval(repeatInterval); repeatInterval = null }
}

onUnmounted(stopRepeat)
</script>

<template>
  <section
    aria-label="Tableau de bord du personnage"
    class="no-print mb-8 motion-safe:animate-rise"
  >
    <!-- Toast feedback -->
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

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(280px,2fr)_minmax(180px,1fr)_auto_auto] gap-4 xl:gap-5">

      <!-- ═══ BLOC 1 — HP (dominant) ═══ -->
      <div
        class="border border-gold/40 p-4 sm:p-5 md:col-span-2 xl:col-span-1 transition-colors"
        :class="isDown ? 'bg-blood/30 border-ember' : 'bg-charcoal/60'"
      >
        <!-- Ligne HP : bouton − | nombre | bouton + -->
        <div class="flex items-center justify-center gap-4 mb-3">
          <!-- Bouton − (dégâts) : repeat au maintien -->
          <button
            type="button"
            :disabled="isDown"
            class="h-14 w-14 rounded-full border-2 border-ember bg-blood/40 text-ember-bright flex items-center justify-center hover:bg-blood/60 active:bg-blood/80 disabled:opacity-30 transition-colors select-none"
            aria-label="Retirer 1 point de vie"
            @pointerdown.prevent="startRepeat(() => damage(1))"
            @pointerup="stopRepeat"
            @pointerleave="stopRepeat"
          ><svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg></button>

          <!-- Nombre HP central (Krug : scannable, Fitts : cible la plus grande) -->
          <div class="text-center min-w-[120px]" aria-live="polite" aria-atomic="true">
            <p class="font-display text-sm tracking-wider-4 text-gold uppercase mb-1">Points de vie</p>
            <p
              class="font-display tabular-nums leading-none"
              :class="isDown ? 'text-ember-bright' : hpPercent > 50 ? 'text-gold-bright' : hpPercent > 25 ? 'text-ember-bright' : 'text-ember'"
            >
              <span class="text-5xl sm:text-6xl">{{ state.hpCurrent }}</span>
              <span class="text-xl text-parchment-mute"> / {{ character.maxHp }}</span>
            </p>
            <p v-if="state.hpTemp > 0" class="text-sm text-gold-bright font-display mt-1">+{{ state.hpTemp }} temp</p>
          </div>

          <!-- Bouton + (soin) : repeat au maintien -->
          <button
            type="button"
            :disabled="isFull"
            class="h-14 w-14 rounded-full border-2 border-gold bg-gold/15 text-gold-bright flex items-center justify-center hover:bg-gold/25 active:bg-gold/35 disabled:opacity-30 transition-colors select-none"
            aria-label="Ajouter 1 point de vie"
            @pointerdown.prevent="startRepeat(() => heal(1))"
            @pointerup="stopRepeat"
            @pointerleave="stopRepeat"
          ><svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg></button>
        </div>

        <!-- Barre de progression HP -->
        <div
          v-if="!isDown"
          class="h-3 bg-obsidian border border-gold/30 overflow-hidden mb-3"
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

        <!-- Death saves (remplace la barre quand HP = 0) -->
        <div v-if="isDown" class="mb-3 py-3 border-y border-ember/40">
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
      </div>

      <!-- ═══ BLOC 2 — Ressources de combat ═══ -->
      <div class="border border-gold/30 bg-charcoal/40 p-4 flex flex-col gap-4">
        <p class="font-display text-sm tracking-wider-4 text-gold/70 uppercase">Combat</p>

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

      <!-- ═══ BLOC 3 — Stats passives (lecture seule) ═══ -->
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

      <!-- ═══ BLOC 4 — Repos ═══ -->
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
