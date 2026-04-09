<script setup lang="ts">
import { onUnmounted } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  suffix?: string
  disableMinus?: boolean
  disablePlus?: boolean
  colorClass?: string
  repeat?: boolean
}>()

const emit = defineEmits<{
  minus: []
  plus: []
}>()

// Repeat au maintien (optionnel, activé pour les HP)
let repeatTimer: ReturnType<typeof setTimeout> | null = null
let repeatInterval: ReturnType<typeof setInterval> | null = null

function startMinus(): void {
  emit('minus')
  if (props.repeat) {
    repeatTimer = setTimeout(() => {
      repeatInterval = setInterval(() => emit('minus'), 100)
    }, 400)
  }
}

function startPlus(): void {
  emit('plus')
  if (props.repeat) {
    repeatTimer = setTimeout(() => {
      repeatInterval = setInterval(() => emit('plus'), 100)
    }, 400)
  }
}

function stopRepeat(): void {
  if (repeatTimer) { clearTimeout(repeatTimer); repeatTimer = null }
  if (repeatInterval) { clearInterval(repeatInterval); repeatInterval = null }
}

onUnmounted(stopRepeat)
</script>

<template>
  <div class="border border-gold/40 bg-charcoal/60 p-4">
    <div class="flex items-center justify-between">
      <!-- Bouton − -->
      <button
        type="button"
        :disabled="disableMinus"
        class="h-14 w-14 shrink-0 rounded-full border-2 border-gold/50 bg-gold/10 text-gold-bright flex items-center justify-center hover:bg-gold/20 active:bg-gold/30 disabled:opacity-30 transition-colors select-none"
        :aria-label="`Diminuer ${label.toLowerCase()}`"
        @pointerdown.prevent="startMinus"
        @pointerup="stopRepeat"
        @pointerleave="stopRepeat"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </button>

      <!-- Nombre central -->
      <div class="text-center flex-1">
        <p class="font-display text-sm tracking-wider-4 text-gold uppercase mb-1">{{ label }}</p>
        <p class="font-display text-5xl tabular-nums leading-none" :class="colorClass ?? 'text-gold-bright'">
          {{ value }}<span v-if="suffix" class="text-parchment-mute text-2xl">{{ suffix }}</span>
        </p>
        <slot />
      </div>

      <!-- Bouton + -->
      <button
        type="button"
        :disabled="disablePlus"
        class="h-14 w-14 shrink-0 rounded-full border-2 border-gold/50 bg-gold/10 text-gold-bright flex items-center justify-center hover:bg-gold/20 active:bg-gold/30 disabled:opacity-30 transition-colors select-none"
        :aria-label="`Augmenter ${label.toLowerCase()}`"
        @pointerdown.prevent="startPlus"
        @pointerup="stopRepeat"
        @pointerleave="stopRepeat"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </button>
    </div>
    <!-- Slot pour contenu supplémentaire (barre HP, death saves) -->
    <slot name="below" />
  </div>
</template>
