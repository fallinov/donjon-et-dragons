import { shallowRef } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  /** Action destructrice : bouton de confirmation en rouge, focus initial sur Annuler. */
  danger?: boolean
}

export interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

// Une seule demande à la fois, affichée par <ConfirmDialog> (app.vue). Rendu client uniquement.
const current = shallowRef<ConfirmRequest | null>(null)

/** Boîte de confirmation dans le style du codex, à la place de `confirm()`. */
export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    // Une demande précédente encore ouverte est annulée
    current.value?.resolve(false)
    return new Promise<boolean>((resolve) => {
      current.value = {
        ...options,
        resolve: (confirmed) => {
          current.value = null
          resolve(confirmed)
        },
      }
    })
  }
  return { request: current, confirm }
}
