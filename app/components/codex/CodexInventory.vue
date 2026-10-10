<script setup lang="ts">
import { ref } from 'vue'
import type { Character } from '~~/shared/types/character'
import { COIN_TYPES, useInventory, type CoinType } from '~/composables/useInventory'

const props = defineProps<{ character: Character }>()
const { state, add, remove, setQuantity, setCoin, setNotes } = useInventory(props.character)

const COIN_LABELS: Record<CoinType, { short: string, long: string }> = {
  cp: { short: 'PC', long: 'Pièces de cuivre' },
  sp: { short: 'PA', long: "Pièces d'argent" },
  ep: { short: 'PE', long: "Pièces d'électrum" },
  gp: { short: 'PO', long: "Pièces d'or" },
  pp: { short: 'PP', long: 'Pièces de platine' },
}

const newName = ref('')
const newQuantity = ref(1)

function submitItem(): void {
  if (!newName.value.trim()) return
  add(newName.value, newQuantity.value)
  newName.value = ''
  newQuantity.value = 1
}

function onCoinInput(type: CoinType, event: Event): void {
  setCoin(type, Number((event.target as HTMLInputElement).value))
}

function onNotesInput(event: Event): void {
  setNotes((event.target as HTMLTextAreaElement).value)
}

const inputId = (suffix: string): string => `${props.character.slug}-${suffix}`
</script>

<template>
  <div class="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-10">
    <!-- ═══ Argent ═══ -->
    <section :aria-labelledby="inputId('argent-title')">
      <h3 :id="inputId('argent-title')" class="font-display text-xs tracking-wider-3 text-gold/60 uppercase mb-3">Argent</h3>
      <div class="grid grid-cols-5 gap-2">
        <div v-for="type in COIN_TYPES" :key="type" class="flex flex-col items-center gap-1">
          <label
            :for="inputId(`coin-${type}`)"
            class="font-display text-xs tracking-wider-2 text-gold"
            :title="COIN_LABELS[type].long"
          >
            {{ COIN_LABELS[type].short }}<span class="sr-only"> — {{ COIN_LABELS[type].long }}</span>
          </label>
          <input
            :id="inputId(`coin-${type}`)"
            type="number"
            inputmode="numeric"
            min="0"
            :value="state.coins[type]"
            class="w-full min-h-11 bg-charcoal border border-gold/30 text-center text-base text-parchment font-display focus:outline-none focus:border-gold-bright"
            :data-coin="type"
            @change="onCoinInput(type, $event)"
          >
        </div>
      </div>
    </section>

    <!-- ═══ Équipement ═══ -->
    <section :aria-labelledby="inputId('equipement-title')">
      <h3 :id="inputId('equipement-title')" class="font-display text-xs tracking-wider-3 text-gold/60 uppercase mb-3">Équipement</h3>
      <p v-if="!state.items.length" class="text-parchment-mute italic text-sm mb-3">Le sac est vide.</p>
      <ul v-else class="mb-4" data-inventory-items>
        <li
          v-for="item in state.items"
          :key="item.id"
          class="flex items-center gap-2 py-1.5 border-b border-gold/5 last:border-0"
        >
          <span class="flex-1 min-w-0 text-parchment-dim">{{ item.name }}</span>
          <div class="flex items-center shrink-0" role="group" :aria-label="`Quantité de ${item.name}`">
            <button
              type="button"
              class="h-11 w-9 text-gold hover:text-gold-bright text-lg"
              :aria-label="`Diminuer la quantité : ${item.name}`"
              @click="setQuantity(item.id, item.quantity - 1)"
            >−</button>
            <span class="w-7 text-center font-display text-sm text-parchment" data-item-quantity>{{ item.quantity }}</span>
            <button
              type="button"
              class="h-11 w-9 text-gold hover:text-gold-bright text-lg"
              :aria-label="`Augmenter la quantité : ${item.name}`"
              @click="setQuantity(item.id, item.quantity + 1)"
            >+</button>
          </div>
          <button
            type="button"
            class="h-11 w-9 shrink-0 text-parchment-mute hover:text-ember-bright"
            :aria-label="`Supprimer ${item.name} du sac`"
            @click="remove(item.id)"
          >
            <svg class="w-4 h-4 mx-auto" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
          </button>
        </li>
      </ul>

      <form class="flex gap-2" @submit.prevent="submitItem">
        <label :for="inputId('new-item')" class="sr-only">Nom de l'objet</label>
        <input
          :id="inputId('new-item')"
          v-model="newName"
          type="text"
          placeholder="Nouvel objet"
          autocomplete="off"
          class="flex-1 min-w-0 min-h-11 bg-charcoal border border-gold/30 px-3 text-base text-parchment placeholder:text-parchment-mute focus:outline-none focus:border-gold-bright"
        >
        <label :for="inputId('new-quantity')" class="sr-only">Quantité</label>
        <input
          :id="inputId('new-quantity')"
          v-model.number="newQuantity"
          type="number"
          inputmode="numeric"
          min="1"
          class="w-16 min-h-11 bg-charcoal border border-gold/30 text-center text-base text-parchment focus:outline-none focus:border-gold-bright"
        >
        <button
          type="submit"
          :disabled="!newName.trim()"
          class="shrink-0 min-h-11 border border-gold/30 bg-gold/5 text-gold hover:text-gold-bright hover:bg-gold/15 disabled:opacity-30 font-display text-xs tracking-wider-2 uppercase px-3 transition-colors"
        >Ajouter</button>
      </form>
    </section>

    <!-- ═══ Notes ═══ -->
    <section>
      <h3 class="font-display text-xs tracking-wider-3 text-gold/60 uppercase mb-3">
        <label :for="inputId('notes')">Notes</label>
      </h3>
      <textarea
        :id="inputId('notes')"
        :value="state.notes"
        rows="6"
        placeholder="Quêtes, PNJ, indices…"
        class="w-full bg-charcoal border border-gold/30 p-3 text-base text-parchment leading-snug placeholder:text-parchment-mute focus:outline-none focus:border-gold-bright"
        @input="onNotesInput"
      />
      <p class="mt-1 text-xs text-parchment-mute italic">Enregistré sur cet appareil uniquement.</p>
    </section>
  </div>
</template>
