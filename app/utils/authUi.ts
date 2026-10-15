/** Classes des boutons des pages de compte (même style que « Recevoir une fiche »). */
export const AUTH_BUTTON = 'min-h-11 border px-5 font-display text-sm tracking-wider-2 uppercase transition-colors disabled:opacity-50'
export const AUTH_PRIMARY = `${AUTH_BUTTON} border-gold/50 bg-gold/15 text-gold-bright hover:bg-gold/25`
export const AUTH_SECONDARY = `${AUTH_BUTTON} border-gold/30 text-parchment-dim hover:text-gold-bright hover:border-gold/60`

/** Adresse de retour après connexion : seulement un chemin interne (pas de redirection vers un autre site). */
export function safeNext(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}
