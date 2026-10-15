/**
 * Avis de changement des fiches de l'appareil :
 * - `local` : modification de l'utilisateur, à synchroniser bientôt ;
 * - `remote` : données reçues du serveur, à recharger dans l'affichage (identifiants concernés).
 */
type Listener = (ids: string[]) => void

const listeners = { local: new Set<Listener>(), remote: new Set<Listener>() }

export function onChange(kind: keyof typeof listeners, listener: Listener): () => void {
  listeners[kind].add(listener)
  return () => listeners[kind].delete(listener)
}

export function emitChange(kind: keyof typeof listeners, ids: string[]): void {
  for (const listener of listeners[kind]) listener(ids)
}
