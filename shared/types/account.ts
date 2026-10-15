/** Rôle d'un compte : le master gère les comptes et modifie toutes les fiches. */
export type Role = 'master' | 'player'

/** Compte tel que le serveur le renvoie au client (jamais le hachage du mot de passe). */
export interface PublicUser {
  id: string
  username: string
  role: Role
  /** Mot de passe provisoire (création, réinitialisation) : à changer avant toute autre action. */
  mustChangePassword: boolean
}

/** Compte vu par le master dans la liste des comptes. */
export interface AccountSummary extends PublicUser {
  createdAt: string
}
