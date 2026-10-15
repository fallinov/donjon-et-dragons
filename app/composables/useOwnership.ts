import { shallowRef } from 'vue'
import type { Member } from '~~/shared/types/sync'
import { onChange } from '~/db/changes'
import type { RemoteInfo } from '~/db/schema'
import { getAllRemote, getMeta, setMeta } from '~/db/syncRepository'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const remote = shallowRef<Map<string, RemoteInfo>>(new Map())
const members = shallowRef<Member[]>([])
let started = false

async function reload(): Promise<void> {
  remote.value = await getAllRemote()
}

/** Membres du groupe : serveur si possible, sinon la dernière liste gardée sur l'appareil. */
async function loadMembers(): Promise<void> {
  members.value = await getMeta('members') ?? []
  try {
    const response = await fetch('/api/members', { cache: 'no-store' })
    if (!response.ok) return
    const fresh = (await response.json() as { members: Member[] }).members
    members.value = fresh
    await setMeta('members', fresh)
  }
  catch {
    // Hors ligne : la liste gardée suffit
  }
}

/**
 * Droits d'écriture sur les fiches, comme le serveur les applique : un master modifie tout ; un
 * joueur, ses fiches. Fiche jamais synchronisée : modifiable si le compte peut la créer (UUID pour
 * un joueur ; les fiches de départ sont réservées aux masters).
 */
export function useOwnership() {
  const { user } = useAuth()
  if (!started && typeof window !== 'undefined') {
    started = true
    onChange('remote', () => void reload().catch(console.error))
    void reload().catch(console.error)
    void loadMembers()
  }

  function canEdit(id: string): boolean {
    const current = user.value
    if (!current || current.mustChangePassword) return false
    if (current.role === 'master') return true
    const info = remote.value.get(id)
    return info ? info.ownerId === current.id : UUID_PATTERN.test(id)
  }

  /** Propriétaire affichable : identifiant du membre, `null` pour une fiche du groupe, `undefined` si inconnu. */
  function ownerName(id: string): string | null | undefined {
    const info = remote.value.get(id)
    if (!info) return undefined
    if (info.ownerId === null) return null
    return members.value.find(member => member.id === info.ownerId)?.username
  }

  return { canEdit, ownerName, remote, members, reloadMembers: loadMembers }
}
