import type { MessageKey } from '~/composables/useT'
import { getCharacterBundle } from '~/db/characterRepository'
import { arrayBufferToBase64, base64ToArrayBuffer } from '~/utils/base64'
import { parseCharacterFile, serializeCharacter, type ImportedCharacter } from '~/utils/characterFile'
import { generateCode, isValidCode, normalizeCode } from '~/utils/transferCode'
import { decryptTransfer, encryptTransfer, PBKDF2_ITERATIONS, transferId } from '~/utils/transferCrypto'

export interface TransferOptions {
  fetch?: typeof fetch
  generate?: () => string
  iterations?: number
}

export type TransferResult<T> = { ok: true, value: T } | { ok: false, error: MessageKey }

export interface SentTransfer {
  code: string
  expiresAt: string
}

/** Nombre d'essais avec un nouveau code quand l'identifiant est déjà pris (409). */
const MAX_ATTEMPTS = 3

const fail = (error: MessageKey) => ({ ok: false as const, error })

function httpError(status: number): MessageKey {
  if (status === 404) return 'transfer.error.notFound'
  if (status === 413) return 'transfer.error.tooLarge'
  if (status === 429) return 'transfer.error.tooMany'
  if (status === 503) return 'transfer.error.unavailable'
  return 'transfer.error.failed'
}

/** Appel au relais ; une erreur réseau (hors ligne, serveur injoignable) devient `null`. */
async function request(doFetch: typeof fetch, url: string, init?: RequestInit): Promise<Response | null> {
  try {
    return await doFetch(url, init)
  }
  catch {
    return null
  }
}

/** Corps JSON d'une réponse ; `null` s'il est illisible (page d'erreur d'un proxy…). */
async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return await response.json() as T
  }
  catch {
    return null
  }
}

/** Chiffre un texte avec un nouveau code et le dépose sur le relais. */
export async function uploadTransfer(text: string, options: TransferOptions = {}): Promise<TransferResult<SentTransfer>> {
  const { fetch: doFetch = fetch, generate = generateCode, iterations = PBKDF2_ITERATIONS } = options
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generate()
    const [id, data] = await Promise.all([transferId(code), encryptTransfer(text, code, iterations)])
    const response = await request(doFetch, '/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, data: arrayBufferToBase64(data) }),
    })
    if (!response) return fail('transfer.error.offline')
    if (response.status === 409) continue
    if (!response.ok) return fail(httpError(response.status))
    const body = await readJson<{ expiresAt?: unknown }>(response)
    if (typeof body?.expiresAt !== 'string') return fail('transfer.error.failed')
    return { ok: true, value: { code, expiresAt: body.expiresAt } }
  }
  return fail('transfer.error.failed')
}

/** Récupère et déchiffre le texte déposé sous ce code (saisie tolérante). */
export async function downloadTransfer(input: string, options: TransferOptions = {}): Promise<TransferResult<string>> {
  const { fetch: doFetch = fetch, iterations = PBKDF2_ITERATIONS } = options
  const code = normalizeCode(input)
  if (!isValidCode(code)) return fail('transfer.error.invalidCode')
  const response = await request(doFetch, `/api/transfers/${await transferId(code)}`, { cache: 'no-store' })
  if (!response) return fail('transfer.error.offline')
  if (!response.ok) return fail(httpError(response.status))
  const body = await readJson<{ data?: unknown }>(response)
  if (typeof body?.data !== 'string') return fail('transfer.error.failed')
  let data: ArrayBuffer
  try {
    data = base64ToArrayBuffer(body.data)
  }
  catch {
    return fail('transfer.error.wrongCode')
  }
  const text = await decryptTransfer(data, code, iterations)
  return text === null ? fail('transfer.error.wrongCode') : { ok: true, value: text }
}

/** Envoie une fiche de l'appareil (fiche, portrait, état de jeu et sac) : renvoie le code à transmettre. */
export async function sendCharacter(id: string, options: TransferOptions = {}): Promise<TransferResult<SentTransfer>> {
  const bundle = await getCharacterBundle(id)
  if (!bundle) return fail('transfer.error.failed')
  return uploadTransfer(JSON.stringify(serializeCharacter(bundle.character, bundle)), options)
}

/** Reçoit une fiche : téléchargement, déchiffrement puis lecture stricte (donnée non fiable). */
export async function receiveCharacter(input: string, options: TransferOptions = {}): Promise<TransferResult<ImportedCharacter>> {
  const downloaded = await downloadTransfer(input, options)
  if (!downloaded.ok) return downloaded
  let json: unknown
  try {
    json = JSON.parse(downloaded.value)
  }
  catch {
    return fail('import.error.notCodex')
  }
  const parsed = parseCharacterFile(json)
  return parsed.ok ? parsed : fail(parsed.error)
}
