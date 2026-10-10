import { onScopeDispose, watch, type Ref } from 'vue'
import { toPlain } from '~/utils/toPlain'

interface SyncRecord {
  loaded: boolean
  timer: ReturnType<typeof setTimeout> | null
  flush: () => void
}

// Une synchronisation par état partagé (`useState`), même si plusieurs composants l'utilisent
const records = new WeakMap<Ref<unknown>, SyncRecord>()

export interface PersistOptions<T> {
  /** Lit la valeur enregistrée. `undefined` : rien d'enregistré (ou illisible), l'état par défaut est gardé. */
  load: () => Promise<T | undefined>
  save: (value: T) => Promise<void>
  /**
   * Délai de regroupement des écritures, en ms. Par défaut 0 : écriture à chaque
   * changement, car une écriture différée lancée pendant la fermeture de la page
   * est abandonnée par le navigateur (vérifié en e2e). Une écriture coûte moins
   * d'une milliseconde, même à 10 par seconde pendant un appui long.
   */
  delay?: number
}

/**
 * Synchronise un état réactif avec un stockage asynchrone : chargement unique,
 * écriture à chaque changement (ou regroupée si `delay` > 0, avec écriture
 * immédiate en quittant la page ou le composant).
 * Tant que le chargement n'est pas terminé, rien n'est écrit (l'état par défaut
 * n'écrase jamais une valeur enregistrée). En cas d'erreur de stockage, l'état
 * reste utilisable en mémoire.
 */
export function persistState<T>(state: Ref<T>, options: PersistOptions<T>): void {
  const key = state as Ref<unknown>
  let record = records.get(key)

  if (!record) {
    const created: SyncRecord = {
      loaded: false,
      timer: null,
      flush: () => {
        if (created.timer) clearTimeout(created.timer)
        created.timer = null
        // Copie sans proxy : IndexedDB refuse les proxys réactifs
        options.save(toPlain(state.value)).catch(error => console.error(error))
      },
    }
    record = created
    records.set(key, created)
    options.load()
      .then((saved) => {
        if (saved !== undefined) state.value = saved
      })
      .catch(error => console.error(error))
      .finally(() => { created.loaded = true })
  }

  const current = record
  const delay = options.delay ?? 0

  watch(state, () => {
    if (!current.loaded) return
    if (delay === 0) {
      current.flush()
      return
    }
    if (current.timer) clearTimeout(current.timer)
    current.timer = setTimeout(current.flush, delay)
  }, { deep: true })

  // Écriture en attente : ne pas la perdre si l'app passe en arrière-plan ou si le composant disparaît
  const flushPending = (): void => {
    if (current.timer) current.flush()
  }
  if (typeof window !== 'undefined') window.addEventListener('pagehide', flushPending)
  onScopeDispose(() => {
    if (typeof window !== 'undefined') window.removeEventListener('pagehide', flushPending)
    flushPending()
  })
}
