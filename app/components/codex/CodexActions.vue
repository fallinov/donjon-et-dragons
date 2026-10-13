<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import type { Character } from '~~/shared/types/character'
import { useConfirm } from '~/composables/useConfirm'
import { t, type MessageKey } from '~/composables/useT'
import { getSeed } from '~/data/characters'
import { deleteCharacter, getCharacterBundle } from '~/db/characterRepository'
import { fetchPortrait, restoreBuiltin } from '~/db/seed'
import { characterFileName, serializeCharacter } from '~/utils/characterFile'
import { canShareFiles, downloadFile, shareOrDownload } from '~/utils/share'

const props = defineProps<{ character: Character }>()
const { confirm } = useConfirm()

const menuId = useId()
const open = ref(false)
const root = ref<HTMLElement>()
const toggle = ref<HTMLButtonElement>()
const status = ref<MessageKey>()
let statusTimer: ReturnType<typeof setTimeout> | undefined

const shareSupported = ref(false)
const seed = computed(() => getSeed(props.character.id))
const fullName = computed(() => `${props.character.firstName}${props.character.lastName ? ` ${props.character.lastName}` : ''}`.trim() || t('actions.unnamed'))

function announce(message: MessageKey): void {
  status.value = message
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => { status.value = undefined }, 4000)
}

function close(restoreFocus = false): void {
  open.value = false
  if (restoreFocus) void nextTick(() => toggle.value?.focus())
}

function onDocumentClick(event: MouseEvent): void {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close()
}

function onKeydown(event: KeyboardEvent): void {
  if (open.value && event.key === 'Escape') close(true)
}

onMounted(() => {
  shareSupported.value = canShareFiles()
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
  clearTimeout(statusTimer)
})

async function buildFile(): Promise<File | null> {
  const bundle = await getCharacterBundle(props.character.id)
  if (!bundle) return null
  const json = JSON.stringify(serializeCharacter(bundle.character, bundle))
  return new File([json], characterFileName(bundle.character), { type: 'application/json' })
}

async function share(): Promise<void> {
  close()
  const file = await buildFile()
  if (!file) return announce('actions.exportError')
  const outcome = await shareOrDownload(file, fullName.value)
  if (outcome === 'shared') announce('actions.shared')
  else if (outcome === 'downloaded') announce('actions.exported')
}

async function exportFile(): Promise<void> {
  close()
  const file = await buildFile()
  if (!file) return announce('actions.exportError')
  downloadFile(file)
  announce('actions.exported')
}

async function restore(): Promise<void> {
  close()
  if (!seed.value) return
  const confirmed = await confirm({
    title: t('actions.restoreTitle'),
    message: t('actions.restoreMessage', { name: fullName.value }),
    confirmLabel: t('actions.restoreConfirm'),
    cancelLabel: t('actions.cancel'),
    danger: true,
  })
  if (!confirmed) return
  await restoreBuiltin(seed.value, fetchPortrait)
  // Rechargement complet : l'état de jeu gardé en mémoire repart des valeurs d'origine
  window.location.reload()
}

async function remove(): Promise<void> {
  close()
  const confirmed = await confirm({
    title: t('actions.deleteTitle'),
    message: t('actions.deleteMessage', { name: fullName.value }),
    confirmLabel: t('actions.deleteConfirm'),
    cancelLabel: t('actions.cancel'),
    danger: true,
  })
  if (!confirmed) return
  await deleteCharacter(props.character.id)
  await navigateTo('/', { replace: true })
}

const itemClass = 'flex min-h-11 w-full items-center px-4 text-left font-display text-sm tracking-wider-2 uppercase hover:bg-gold/10 transition-colors'
</script>

<template>
  <div ref="root" class="no-print relative flex items-center gap-2" role="group" :aria-label="t('actions.label')">
    <NuxtLink
      :to="`/personnages/${character.id}/modifier`"
      class="inline-flex min-h-11 items-center border border-gold/40 bg-charcoal/60 px-3 font-display text-sm tracking-wider-2 uppercase text-gold hover:text-gold-bright hover:border-gold transition-colors"
    >{{ t('actions.edit') }}</NuxtLink>
    <button
      ref="toggle"
      type="button"
      class="inline-flex h-11 w-11 items-center justify-center border border-gold/40 bg-charcoal/60 text-xl text-gold hover:text-gold-bright hover:border-gold transition-colors"
      :aria-expanded="open"
      :aria-controls="menuId"
      :aria-label="t('actions.more')"
      data-actions-toggle
      @click="open = !open"
    ><span aria-hidden="true">⋯</span></button>

    <div
      v-show="open"
      :id="menuId"
      class="absolute right-0 top-full z-40 mt-1 w-64 border border-gold/40 bg-charcoal py-1 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
      data-actions-menu
    >
      <button v-if="shareSupported" type="button" :class="[itemClass, 'text-gold-bright']" @click="share">{{ t('actions.share') }}</button>
      <button type="button" :class="[itemClass, 'text-gold-bright']" @click="exportFile">{{ t('actions.export') }}</button>
      <button v-if="seed" type="button" :class="[itemClass, 'text-parchment']" @click="restore">{{ t('actions.restore') }}</button>
      <button type="button" :class="[itemClass, 'border-t border-gold/20 text-ember-light']" @click="remove">{{ t('actions.delete') }}</button>
    </div>

    <p
      role="status"
      aria-live="polite"
      class="absolute right-0 top-full z-30 mt-1 w-64 text-right text-sm text-gold-bright"
      :class="{ 'sr-only': !status || open }"
    >{{ status ? t(status) : '' }}</p>
  </div>
</template>
