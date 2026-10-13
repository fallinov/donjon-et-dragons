export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled'

/** Le navigateur sait partager des fichiers (menu natif : Mail, Messages, WhatsApp, Fichiers…). */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false
  try {
    return navigator.canShare({ files: [new File(['{}'], 'test.json', { type: 'application/json' })] })
  }
  catch {
    return false
  }
}

/** Télécharge le fichier (export). */
export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  // Laisse le temps au téléchargement de démarrer
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Ouvre le menu de partage natif ; à défaut, télécharge le fichier. */
export async function shareOrDownload(file: File, title: string): Promise<ShareOutcome> {
  if (canShareFiles()) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    }
    catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      // Partage refusé (ex. type de fichier) : on retombe sur le téléchargement
    }
  }
  downloadFile(file)
  return 'downloaded'
}
