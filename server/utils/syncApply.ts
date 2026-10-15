import type { SyncChange, SyncStatus } from '~~/shared/types/sync'
import { canWrite, isCharacterId, PLAYER_MAX_SHEETS, readChangedAt, validatePart, validateSheet, type Writer } from './syncRules'
import type { SyncStore } from './syncStore'

/** Applique une modification reçue (droits, lecture stricte, dernière modification gagnante). */
export async function applyChange(store: SyncStore, user: Writer, change: SyncChange, now: Date): Promise<SyncStatus> {
  const changedAt = readChangedAt(change.changedAt, now)
  if (!isCharacterId(change.id) || !changedAt) return 'invalid'
  const record = await store.get(change.id)
  if (!canWrite(user, change.id, record ? record.ownerId : undefined)) return 'forbidden'

  if (change.part === 'sheet') {
    const valid = validateSheet(change.id, change.data)
    if (!valid) return 'invalid'
    // Nouvelle fiche : elle appartient à celui qui l'envoie (création concurrente : l'autre gagne la course, droits revérifiés)
    if (!record && user.role === 'player' && await store.countOwned(user.id) >= PLAYER_MAX_SHEETS) return 'forbidden'
    if (!record && !(await store.create(change.id, user.id))) {
      const created = await store.get(change.id)
      if (!created || !canWrite(user, change.id, created.ownerId)) return 'forbidden'
    }
    return await store.writeSheet(change.id, valid.sheet, valid.portrait, changedAt, user.id) ? 'applied' : 'stale'
  }
  if (!record) return change.part === 'delete' ? 'applied' : 'notFound'
  if (change.part === 'delete') return await store.remove(change.id, changedAt, user.id) ? 'applied' : 'stale'
  const data = validatePart(change.part, change.data)
  if (data === null) return 'invalid'
  return await store.writePart(change.id, change.part, data, changedAt, user.id) ? 'applied' : 'stale'
}

