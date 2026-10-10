import { seeds } from '~/data/characters'
import { fetchPortrait, seedBuiltins } from '~/db/seed'
import { migrateLegacyStorage } from '~/db/legacy'

/**
 * Prépare le stockage de l'appareil avant le premier rendu : import des fiches
 * de départ au premier lancement, reprise des données des versions précédentes
 * et demande de stockage persistant (Safari purge sinon les données d'un site
 * non installé après 7 jours d'inactivité).
 */
export default defineNuxtPlugin(async () => {
  try {
    await seedBuiltins(seeds, fetchPortrait)
  }
  catch (error) {
    console.error('Import des fiches de départ impossible', error)
  }
  try {
    await migrateLegacyStorage()
  }
  catch (error) {
    console.error('Reprise des anciennes données impossible', error)
  }
  void navigator.storage?.persist?.().catch(() => false)
})
