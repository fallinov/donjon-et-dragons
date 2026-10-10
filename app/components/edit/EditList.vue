<script setup lang="ts" generic="T">
import { ref } from 'vue'
import { t } from '~/composables/useT'

const props = defineProps<{
  /** Libellé du bouton d'ajout. */
  addLabel: string
  /** Nom lisible d'un élément (en-tête repliable, étiquettes des boutons). */
  itemName: (item: T, index: number) => string
  /** Nouvel élément vide. */
  create: () => T
  /** Éléments repliables (listes longues) : fermés par défaut, ouverts s'ils sont nouveaux ou en erreur. */
  collapsible?: boolean
  /** Élément à un seul champ : boutons sur la même ligne. */
  inline?: boolean
  /** L'élément contient une erreur (le garder ouvert). */
  invalid?: (index: number) => boolean
}>()

const items = defineModel<T[]>({ required: true })
const opened = ref(new Set<number>())

function isOpen(index: number): boolean {
  return opened.value.has(index) || Boolean(props.invalid?.(index))
}

function onToggle(index: number, event: Event): void {
  const next = new Set(opened.value)
  if ((event.target as HTMLDetailsElement).open) next.add(index)
  else next.delete(index)
  opened.value = next
}

function add(): void {
  opened.value = new Set([...opened.value, items.value.length])
  items.value = [...items.value, props.create()]
}

function remove(index: number): void {
  // Les indices suivants se décalent d'un cran
  opened.value = new Set([...opened.value].filter(i => i !== index).map(i => i > index ? i - 1 : i))
  items.value = items.value.filter((_, i) => i !== index)
}

function move(index: number, offset: -1 | 1): void {
  const target = index + offset
  if (target < 0 || target >= items.value.length) return
  const next = [...items.value]
  ;[next[index], next[target]] = [next[target]!, next[index]!]
  const open = new Set(opened.value)
  const a = open.has(index)
  const b = open.has(target)
  open.delete(index); open.delete(target)
  if (a) open.add(target)
  if (b) open.add(index)
  opened.value = open
  items.value = next
}

function label(item: T, index: number): string {
  return props.itemName(item, index).trim() || t('editor.item', { index: index + 1 })
}
</script>

<template>
  <div>
    <p v-if="!items.length" class="text-parchment-mute italic text-sm mb-3">{{ t('editor.empty') }}</p>
    <ol v-else class="mb-3" :class="inline ? 'space-y-2' : 'space-y-3'" data-edit-list>
      <li
        v-for="(item, index) in items"
        :key="index"
        :class="inline ? '' : 'border-l-2 border-gold/40 bg-charcoal/30'"
        data-edit-item
      >
        <details v-if="collapsible" :open="isOpen(index)" class="group" @toggle="onToggle(index, $event)">
          <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 pl-3 pr-2 py-2 font-display text-base tracking-wider-2 text-parchment">
            <span class="min-w-0 truncate" :class="invalid?.(index) ? 'text-ember-light' : ''">{{ label(item, index) }}</span>
            <span class="shrink-0 text-gold motion-safe:transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
          </summary>
          <div class="border-t border-gold/15 py-2 pl-3 pr-1">
            <slot :item="item" :index="index" />
          </div>
          <div class="flex justify-end gap-1 pr-1 pb-1">
            <button type="button" class="h-11 w-11 text-gold hover:text-gold-bright disabled:opacity-25" :disabled="index === 0" :aria-label="t('editor.moveUp', { name: label(item, index) })" @click="move(index, -1)">↑</button>
            <button type="button" class="h-11 w-11 text-gold hover:text-gold-bright disabled:opacity-25" :disabled="index === items.length - 1" :aria-label="t('editor.moveDown', { name: label(item, index) })" @click="move(index, 1)">↓</button>
            <button type="button" class="h-11 w-11 text-parchment-mute hover:text-ember-light" :aria-label="t('editor.remove', { name: label(item, index) })" @click="remove(index)">✕</button>
          </div>
        </details>

        <div v-else :class="inline ? 'flex items-end gap-1' : 'py-2 pl-3 pr-1'">
          <div :class="inline ? 'min-w-0 flex-1' : ''">
            <slot :item="item" :index="index" />
          </div>
          <div class="flex shrink-0 justify-end gap-1" :class="inline ? '' : 'mt-2'">
            <button type="button" class="h-11 w-11 text-gold hover:text-gold-bright disabled:opacity-25" :disabled="index === 0" :aria-label="t('editor.moveUp', { name: label(item, index) })" @click="move(index, -1)">↑</button>
            <button type="button" class="h-11 w-11 text-gold hover:text-gold-bright disabled:opacity-25" :disabled="index === items.length - 1" :aria-label="t('editor.moveDown', { name: label(item, index) })" @click="move(index, 1)">↓</button>
            <button type="button" class="h-11 w-11 text-parchment-mute hover:text-ember-light" :aria-label="t('editor.remove', { name: label(item, index) })" @click="remove(index)">✕</button>
          </div>
        </div>
      </li>
    </ol>
    <button
      type="button"
      class="min-h-11 border border-gold/40 bg-gold/5 px-4 font-display text-sm tracking-wider-2 uppercase text-gold hover:text-gold-bright hover:bg-gold/15 transition-colors"
      @click="add"
    >+ {{ addLabel }}</button>
  </div>
</template>

<style scoped>
summary::-webkit-details-marker { display: none; }
</style>
