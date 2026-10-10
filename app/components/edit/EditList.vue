<script setup lang="ts" generic="T">
import { t } from '~/composables/useT'

const props = defineProps<{
  /** Libellé du bouton d'ajout. */
  addLabel: string
  /** Nom lisible d'un élément (étiquettes des boutons). */
  itemName: (item: T, index: number) => string
  /** Nouvel élément vide. */
  create: () => T
}>()

const items = defineModel<T[]>({ required: true })

function add(): void {
  items.value = [...items.value, props.create()]
}

function remove(index: number): void {
  items.value = items.value.filter((_, i) => i !== index)
}

function move(index: number, offset: -1 | 1): void {
  const target = index + offset
  if (target < 0 || target >= items.value.length) return
  const next = [...items.value]
  ;[next[index], next[target]] = [next[target]!, next[index]!]
  items.value = next
}

function label(item: T, index: number): string {
  return props.itemName(item, index).trim() || t('editor.item', { index: index + 1 })
}
</script>

<template>
  <div>
    <p v-if="!items.length" class="text-parchment-mute italic text-sm mb-3">{{ t('editor.empty') }}</p>
    <ol v-else class="space-y-3 mb-3" data-edit-list>
      <li
        v-for="(item, index) in items"
        :key="index"
        class="border border-gold/25 bg-charcoal/40 p-3"
        data-edit-item
      >
        <slot :item="item" :index="index" />
        <div class="mt-2 flex justify-end gap-1">
          <button
            type="button"
            class="h-11 w-11 text-gold hover:text-gold-bright disabled:opacity-25"
            :disabled="index === 0"
            :aria-label="t('editor.moveUp', { name: label(item, index) })"
            @click="move(index, -1)"
          >↑</button>
          <button
            type="button"
            class="h-11 w-11 text-gold hover:text-gold-bright disabled:opacity-25"
            :disabled="index === items.length - 1"
            :aria-label="t('editor.moveDown', { name: label(item, index) })"
            @click="move(index, 1)"
          >↓</button>
          <button
            type="button"
            class="h-11 w-11 text-parchment-mute hover:text-ember-bright"
            :aria-label="t('editor.remove', { name: label(item, index) })"
            @click="remove(index)"
          >✕</button>
        </div>
      </li>
    </ol>
    <button
      type="button"
      class="min-h-11 border border-gold/40 bg-gold/5 px-4 font-display text-xs tracking-wider-2 uppercase text-gold hover:text-gold-bright hover:bg-gold/15 transition-colors"
      @click="add"
    >+ {{ addLabel }}</button>
  </div>
</template>
