/**
 * Compte connecté chargé en arrière-plan au démarrage, sans bloquer l'app (utilisable hors ligne
 * et sans compte). Un mot de passe provisoire renvoie vers son changement.
 */
export default defineNuxtPlugin(() => {
  const { user, ensureUser } = useAuth()
  const route = useRoute()
  ensureUser().then(async () => {
    if (user.value?.mustChangePassword && !['/mot-de-passe', '/connexion'].includes(route.path)) {
      await navigateTo('/mot-de-passe')
    }
  }).catch(console.error)
})
