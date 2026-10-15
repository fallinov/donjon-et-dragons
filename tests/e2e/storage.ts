import type { Page } from '@playwright/test'

/**
 * PV enregistrés dans IndexedDB pour cette fiche (store `states`), ou null.
 * À attendre avant un rechargement : une écriture encore en cours serait abandonnée (#51).
 */
export function savedHp(page: Page, id: string): Promise<number | null> {
  return page.evaluate(id => new Promise<number | null>((resolve) => {
    const open = indexedDB.open('codex')
    open.onerror = () => resolve(null)
    open.onsuccess = () => {
      const db = open.result
      const request = db.transaction('states').objectStore('states').get(id)
      request.onsuccess = () => {
        db.close()
        resolve((request.result as { hpCurrent?: number } | undefined)?.hpCurrent ?? null)
      }
      request.onerror = () => {
        db.close()
        resolve(null)
      }
    }
  }), id)
}
