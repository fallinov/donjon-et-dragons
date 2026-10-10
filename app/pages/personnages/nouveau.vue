<script setup lang="ts">
import { ref } from 'vue'
import { useCharacterDraft } from '~/composables/useCharacterDraft'
import { useLeaveGuard } from '~/composables/useLeaveGuard'
import { t } from '~/composables/useT'
import { putCharacter } from '~/db/characterRepository'
import { fetchPortrait } from '~/db/seed'
import { createBlankCharacter, PLACEHOLDER_PORTRAIT_SRC, toStoredFromDraft } from '~/utils/characterFactory'
import { newId } from '~/utils/newId'

useSeoMeta({ title: t('editor.seo.new') })

const { draft, dirty, errors, start, commit } = useCharacterDraft()
const { allowLeave } = useLeaveGuard(dirty)
const status = ref<'pending' | 'ready' | 'error'>('pending')
const saving = ref(false)
const saveFailed = ref(false)

fetchPortrait(PLACEHOLDER_PORTRAIT_SRC)
  .then((portrait) => {
    start(createBlankCharacter(newId(), portrait))
    status.value = 'ready'
  })
  .catch((error) => {
    console.error(error)
    status.value = 'error'
  })

async function save(): Promise<void> {
  if (!draft.value) return
  saving.value = true
  saveFailed.value = false
  try {
    const stored = toStoredFromDraft(draft.value, undefined)
    await putCharacter(stored)
    commit()
    allowLeave()
    await navigateTo(`/personnages/${stored.id}`, { replace: true })
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
  <main id="contenu" class="font-body text-parchment min-h-screen px-4 pt-2 pb-6 sm:px-8 sm:py-6 relative z-10 max-w-4xl mx-auto">
    <NuxtLink to="/" class="inline-flex min-h-11 items-center gap-1 text-sm font-display tracking-wider-3 text-parchment-dim hover:text-gold-bright uppercase mb-4">
      <span aria-hidden="true">←</span> {{ t('common.back') }}
    </NuxtLink>
    <EditForm
      v-if="draft"
      v-model="draft"
      :title="t('editor.titleNew')"
      :errors="errors"
      :saving="saving"
      :save-failed="saveFailed"
      @save="save"
      @cancel="navigateTo('/')"
    />
    <p v-else-if="status === 'error'" role="alert" class="text-ember-light">{{ t('home.loadError') }}</p>
    <p v-else class="text-parchment-mute italic">{{ t('editor.loading') }}</p>
  </main>
</template>
