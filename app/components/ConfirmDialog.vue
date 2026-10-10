<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useConfirm } from '~/composables/useConfirm'

const { request } = useConfirm()
const dialog = ref<HTMLDialogElement>()
const cancelButton = ref<HTMLButtonElement>()
const confirmButton = ref<HTMLButtonElement>()
let returnFocus: HTMLElement | null = null

watch(request, async (next) => {
  if (!next) {
    if (dialog.value?.open) dialog.value.close()
    // Safari ne rend pas le focus à la fermeture d'un <dialog>
    returnFocus?.focus()
    returnFocus = null
    return
  }
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  await nextTick()
  if (!dialog.value?.open) dialog.value?.showModal()
  ;(next.danger ? cancelButton.value : confirmButton.value)?.focus()
})

function answer(confirmed: boolean): void {
  request.value?.resolve(confirmed)
}
</script>

<template>
  <dialog
    ref="dialog"
    class="confirm-dialog font-body m-auto w-[min(100%-2rem,28rem)] border border-gold/40 bg-charcoal p-0 text-parchment shadow-[0_0_40px_rgba(0,0,0,0.8)]"
    aria-labelledby="confirm-title"
    aria-describedby="confirm-message"
    @cancel.prevent="answer(false)"
  >
    <div v-if="request" class="p-6">
      <h2 id="confirm-title" class="font-display text-lg tracking-wider-2 text-gold-bright uppercase mb-3">{{ request.title }}</h2>
      <p id="confirm-message" class="text-parchment-dim leading-snug mb-6">{{ request.message }}</p>
      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          ref="cancelButton"
          type="button"
          class="min-h-11 border border-gold/30 bg-charcoal/50 px-4 font-display text-sm tracking-wider-2 uppercase text-parchment-dim hover:text-gold-bright transition-colors"
          @click="answer(false)"
        >{{ request.cancelLabel }}</button>
        <button
          ref="confirmButton"
          type="button"
          class="min-h-11 border px-4 font-display text-sm tracking-wider-2 uppercase transition-colors"
          :class="request.danger
            ? 'border-ember bg-blood/60 text-parchment hover:bg-blood'
            : 'border-gold/50 bg-gold/15 text-gold-bright hover:bg-gold/25'"
          data-confirm
          @click="answer(true)"
        >{{ request.confirmLabel }}</button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.confirm-dialog::backdrop {
  background: rgb(11 9 7 / 0.75);
}
</style>
