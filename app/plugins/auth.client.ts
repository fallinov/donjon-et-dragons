import { watch } from 'vue'
import { startSync } from '~/composables/useSync'

/**
 * Synchronisation en arrière-plan tant qu'un compte est connecté (mot de passe définitif).
 * Session expirée côté serveur : retour à la connexion, les fiches restent sur l'appareil.
 */
export default defineNuxtPlugin({
  name: 'codex-auth',
  // Après l'import des fiches de départ : la première synchronisation doit toutes les voir
  dependsOn: ['codex-db'],
  setup() {
    const { user, ensureUser, fetchUser } = useAuth()
    let stop: (() => void) | null = null
    watch(user, (current, previous) => {
      if (current?.id === previous?.id && current?.mustChangePassword === previous?.mustChangePassword) return
      stop?.()
      stop = null
      if (current && !current.mustChangePassword) {
        stop = startSync(current, () => {
          void fetchUser().then(async () => {
            if (!user.value) await navigateTo('/connexion')
          })
        })
      }
    })
    ensureUser().catch(console.error)
  },
})
