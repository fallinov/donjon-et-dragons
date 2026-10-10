<script setup lang="ts">
import type { Character } from '~~/shared/types/character'
import { useConfirm } from '~/composables/useConfirm'
import { t } from '~/composables/useT'
import { deleteCharacter } from '~/db/characterRepository'

const props = defineProps<{ character: Character }>()
const { confirm } = useConfirm()

async function remove(): Promise<void> {
  const name = `${props.character.firstName}${props.character.lastName ? ` ${props.character.lastName}` : ''}`.trim()
  const confirmed = await confirm({
    title: t('actions.deleteTitle'),
    message: t('actions.deleteMessage', { name: name || t('actions.unnamed') }),
    confirmLabel: t('actions.deleteConfirm'),
    cancelLabel: t('actions.cancel'),
    danger: true,
  })
  if (!confirmed) return
  await deleteCharacter(props.character.id)
  await navigateTo('/', { replace: true })
}
</script>

<template>
  <div class="no-print flex items-center gap-2" role="group" :aria-label="t('actions.label')">
    <NuxtLink
      :to="`/personnages/${character.id}/modifier`"
      class="inline-flex min-h-11 items-center border border-gold/40 bg-charcoal/60 px-3 font-display text-xs tracking-wider-2 uppercase text-gold hover:text-gold-bright hover:border-gold transition-colors"
    >{{ t('actions.edit') }}</NuxtLink>
    <button
      type="button"
      class="inline-flex min-h-11 items-center border border-ember/50 bg-charcoal/60 px-3 font-display text-xs tracking-wider-2 uppercase text-ember-bright hover:bg-blood/40 transition-colors"
      @click="remove"
    >{{ t('actions.delete') }}</button>
  </div>
</template>
