<script setup lang="ts">
import { nextTick, onMounted, ref, useId, watch } from 'vue'
import { sendCharacter, type SentTransfer } from '~/composables/useTransfer'
import { t, type MessageKey } from '~/composables/useT'
import { formatCode } from '~/utils/transferCode'

const props = defineProps<{ characterId: string, name: string }>()
const open = defineModel<boolean>('open', { required: true })

const titleId = useId()
const dialog = ref<HTMLDialogElement>()
const closeButton = ref<HTMLButtonElement>()
const sending = ref(false)
const sent = ref<SentTransfer>()
const error = ref<MessageKey>()
const status = ref<MessageKey>()
const canShareLink = ref(false)
let returnFocus: HTMLElement | null = null

onMounted(() => {
  canShareLink.value = typeof navigator.share === 'function'
})

async function send(): Promise<void> {
  // Boîte refermée puis rouverte pendant un envoi : on attend celui en cours, sans second code
  if (sending.value) return
  sending.value = true
  sent.value = undefined
  error.value = undefined
  status.value = undefined
  try {
    const result = await sendCharacter(props.characterId)
    if (result.ok) sent.value = result.value
    else error.value = result.error
  }
  catch (cause) {
    console.error(cause)
    error.value = 'transfer.error.failed'
  }
  finally {
    sending.value = false
  }
}

watch(open, async (isOpen) => {
  if (!isOpen) {
    if (dialog.value?.open) dialog.value.close()
    // Safari ne rend pas le focus à la fermeture d'un <dialog>
    returnFocus?.focus()
    returnFocus = null
    return
  }
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  await nextTick()
  // Fermée entre-temps (double appui rapide) : ne pas la rouvrir
  if (!open.value) return
  if (!dialog.value?.open) dialog.value?.showModal()
  closeButton.value?.focus()
  await send()
})

function close(): void {
  open.value = false
}

const formatExpiry = (iso: string): string =>
  new Date(iso).toLocaleString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

/** Le code reste après le `#` : jamais envoyé au serveur. */
const receiveLink = (code: string): string => `${window.location.origin}/recevoir#${code}`

async function copy(text: string, done: MessageKey): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    status.value = done
  }
  catch {
    status.value = 'transfer.copyFailed'
  }
}

async function shareLink(): Promise<void> {
  if (!sent.value) return
  const url = receiveLink(sent.value.code)
  if (!canShareLink.value) return copy(url, 'transfer.linkCopied')
  try {
    await navigator.share({
      title: t('transfer.title', { name: props.name }),
      text: t('transfer.shareText', { name: props.name, code: formatCode(sent.value.code) }),
      url,
    })
  }
  catch (cause) {
    // Partage annulé : rien à faire ; refusé : on copie le lien
    if (!(cause instanceof DOMException && cause.name === 'AbortError')) await copy(url, 'transfer.linkCopied')
  }
}

const buttonClass = 'min-h-11 border px-4 font-display text-sm tracking-wider-2 uppercase transition-colors'
</script>

<template>
  <dialog
    ref="dialog"
    class="transfer-dialog font-body m-auto w-[min(100%-2rem,28rem)] border border-gold/40 bg-charcoal p-0 text-parchment shadow-[0_0_40px_rgba(0,0,0,0.8)]"
    :aria-labelledby="titleId"
    :aria-busy="sending"
    data-transfer-dialog
    @cancel.prevent="close"
  >
    <div v-if="open" class="p-6">
      <h2 :id="titleId" class="font-display text-lg tracking-wider-2 text-gold-bright uppercase mb-4">{{ t('transfer.title', { name }) }}</h2>

      <p v-if="sending" role="status" class="text-parchment-dim italic mb-6">{{ t('transfer.sending') }}</p>

      <template v-else-if="sent">
        <p class="text-sm text-parchment-dim mb-1">{{ t('transfer.codeLabel') }}</p>
        <p class="font-display text-[clamp(2rem,10vw,2.75rem)] leading-tight tracking-wider-2 text-gold-bright mb-3" data-transfer-code>{{ formatCode(sent.code) }}</p>
        <p class="text-parchment leading-snug mb-2">{{ t('transfer.instructions') }}</p>
        <p class="text-sm text-parchment-dim mb-2">{{ t('transfer.expires', { date: formatExpiry(sent.expiresAt) }) }}</p>
        <p class="text-sm text-parchment-dim mb-5">{{ t('transfer.privacy') }}</p>
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            :class="[buttonClass, 'border-gold/50 bg-gold/15 text-gold-bright hover:bg-gold/25']"
            @click="copy(formatCode(sent.code), 'transfer.codeCopied')"
          >{{ t('transfer.copyCode') }}</button>
          <button
            type="button"
            :class="[buttonClass, 'border-gold/50 bg-charcoal text-gold-bright hover:bg-gold/15']"
            @click="shareLink"
          >{{ t(canShareLink ? 'transfer.shareLink' : 'transfer.copyLink') }}</button>
        </div>
      </template>

      <template v-else-if="error">
        <p role="alert" class="text-ember-light leading-snug mb-5" data-transfer-error>{{ t(error) }}</p>
        <button
          type="button"
          :class="[buttonClass, 'border-gold/50 bg-gold/15 text-gold-bright hover:bg-gold/25']"
          @click="send"
        >{{ t('transfer.retry') }}</button>
      </template>

      <p role="status" aria-live="polite" class="mt-3 min-h-5 text-sm text-gold-bright">{{ status ? t(status) : '' }}</p>

      <div class="mt-3 flex justify-end">
        <button
          ref="closeButton"
          type="button"
          :class="[buttonClass, 'border-gold/30 bg-charcoal/50 text-parchment-dim hover:text-gold-bright']"
          @click="close"
        >{{ t('transfer.close') }}</button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.transfer-dialog::backdrop {
  background: rgb(11 9 7 / 0.75);
}
</style>
