<script setup lang="ts">
import { computed } from 'vue'
import { t } from '~/composables/useT'

const { $pwa } = useNuxtApp()
const visible = computed(() => Boolean($pwa?.needRefresh))

function update(): void {
  void $pwa?.updateServiceWorker(true)
}

function later(): void {
  void $pwa?.cancelPrompt()
}
</script>

<template>
  <div
    v-if="visible"
    role="status"
    aria-live="polite"
    class="fixed inset-x-4 top-3 z-50 mx-auto flex max-w-md flex-wrap items-center gap-3 border border-gold/50 bg-charcoal/95 p-3 font-body text-parchment shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md"
    data-pwa-update
  >
    <p class="min-w-0 flex-1 text-sm">{{ t('pwa.updateAvailable') }}</p>
    <div class="flex gap-2">
      <button type="button" class="min-h-11 px-3 font-display text-sm tracking-wider-2 uppercase text-parchment-dim hover:text-gold-bright" @click="later">{{ t('pwa.later') }}</button>
      <button type="button" class="min-h-11 border border-gold/60 bg-gold/15 px-3 font-display text-sm tracking-wider-2 uppercase text-gold-bright hover:bg-gold/25" @click="update">{{ t('pwa.reload') }}</button>
    </div>
  </div>
</template>
