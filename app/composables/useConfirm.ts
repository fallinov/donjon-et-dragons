import { shallowRef } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  /** Troisième choix facultatif (ex. « Importer en copie »). */
  extraLabel?: string
  /** Action destructrice : bouton de confirmation en rouge, focus initial sur Annuler. */
  danger?: boolean
}

export type ConfirmAnswer = 'confirm' | 'extra' | 'cancel'

export interface ConfirmRequest extends ConfirmOptions {
  resolve: (answer: ConfirmAnswer) => void
}

// Une seule demande à la fois, affichée par <ConfirmDialog> (app.vue). Rendu client uniquement.
const current = shallowRef<ConfirmRequest | null>(null)

/** Boîte de confirmation dans le style du codex, à la place de `confirm()`. */
export function useConfirm() {
  /** Demande à choix multiple : confirmer, choix supplémentaire ou annuler. */
  function choose(options: ConfirmOptions): Promise<ConfirmAnswer> {
    // Une demande précédente encore ouverte est annulée
    current.value?.resolve('cancel')
    return new Promise<ConfirmAnswer>((resolve) => {
      current.value = {
        ...options,
        resolve: (answer) => {
          current.value = null
          resolve(answer)
        },
      }
    })
  }

  async function confirm(options: ConfirmOptions): Promise<boolean> {
    return (await choose(options)) === 'confirm'
  }

  return { request: current, confirm, choose }
}
