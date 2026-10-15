/** Partie d'une fiche synchronisée, datée séparément : la dernière modification gagne, partie par partie. */
export type SyncPart = 'sheet' | 'state' | 'inventory'

/** Modification envoyée par un appareil. `sheet` : fichier de fiche (format d'export, portrait compris). */
export interface SyncChange {
  id: string
  part: SyncPart | 'delete'
  data?: unknown
  /** Date de la modification sur l'appareil (ISO). */
  changedAt: string
}

/**
 * Résultat d'une modification : `applied` enregistrée ; `stale` plus ancienne que la version du
 * serveur (l'appareil la reçoit au prochain téléchargement) ; `forbidden` fiche d'un autre joueur ;
 * `invalid` données refusées ; `notFound` fiche absente du serveur (envoyer la fiche d'abord).
 */
export type SyncStatus = 'applied' | 'stale' | 'forbidden' | 'invalid' | 'notFound'

export interface SyncResult {
  id: string
  part: SyncChange['part']
  status: SyncStatus
}

/** Fiche telle que le serveur la renvoie : chaque partie avec sa date ; portrait par son empreinte. */
export interface SyncRow {
  id: string
  /** Propriétaire ; null : fiche du groupe, modifiable par les masters seulement. */
  ownerId: string | null
  /** Fichier de fiche sans le portrait en base64 (`character.portrait` : `{ alt, mime }`). */
  sheet: unknown | null
  sheetAt: string | null
  state: unknown | null
  stateAt: string | null
  inventory: unknown | null
  inventoryAt: string | null
  /** Empreinte du portrait : à télécharger (`/api/portraits/:id`) seulement si elle a changé. */
  portraitHash: string | null
  deletedAt: string | null
  rev: number
}

/** Membre du groupe, pour afficher à qui appartient une fiche. */
export interface Member {
  id: string
  username: string
  role: 'master' | 'player'
}
