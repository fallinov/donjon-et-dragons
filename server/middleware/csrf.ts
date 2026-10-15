/**
 * Protection CSRF de l'API : une requête qui modifie des données doit venir du site lui-même
 * (en-tête Origin identique, s'il est présent) et être en JSON, ce qui impose au navigateur une
 * vérification préalable (CORS) qu'aucun autre site ne peut passer.
 */
export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/') || ['GET', 'HEAD', 'OPTIONS'].includes(event.method)) return
  const origin = getRequestHeader(event, 'origin')
  if (origin && origin !== getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin) {
    throw createError({ statusCode: 403, statusMessage: 'Origine refusée' })
  }
  if (event.method !== 'DELETE' && !getRequestHeader(event, 'content-type')?.startsWith('application/json')) {
    throw createError({ statusCode: 415, statusMessage: 'JSON attendu' })
  }
})
