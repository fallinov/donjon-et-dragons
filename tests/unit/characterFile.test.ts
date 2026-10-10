import { describe, expect, it } from 'vitest'
import { CHARACTER_SCHEMA_VERSION } from '~~/shared/types/character'
import { seeds } from '~/data/characters'
import { arrayBufferToBase64, base64ToArrayBuffer } from '~/utils/base64'
import { CHARACTER_FILE_FORMAT, characterFileName, parseCharacterFile, readCharacterFile, serializeCharacter } from '~/utils/characterFile'
import { hasCharacterShape } from '~/utils/characterShape'
import { darethBrumeval, storedFromSeed } from '../helpers/characters'

const state = { hpCurrent: 30, hpTemp: 2, inspiration: 1, hitDiceUsed: 1, deathSaves: { successes: 0, failures: 0 }, spellSlotsUsed: [1, 0], dailySpellsUsed: [] }
const inventory = { items: [{ id: 'a', name: 'Corde', quantity: 1 }], coins: { cp: 0, sp: 0, ep: 0, gp: 12, pp: 0 }, notes: 'x' }

/** Copie JSON d'un fichier sérialisé, comme après un aller-retour par email. */
const roundTrip = (value: unknown): Record<string, unknown> => JSON.parse(JSON.stringify(value)) as Record<string, unknown>

describe('base64', () => {
  it('aller-retour fidèle, y compris un gros portrait', () => {
    const bytes = new Uint8Array(300_000).map((_, i) => i % 256)
    expect([...new Uint8Array(base64ToArrayBuffer(arrayBufferToBase64(bytes.buffer)))]).toEqual([...bytes])
    expect(base64ToArrayBuffer(arrayBufferToBase64(new ArrayBuffer(0))).byteLength).toBe(0)
  })
})

describe('characterFileName', () => {
  it('retire accents et caractères spéciaux', () => {
    expect(characterFileName({ firstName: 'Éowyn', lastName: "d'Edoras", id: 'x' })).toBe('eowyn-d-edoras.codex.json')
  })
  it('se rabat sur l\'identifiant sans nom', () => {
    expect(characterFileName({ firstName: '  ', lastName: '', id: 'abc' })).toBe('abc.codex.json')
  })
})

describe('serializeCharacter → parseCharacterFile', () => {
  it('restitue fiche, portrait, état de jeu et sac', () => {
    const file = roundTrip(serializeCharacter(darethBrumeval, { state, inventory }))
    expect(file.format).toBe(CHARACTER_FILE_FORMAT)
    const result = parseCharacterFile(file)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.character.firstName).toBe('Dareth')
    expect([...new Uint8Array(result.value.character.portrait.data)]).toEqual([...new Uint8Array(darethBrumeval.portrait.data)])
    expect(result.value.state).toMatchObject({ hpCurrent: 30, inspiration: 1 })
    expect(result.value.inventory).toEqual(inventory)
  })

  it.each(seeds.map(seed => [seed.slug, seed] as const))('fiche de départ %s : structure valide et aller-retour accepté', (_slug, seed) => {
    const stored = storedFromSeed(seed)
    expect(hasCharacterShape(stored)).toBe(true)
    expect(parseCharacterFile(roundTrip(serializeCharacter(stored))).ok).toBe(true)
  })

  it('ignore un état ou un sac abîmés sans refuser la fiche', () => {
    const file = { ...roundTrip(serializeCharacter(darethBrumeval)), state: { hpCurrent: 'beaucoup' }, inventory: { items: 'non' } }
    const result = parseCharacterFile(file)
    expect(result.ok && result.value.state === undefined && result.value.inventory === undefined).toBe(true)
  })

  it('migre une fiche exportée au format v1 (sac de départ dans la fiche)', () => {
    const file = roundTrip(serializeCharacter(darethBrumeval))
    file.schemaVersion = 1
    ;(file.character as Record<string, unknown>).inventory = { equipment: [], coins: { cp: 0, sp: 0, ep: 0, gp: 1, pp: 0 } }
    const result = parseCharacterFile(file)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.character.schemaVersion).toBe(CHARACTER_SCHEMA_VERSION)
      expect(result.value.character).not.toHaveProperty('inventory')
    }
  })
})

describe('parseCharacterFile — refus', () => {
  const valid = () => roundTrip(serializeCharacter(darethBrumeval))
  const character = (file: Record<string, unknown>) => file.character as Record<string, unknown>
  const error = (input: unknown) => { const r = parseCharacterFile(input); return r.ok ? 'ok' : r.error }

  it('n\'est pas une fiche du codex', () => {
    expect(error(null)).toBe('import.error.notCodex')
    expect(error([])).toBe('import.error.notCodex')
    expect(error({ ...valid(), format: 'autre' })).toBe('import.error.notCodex')
  })

  it('vient d\'une version plus récente de l\'app', () => {
    expect(error({ ...valid(), schemaVersion: CHARACTER_SCHEMA_VERSION + 1 })).toBe('import.error.newer')
  })

  it('portrait absent, base64 invalide ou type non image', () => {
    const noPortrait = valid(); delete character(noPortrait).portrait
    expect(error(noPortrait)).toBe('import.error.invalid')
    const badBase64 = valid(); (character(badBase64).portrait as Record<string, unknown>).base64 = '%%%'
    expect(error(badBase64)).toBe('import.error.invalid')
    const html = valid(); (character(html).portrait as Record<string, unknown>).mime = 'text/html'
    expect(error(html)).toBe('import.error.invalid')
  })

  it('champ du mauvais type, même en profondeur', () => {
    const level = valid(); character(level).level = '6'
    expect(error(level)).toBe('import.error.invalid')
    const skill = valid(); character(skill).skills = [null]
    expect(error(skill)).toBe('import.error.invalid')
    const spell = valid(); (character(spell).spellcasting as Record<string, unknown>).spells = [{ title: 'X', level: 1 }]
    expect(error(spell)).toBe('import.error.invalid')
  })

  it('fiche structurellement invalide (prénom vide)', () => {
    const empty = valid(); character(empty).firstName = ''
    expect(error(empty)).toBe('import.error.invalid')
  })
})

describe('readCharacterFile', () => {
  it('refuse un fichier qui n\'est pas du JSON', async () => {
    const result = await readCharacterFile(new File(['pas du json'], 'x.json'))
    expect(result).toEqual({ ok: false, error: 'import.error.notCodex' })
  })

  it('lit un fichier exporté', async () => {
    const file = new File([JSON.stringify(serializeCharacter(darethBrumeval))], 'dareth.codex.json', { type: 'application/json' })
    expect((await readCharacterFile(file)).ok).toBe(true)
  })
})
