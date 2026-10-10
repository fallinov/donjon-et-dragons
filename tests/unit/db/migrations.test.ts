import { describe, expect, it } from 'vitest'
import { CHARACTER_SCHEMA_VERSION } from '~~/shared/types/character'
import { migrateDocument } from '~/db/migrations'
import { darethBrumeval } from '../../helpers/characters'

describe('migrateDocument', () => {
  it('accepte une fiche à la version courante', () => {
    expect(migrateDocument(darethBrumeval)?.id).toBe('dareth-brumeval')
  })

  it('rejette une version future, absente ou invalide', () => {
    expect(migrateDocument({ ...darethBrumeval, schemaVersion: CHARACTER_SCHEMA_VERSION + 1 })).toBeNull()
    expect(migrateDocument({ ...darethBrumeval, schemaVersion: undefined })).toBeNull()
    expect(migrateDocument({ ...darethBrumeval, schemaVersion: 0 })).toBeNull()
    expect(migrateDocument({ ...darethBrumeval, schemaVersion: 1.5 })).toBeNull()
  })

  it('rejette ce qui n\'est pas une fiche', () => {
    expect(migrateDocument(undefined)).toBeNull()
    expect(migrateDocument('fiche')).toBeNull()
    expect(migrateDocument([])).toBeNull()
    expect(migrateDocument({ ...darethBrumeval, portrait: { mime: 'image/jpeg' } })).toBeNull()
    expect(migrateDocument({ ...darethBrumeval, id: '' })).toBeNull()
  })

  it('v1 → v2 : retire le sac de départ de la fiche', () => {
    const v1 = { ...darethBrumeval, schemaVersion: 1, inventory: { equipment: [], coins: { cp: 0, sp: 0, ep: 0, gp: 1, pp: 0 } } }
    const migrated = migrateDocument(v1)
    expect(migrated?.schemaVersion).toBe(2)
    expect(migrated).not.toHaveProperty('inventory')
  })

  it('enchaîne les migrations jusqu\'à la version cible', () => {
    const v1 = { ...darethBrumeval, schemaVersion: 1, nickname: 'Dar' }
    const steps = {
      1: (doc: Record<string, unknown>) => ({ ...doc, eyebrow: `${String(doc.eyebrow)} (v2)` }),
      2: (doc: Record<string, unknown>) => {
        const { nickname, ...rest } = doc
        return { ...rest, firstName: `${String(rest.firstName)} « ${String(nickname)} »` }
      },
    }
    const migrated = migrateDocument(v1, steps, 3)
    expect(migrated?.schemaVersion).toBe(3)
    expect(migrated?.eyebrow).toBe('Codex du Chasseur (v2)')
    expect(migrated?.firstName).toBe('Dareth « Dar »')
    expect(migrated).not.toHaveProperty('nickname')
  })

  it('rejette un document si une étape de migration manque', () => {
    expect(migrateDocument({ ...darethBrumeval, schemaVersion: 1 }, {}, 2)).toBeNull()
  })
})
