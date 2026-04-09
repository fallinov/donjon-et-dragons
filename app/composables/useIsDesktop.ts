import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Détecte si le viewport est >= lg (1024px).
 * SSR-safe : retourne false côté serveur.
 */
export function useIsDesktop() {
  const isDesktop = ref(false)
  let mq: MediaQueryList | null = null

  function update(e: MediaQueryListEvent | MediaQueryList): void {
    isDesktop.value = 'matches' in e ? e.matches : false
  }

  onMounted(() => {
    mq = window.matchMedia('(min-width: 1024px)')
    isDesktop.value = mq.matches
    mq.addEventListener('change', update)
  })

  onUnmounted(() => {
    mq?.removeEventListener('change', update)
  })

  return isDesktop
}
