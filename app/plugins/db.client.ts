import { seeds } from '~/data/characters'
import { fetchPortrait, seedBuiltins } from '~/db/seed'

/**
 * Prépare le stockage de l'appareil avant le premier rendu : import des fiches
 * de départ au premier lancement et demande de stockage persistant (Safari purge
 * sinon les données d'un site non installé après 7 jours d'inactivité).
 */
export default defineNuxtPlugin(async () => {
  try {
    await seedBuiltins(seeds, fetchPortrait)
  }
  catch (error) {
    console.error('Import des fiches de départ impossible', error)
  }
  void navigator.storage?.persist?.().catch(() => false)
})
