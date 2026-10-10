import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useConfirm } from '~/composables/useConfirm'
import { t } from '~/composables/useT'

/**
 * Demande confirmation avant de quitter une page dont le formulaire contient des
 * modifications non enregistrées (navigation dans l'app ou fermeture de l'onglet).
 */
export function useLeaveGuard(dirty: Ref<boolean>) {
  const { confirm } = useConfirm()
  let allowed = false

  onBeforeRouteLeave(async () => {
    if (allowed || !dirty.value) return true
    return confirm({
      title: t('editor.leaveTitle'),
      message: t('editor.leaveMessage'),
      confirmLabel: t('editor.leaveConfirm'),
      cancelLabel: t('editor.stay'),
      danger: true,
    })
  })

  function onBeforeUnload(event: BeforeUnloadEvent): void {
    if (allowed || !dirty.value) return
    event.preventDefault()
  }
  onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

  /** Laisse partir sans demander (après un enregistrement). */
  return { allowLeave: () => { allowed = true } }
}
