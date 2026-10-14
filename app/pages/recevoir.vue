<script setup lang="ts">
import { onMounted, ref, useId } from 'vue'
import { importCharacter, useImportConflict } from '~/composables/useCharacterImport'
import { receiveCharacter } from '~/composables/useTransfer'
import { t, type MessageKey } from '~/composables/useT'
import { isIos, isStandalone } from '~/utils/platform'
import { formatCode, isValidCode, normalizeCode } from '~/utils/transferCode'

useSeoMeta({ title: t('transfer.receive.seo') })

const inputId = useId()
const code = ref('')
const receiving = ref(false)
const error = ref<MessageKey>()
const copied = ref<MessageKey>()
// iPhone dans Safari : l'app installée a son propre stockage, la fiche reçue ici n'y apparaîtrait pas
const iosBrowser = ref(false)
const resolveConflict = useImportConflict()

onMounted(() => {
  iosBrowser.value = isIos() && !isStandalone()
  // Lien partagé : /recevoir#K7P4QX9M (le code ne quitte jamais le téléphone)
  const fromLink = normalizeCode(decodeURIComponent(window.location.hash.slice(1)))
  if (isValidCode(fromLink)) code.value = formatCode(fromLink)
})

async function receive(): Promise<void> {
  if (receiving.value) return
  receiving.value = true
  error.value = undefined
  try {
    const result = await receiveCharacter(code.value)
    if (!result.ok) {
      error.value = result.error
      return
    }
    const id = await importCharacter(result.value, resolveConflict)
    if (id) await navigateTo(`/personnages/${id}`, { replace: true })
  }
  catch (cause) {
    console.error(cause)
    error.value = 'transfer.error.failed'
  }
  finally {
    receiving.value = false
  }
}

async function copyCode(): Promise<void> {
  try {
    await navigator.clipboard.writeText(code.value)
    copied.value = 'transfer.codeCopied'
  }
  catch {
    copied.value = 'transfer.copyFailed'
  }
}

const buttonClass = 'min-h-11 border px-5 font-display text-sm tracking-wider-2 uppercase transition-colors'
</script>

<template>
  <main id="contenu" class="font-body text-parchment min-h-screen px-4 py-10 sm:px-8 sm:py-16 relative z-10">
    <div class="mx-auto max-w-md">
      <NuxtLink to="/" class="inline-flex min-h-11 items-center font-display text-sm tracking-wider-2 uppercase text-gold hover:text-gold-bright">
        <span aria-hidden="true" class="mr-2">←</span>{{ t('transfer.receive.back') }}
      </NuxtLink>

      <h1 class="mt-4 mb-3 font-display uppercase tracking-wider-2 font-normal text-gold-bright text-[clamp(1.75rem,6vw,2.5rem)]">
        {{ t('transfer.receive.title') }}
      </h1>
      <p class="text-parchment-dim leading-snug mb-6">{{ t('transfer.receive.intro') }}</p>

      <aside
        v-if="iosBrowser && isValidCode(normalizeCode(code))"
        class="mb-6 border border-gold/40 bg-charcoal/60 p-4"
        :aria-label="t('transfer.receive.iosTitle')"
        data-ios-standalone-hint
      >
        <p class="font-display text-sm tracking-wider-3 text-gold-bright uppercase mb-2">{{ t('transfer.receive.iosTitle') }}</p>
        <p class="text-parchment leading-snug mb-3">{{ t('transfer.receive.iosText') }}</p>
        <p class="font-display text-3xl tracking-wider-2 text-gold-bright mb-3">{{ formatCode(normalizeCode(code)) }}</p>
        <button type="button" :class="[buttonClass, 'border-gold/50 bg-gold/15 text-gold-bright hover:bg-gold/25']" @click="copyCode">{{ t('transfer.copyCode') }}</button>
        <p role="status" aria-live="polite" class="mt-2 min-h-5 text-sm text-gold-bright">{{ copied ? t(copied) : '' }}</p>
        <p class="mt-2 text-sm text-parchment-dim">{{ t('transfer.receive.iosSafari') }}</p>
      </aside>

      <form novalidate @submit.prevent="receive">
        <label :for="inputId" class="block font-display text-sm tracking-wider-2 text-gold uppercase mb-1">{{ t('transfer.receive.codeLabel') }}</label>
        <input
          :id="inputId"
          v-model="code"
          type="text"
          inputmode="text"
          autocomplete="off"
          autocapitalize="characters"
          autocorrect="off"
          spellcheck="false"
          maxlength="20"
          placeholder="K7P4-QX9M"
          class="edit-input w-full min-h-11 px-3 font-display text-2xl tracking-wider-2 uppercase"
          :aria-invalid="error ? 'true' : undefined"
          :aria-describedby="error ? `${inputId}-error` : undefined"
          data-receive-code
        >
        <p v-if="error" :id="`${inputId}-error`" role="alert" class="mt-3 text-ember-light leading-snug" data-receive-error>{{ t(error) }}</p>
        <p v-if="receiving" role="status" class="mt-3 text-parchment-dim italic">{{ t('transfer.receive.loading') }}</p>
        <button
          type="submit"
          :class="[buttonClass, 'mt-5 w-full border-gold/50 bg-gold/15 text-gold-bright hover:bg-gold/25 disabled:opacity-50']"
          :disabled="receiving"
        >{{ t(iosBrowser ? 'transfer.receive.submitHere' : 'transfer.receive.submit') }}</button>
      </form>
    </div>
  </main>
</template>
