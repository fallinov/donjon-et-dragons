<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCharacter } from '~/composables/useCharacters'
import { useCharacterDraft } from '~/composables/useCharacterDraft'
import { useLeaveGuard } from '~/composables/useLeaveGuard'
import { t } from '~/composables/useT'
import { putCharacter } from '~/db/characterRepository'
import { toStoredFromDraft } from '~/utils/characterFactory'

const route = useRoute()
const id = computed(() => route.params.id as string)
const { character, status } = useCharacter(id)
const { draft, dirty, errors, start, commit } = useCharacterDraft()
const { allowLeave } = useLeaveGuard(dirty)
const saving = ref(false)
const saveFailed = ref(false)

const fullName = computed(() => {
  const c = character.value
  return c ? `${c.firstName}${c.lastName ? ` ${c.lastName}` : ''}` : ''
})
useSeoMeta({ title: () => t('editor.seo.edit', { name: fullName.value }) })

watch(character, (loaded) => {
  if (loaded) start(loaded)
}, { immediate: true })

async function save(): Promise<void> {
  if (!draft.value || !character.value) return
  saving.value = true
  saveFailed.value = false
  try {
    await putCharacter(toStoredFromDraft(draft.value, character.value))
    commit()
    allowLeave()
    await navigateTo(`/personnages/${id.value}`, { replace: true })
  }
  catch (error) {
    console.error(error)
    saveFailed.value = true
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <main id="contenu" class="font-body text-parchment min-h-screen px-4 py-6 sm:px-8 relative z-10 max-w-4xl mx-auto">
    <NuxtLink :to="`/personnages/${id}`" class="inline-flex min-h-11 items-center gap-1 text-sm font-display tracking-wider-3 text-parchment-dim hover:text-gold-bright uppercase mb-4">
      <span aria-hidden="true">←</span> {{ fullName || t('common.back') }}
    </NuxtLink>
    <EditForm
      v-if="draft"
      v-model="draft"
      :title="t('editor.titleEdit')"
      :errors="errors"
      :saving="saving"
      :save-failed="saveFailed"
      @save="save"
      @cancel="navigateTo(`/personnages/${id}`)"
    />
    <div v-else-if="status === 'missing' || status === 'error'" class="text-center py-12">
      <p class="font-display text-xl text-gold-bright uppercase tracking-wider-2 mb-6">
        {{ t(status === 'missing' ? 'character.notFound' : 'character.loadError') }}
      </p>
      <NuxtLink to="/" class="font-display text-sm tracking-wider-3 text-parchment-dim hover:text-gold-bright uppercase">{{ t('common.back') }}</NuxtLink>
    </div>
    <p v-else class="text-parchment-mute italic">{{ t('editor.loading') }}</p>
  </main>
</template>
