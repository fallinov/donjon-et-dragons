/** Pages accessibles sans compte. */
const PUBLIC_PATHS = ['/connexion', '/installation']

/**
 * Connexion obligatoire : sans compte (ni sur l'appareil ni sur le serveur), retour à la connexion.
 * Un mot de passe provisoire est à changer d'abord ; `/comptes` est réservé aux masters.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC_PATHS.includes(to.path)) return
  const { user, ensureUser } = useAuth()
  await ensureUser()
  if (!user.value) return navigateTo({ path: '/connexion', query: to.fullPath === '/' ? undefined : { suite: to.fullPath } })
  if (user.value.mustChangePassword && to.path !== '/mot-de-passe') return navigateTo('/mot-de-passe')
  if (to.path === '/comptes' && user.value.role !== 'master') return navigateTo('/')
})
