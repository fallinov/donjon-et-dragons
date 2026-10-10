<script setup lang="ts">
import { computed, useId } from 'vue'
import { t, type MessageKey } from '~/composables/useT'

const props = defineProps<{
  label: string
  /** Libellé visible court (colonnes étroites) ; `label` reste le nom lu par les lecteurs d'écran. */
  short?: string
  hint?: string
  error?: MessageKey
  /** Valeurs négatives possibles : pas de pavé numérique (iOS n'y affiche pas le signe −). */
  signed?: boolean
  required?: boolean
}>()

/** Champ vide : NaN (signalé par la validation, ou traité comme « absent » par l'appelant). */
const model = defineModel<number>({ required: true })
const id = useId()

const text = computed({
  get: () => Number.isNaN(model.value) ? '' : String(model.value),
  // v-model d'un input type="number" convertit déjà en nombre (chaîne vide si champ vidé)
  set: (value: string | number) => {
    const trimmed = String(value).trim()
    model.value = trimmed === '' ? Number.NaN : Number(trimmed)
  },
})
const inputmode = computed(() => props.signed ? undefined : 'numeric')
</script>

<template>
  <div class="edit-field">
    <label :for="id" class="block font-display text-sm tracking-wider-2 text-gold uppercase mb-1">
      <template v-if="short"><span aria-hidden="true">{{ short }}</span><span class="sr-only">{{ label }}</span></template>
      <template v-else>{{ label }}</template><span v-if="required" class="text-ember-light" aria-hidden="true"> *</span>
    </label>
    <input
      :id="id"
      v-model="text"
      type="number"
      step="1"
      :inputmode="inputmode"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="[hint ? `${id}-hint` : '', error ? `${id}-error` : ''].join(' ').trim() || undefined"
      class="edit-input w-full min-h-11 px-3 tabular-nums"
    >
    <p v-if="hint" :id="`${id}-hint`" class="mt-1 text-sm text-parchment-mute italic">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="mt-1 text-sm text-ember-light" data-field-error>{{ t(error) }}</p>
  </div>
</template>
