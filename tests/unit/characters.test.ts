import { describe, it, expect } from 'vitest'
import { characters, getCharacter } from '~/data/characters'

describe('characters dataset', () => {
  it('contient au moins Dareth Brumeval', () => {
    expect(characters.length).toBeGreaterThanOrEqual(1)
    expect(characters.find(c => c.slug === 'dareth-brumeval')).toBeDefined()
  })

  it('expose getCharacter par slug', () => {
    const dareth = getCharacter('dareth-brumeval')
    expect(dareth).toBeDefined()
    expect(dareth?.firstName).toBe('Dareth')
    expect(dareth?.lastName).toBe('Brumeval')
  })

  it('retourne undefined pour un slug inconnu', () => {
    expect(getCharacter('inexistant')).toBeUndefined()
  })

  it('Dareth a 6 caractéristiques', () => {
    const dareth = getCharacter('dareth-brumeval')!
    expect(Object.keys(dareth.abilities)).toHaveLength(6)
  })

  it('Dareth a Dextérité et Sagesse en maîtrise', () => {
    const dareth = getCharacter('dareth-brumeval')!
    expect(dareth.abilities.dexterity.proficient).toBe(true)
    expect(dareth.abilities.wisdom.proficient).toBe(true)
    expect(dareth.abilities.strength.proficient).toBe(false)
  })

  it('Dareth est rôdeur niveau 6 avec les valeurs recalculées', () => {
    const dareth = getCharacter('dareth-brumeval')!
    expect(dareth.level).toBe(6)
    expect(dareth.proficiencyBonus).toBe(3)
    expect(dareth.maxHp).toBe(49)
    expect(dareth.hitDice.total).toBe(6)
    expect(dareth.spellcasting?.saveDc).toBe(13)
    expect(dareth.spellcasting?.slotLevels).toEqual([{ level: 1, slots: 4 }, { level: 2, slots: 2 }])
    expect(dareth.spellcasting?.spells).toHaveLength(4)
    expect(dareth.attacks.every(a => a.attackBonus === '1d20+7')).toBe(true)
    expect(dareth.rituals).toHaveLength(5)
    expect(dareth.languages.map(l => l.name)).toContain('Infernal')
    const enemy = dareth.features.find(f => f.title.startsWith('Ennemis jurés'))!
    const terrain = dareth.features.find(f => f.title.startsWith('Explorateur né'))!
    expect(enemy.benefits).toHaveLength(3)
    expect(terrain.benefits).toHaveLength(6)
    expect(dareth.ritualsNote).toContain('concentration')
    const concentrationSpells = dareth.spellcasting!.spells.filter(sp => sp.concentration).map(sp => sp.title)
    expect(concentrationSpells).toEqual(['Marque du chasseur', 'Passage sans trace', "Croissance d'épines"])
  })
})
