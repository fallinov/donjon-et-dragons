import { isCharacterId } from '../../utils/syncRules'
import { requireSyncStore } from '../../utils/syncGuard'
import { requireAccountStore, requireSession } from '../../utils/session'

/** Portrait d'une fiche (compte connecté), avec son empreinte en ETag. */
export default defineEventHandler(async (event) => {
  await requireSession(event, requireAccountStore())
  const id = getRouterParam(event, 'id') ?? ''
  const portrait = isCharacterId(id) ? await requireSyncStore().getPortrait(id) : null
  if (!portrait) throw createError({ statusCode: 404, statusMessage: 'Portrait introuvable' })
  const etag = `"${portrait.hash}"`
  setResponseHeaders(event, {
    'Cache-Control': 'private, no-cache',
    'ETag': etag,
    'Content-Type': portrait.mime,
    // Une image, jamais un document : ni interprétation d'un autre type, ni script (ouverte directement)
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': 'default-src \'none\'; sandbox',
  })
  // If-None-Match : liste d'ETags, éventuellement faibles (W/"…") après un proxy
  const known = (getRequestHeader(event, 'if-none-match') ?? '').split(',').map(tag => tag.trim().replace(/^W\//, ''))
  if (known.includes(etag)) {
    setResponseStatus(event, 304)
    return null
  }
  return Buffer.from(portrait.base64, 'base64')
})
