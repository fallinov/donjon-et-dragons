/** Règles du relais de transfert, sans dépendance au serveur HTTP (testables seules). */

/** Durée de vie d'un transfert : 24 h (décision de Steve). */
export const TRANSFER_TTL_MS = 24 * 60 * 60 * 1000
/** Taille maximale du contenu chiffré : 2 Mo (fiche avec portrait de 1024 px ≈ 0,5 Mo). */
export const TRANSFER_MAX_BYTES = 2 * 1024 * 1024
/** Fenêtre et plafonds des limites par adresse IP. */
export const RATE_WINDOW_MS = 60 * 60 * 1000
export const RATE_LIMITS = { deposit: 20, read: 60 } as const
export type RateAction = keyof typeof RATE_LIMITS

const ID_PATTERN = /^[0-9a-f]{64}$/
const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/

export type DepositCheck =
  | { ok: true, id: string, data: string }
  | { ok: false, status: 400 | 413, message: string }

export function isTransferId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value)
}

/** Taille en octets d'une chaîne base64 une fois décodée. */
export function base64Size(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return (base64.length / 4) * 3 - padding
}

/** Vérifie le corps d'un dépôt : identifiant SHA-256 hexadécimal et contenu base64 d'au plus 2 Mo. */
export function checkDeposit(body: unknown): DepositCheck {
  if (typeof body !== 'object' || body === null) return { ok: false, status: 400, message: 'Corps invalide' }
  const { id, data } = body as Record<string, unknown>
  if (!isTransferId(id)) return { ok: false, status: 400, message: 'Identifiant invalide' }
  if (typeof data !== 'string' || data.length === 0 || data.length % 4 !== 0 || !BASE64_PATTERN.test(data)) {
    return { ok: false, status: 400, message: 'Contenu invalide' }
  }
  if (base64Size(data) > TRANSFER_MAX_BYTES) return { ok: false, status: 413, message: 'Contenu trop volumineux' }
  return { ok: true, id, data }
}

export function expiresAt(now: Date): Date {
  return new Date(now.getTime() + TRANSFER_TTL_MS)
}

/** Début de la fenêtre de limitation qui contient `now`. */
export function rateWindow(now: Date): Date {
  return new Date(Math.floor(now.getTime() / RATE_WINDOW_MS) * RATE_WINDOW_MS)
}
