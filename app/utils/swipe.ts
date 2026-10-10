export type SwipeAxis = 'x' | 'y' | null
export type SwipeDirection = 'left' | 'right' | null

/** Distance minimale (px) avant de décider si le geste est horizontal ou vertical. */
export const AXIS_LOCK_DISTANCE = 10
/** Distance horizontale minimale (px) pour changer d'onglet. */
export const SWIPE_THRESHOLD = 50

/**
 * Un geste commencé dans un champ de saisie sert à sélectionner ou déplacer
 * le curseur : il ne doit jamais changer d'onglet.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false
  return (target as Element).closest('input, textarea, select, [contenteditable="true"]') !== null
}

/**
 * Détermine l'axe dominant d'un geste une fois qu'il a assez bougé.
 * Retourne null tant que le mouvement est trop court pour trancher.
 */
export function detectAxis(dx: number, dy: number): SwipeAxis {
  if (Math.abs(dx) < AXIS_LOCK_DISTANCE && Math.abs(dy) < AXIS_LOCK_DISTANCE) return null
  return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
}

/**
 * Résout un geste terminé en direction de swipe.
 * Un geste verrouillé sur l'axe vertical (scroll) ne change jamais d'onglet.
 */
export function resolveSwipe(axis: SwipeAxis, dx: number, dy: number): SwipeDirection {
  if (axis !== 'x') return null
  if (Math.abs(dx) <= SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return null
  return dx > 0 ? 'right' : 'left'
}
