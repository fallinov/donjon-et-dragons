import { describe, expect, it } from 'vitest'
import { downloadTransfer, receiveCharacter, sendCharacter, uploadTransfer } from '~/composables/useTransfer'
import { putCharacter } from '~/db/characterRepository'
import { transferId } from '~/utils/transferCrypto'
import { darethBrumeval } from '../../helpers/characters'

const FAST = 1_000

/** Relais simulé : mêmes réponses que `server/api/transfers` (mémoire). */
function fakeRelay(override?: (url: string, init?: RequestInit) => Response | undefined) {
  const store = new Map<string, string>()
  const calls: string[] = []
  const relay = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input)
    calls.push(`${init?.method ?? 'GET'} ${url}`)
    const forced = override?.(url, init)
    if (forced) return forced
    if (init?.method === 'POST') {
      const { id, data } = JSON.parse(String(init.body)) as { id: string, data: string }
      if (store.has(id)) return new Response(null, { status: 409 })
      store.set(id, data)
      return Response.json({ expiresAt: '2026-10-15T12:00:00.000Z' })
    }
    const data = store.get(url.split('/').pop()!)
    return data ? Response.json({ data, expiresAt: '2026-10-15T12:00:00.000Z' }) : new Response(null, { status: 404 })
  }
  return { fetch: relay as typeof fetch, store, calls }
}

const codes = (...list: string[]) => () => list.shift()!

describe('transfert : dépôt et récupération', () => {
  it('aller-retour : le relais ne reçoit ni le code ni le texte', async () => {
    const relay = fakeRelay()
    const sent = await uploadTransfer('{"nom":"Zanna"}', { fetch: relay.fetch, generate: codes('K7P4QX9M'), iterations: FAST })
    expect(sent).toEqual({ ok: true, value: { code: 'K7P4QX9M', expiresAt: '2026-10-15T12:00:00.000Z' } })
    const [[id, data]] = [...relay.store]
    expect(id).toBe(await transferId('K7P4QX9M'))
    expect(atob(data!)).not.toContain('Zanna')
    expect(relay.calls.join(' ')).not.toContain('K7P4QX9M')

    // Saisie tolérante : minuscules, tiret, O lu comme 0
    expect(await downloadTransfer('k7p4-qx9m', { fetch: relay.fetch, iterations: FAST })).toEqual({ ok: true, value: '{"nom":"Zanna"}' })
  })

  it('identifiant déjà pris (409) : nouvel essai avec un autre code', async () => {
    const relay = fakeRelay()
    await uploadTransfer('a', { fetch: relay.fetch, generate: codes('AAAAAAAA'), iterations: FAST })
    const sent = await uploadTransfer('b', { fetch: relay.fetch, generate: codes('AAAAAAAA', 'BBBBBBBB'), iterations: FAST })
    expect(sent).toMatchObject({ ok: true, value: { code: 'BBBBBBBB' } })
  })

  it('erreurs du relais traduites', async () => {
    const status = (code: number) => fakeRelay(() => new Response(null, { status: code })).fetch
    const upload = (fetch: typeof globalThis.fetch) => uploadTransfer('x', { fetch, generate: codes('AAAAAAAA'), iterations: FAST })
    expect(await upload(status(413))).toEqual({ ok: false, error: 'transfer.error.tooLarge' })
    expect(await upload(status(429))).toEqual({ ok: false, error: 'transfer.error.tooMany' })
    expect(await upload(status(503))).toEqual({ ok: false, error: 'transfer.error.unavailable' })
    expect(await upload(status(500))).toEqual({ ok: false, error: 'transfer.error.failed' })
    const offline = (async () => { throw new TypeError('Failed to fetch') }) as typeof fetch
    expect(await upload(offline)).toEqual({ ok: false, error: 'transfer.error.offline' })
    expect(await downloadTransfer('AAAAAAAA', { fetch: offline, iterations: FAST })).toEqual({ ok: false, error: 'transfer.error.offline' })
  })

  it('code inconnu, mal formé ou contenu illisible', async () => {
    const relay = fakeRelay()
    expect(await downloadTransfer('AAAAAAAA', { fetch: relay.fetch, iterations: FAST })).toEqual({ ok: false, error: 'transfer.error.notFound' })
    expect(await downloadTransfer('AB12', { fetch: relay.fetch, iterations: FAST })).toEqual({ ok: false, error: 'transfer.error.invalidCode' })
    expect(relay.calls).toHaveLength(1)
    relay.store.set(await transferId('CCCCCCCC'), btoa('pas un contenu chiffré par ce code'))
    expect(await downloadTransfer('CCCCCCCC', { fetch: relay.fetch, iterations: FAST })).toEqual({ ok: false, error: 'transfer.error.wrongCode' })
  })
})

describe('transfert d\'une fiche', () => {
  it('envoyer puis recevoir : fiche et portrait identiques', async () => {
    await putCharacter(darethBrumeval)
    const relay = fakeRelay()
    const sent = await sendCharacter(darethBrumeval.id, { fetch: relay.fetch, generate: codes('K7P4QX9M'), iterations: FAST })
    expect(sent.ok).toBe(true)
    const received = await receiveCharacter('K7P4QX9M', { fetch: relay.fetch, iterations: FAST })
    if (!received.ok) throw new Error(received.error)
    expect(received.value.character.firstName).toBe('Dareth')
    expect(new Uint8Array(received.value.character.portrait.data)).toEqual(new Uint8Array(darethBrumeval.portrait.data))
  })

  it('fiche absente de l\'appareil : échec', async () => {
    expect(await sendCharacter('inconnue', { fetch: fakeRelay().fetch, iterations: FAST })).toEqual({ ok: false, error: 'transfer.error.failed' })
  })

  it('contenu déchiffré qui n\'est pas une fiche : refusé par la lecture stricte', async () => {
    const relay = fakeRelay()
    await uploadTransfer('{"format":"autre"}', { fetch: relay.fetch, generate: codes('DDDDDDDD'), iterations: FAST })
    expect(await receiveCharacter('DDDDDDDD', { fetch: relay.fetch, iterations: FAST })).toEqual({ ok: false, error: 'import.error.notCodex' })
    await uploadTransfer('pas du JSON', { fetch: relay.fetch, generate: codes('EEEEEEEE'), iterations: FAST })
    expect(await receiveCharacter('EEEEEEEE', { fetch: relay.fetch, iterations: FAST })).toEqual({ ok: false, error: 'import.error.notCodex' })
  })
})
