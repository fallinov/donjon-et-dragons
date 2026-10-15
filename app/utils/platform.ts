/** iPhone / iPad (y compris iPadOS qui se présente comme un Mac tactile). */
export function isIos(): boolean {
  const ua = navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
}

/** Application ouverte depuis l'écran d'accueil (et non dans le navigateur). */
export function isStandalone(): boolean {
  const legacy = (navigator as Navigator & { standalone?: boolean }).standalone
  return legacy === true || window.matchMedia('(display-mode: standalone)').matches
}
