/** Fenêtre des limites d'essais : une heure, alignée sur l'heure pleine. */
export const RATE_WINDOW_MS = 60 * 60 * 1000

/** Début de la fenêtre de limitation contenant `now`. */
export function rateWindow(now: Date): Date {
  return new Date(Math.floor(now.getTime() / RATE_WINDOW_MS) * RATE_WINDOW_MS)
}
