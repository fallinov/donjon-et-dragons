import { onScopeDispose, watch, type Ref } from 'vue'
import { deepEqual } from '~/utils/deepEqual'
import { toPlain } from '~/utils/toPlain'

interface SyncRecord {
  /** Un des refs de l'état (Nuxt `useState` renvoie un nouveau ref à chaque appel, sur la même valeur). */
  state: Ref<unknown>
  loaded: boolean
  timer: ReturnType<typeof setTimeout> | null
  flush: () => void
  /** Dernière valeur connue du stockage (lue, écrite ou reçue du serveur) : la réécrire est inutile. */
  persisted?: unknown
  /** Valeur reçue du serveur pendant le chargement : appliquée une fois la lecture terminée. */
  incoming?: unknown
}

/**
 * Une synchronisation par état partagé, même si plusieurs composants l'utilisent : par clé
 * (`character-state:<id>`…) quand elle est donnée, sinon par ref.
 */
const byKey = new Map<string, SyncRecord>()
const byRef = new WeakMap<Ref<unknown>, SyncRecord>()

/**
 * Applique une valeur reçue du serveur (déjà enregistrée dans IndexedDB) à un état affiché, s'il
 * l'est : l'affichage se met à jour sans que la valeur soit réenregistrée ni renvoyée au serveur.
 */
export function applyExternal(key: string, value: unknown): void {
  const record = byKey.get(key)
  if (!record) return
  // Copie : l'état affiché devient un proxy de `value`, ses modifications ne doivent pas changer la référence
  record.persisted = toPlain(value)
  if (!record.loaded) {
    record.incoming = value
    return
  }
  record.state.value = value
}

/** Oublie les états partagés (déconnexion, tests) : le prochain affichage relit le stockage. */
export function resetPersistedStates(): void {
  byKey.clear()
}

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
  /** Clé de l'état partagé : un seul chargement pour tous les composants, données du serveur applicables. */
  key?: string
}

/**
 * Synchronise un état réactif avec un stockage asynchrone : chargement unique,
 * écriture à chaque changement (ou regroupée si `delay` > 0, avec écriture
 * immédiate en quittant la page ou le composant).
 * Tant que le chargement n'est pas terminé, rien n'est écrit (l'état par défaut
 * n'écrase jamais une valeur enregistrée). Une valeur identique à celle du stockage
 * n'est pas réécrite. En cas d'erreur de stockage, l'état reste utilisable en mémoire.
 */
export function persistState<T>(state: Ref<T>, options: PersistOptions<T>): void {
  const ref = state as Ref<unknown>
  let record = options.key ? byKey.get(options.key) : byRef.get(ref)

  if (!record) {
    const created: SyncRecord = {
      state: ref,
      loaded: false,
      timer: null,
      flush: () => {
        if (created.timer) clearTimeout(created.timer)
        created.timer = null
        // Copie sans proxy : IndexedDB refuse les proxys réactifs
        const value = toPlain(created.state.value) as T
        if (created.persisted !== undefined && deepEqual(value, created.persisted)) return
        created.persisted = value
        options.save(value).catch(error => console.error(error))
      },
    }
    record = created
    if (options.key) byKey.set(options.key, created)
    else byRef.set(ref, created)
    options.load()
      .then((saved) => {
        if (saved === undefined) return
        created.persisted = toPlain(saved)
        state.value = saved
      })
      .catch(error => console.error(error))
      .finally(() => {
        created.loaded = true
        // Reçue du serveur pendant la lecture : plus récente que la valeur lue
        if (created.incoming !== undefined) {
          created.persisted = toPlain(created.incoming)
          state.value = created.incoming as T
          created.incoming = undefined
        }
      })
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
