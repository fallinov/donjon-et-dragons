/** Pages réservées : connexion requise pour `/comptes` (master) ; mot de passe provisoire à changer d'abord. */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, ensureUser } = useAuth()
  if (to.path === '/comptes' || to.path === '/mot-de-passe') {
    await ensureUser()
    if (!user.value) return navigateTo({ path: '/connexion', query: { suite: to.path } })
    if (to.path === '/comptes' && user.value.role !== 'master') return navigateTo('/')
  }
  if (user.value?.mustChangePassword && !['/mot-de-passe', '/connexion'].includes(to.path)) {
    return navigateTo('/mot-de-passe')
  }
})
