import { describe, expect, it } from 'vitest'
import {
  abilityModifier, armorClass, ARMOR_IDS, averageMaxHp, CLASS_IDS, clampLevel, hasJackOfAllTrades, hitDice,
  initiative, isWeaponProficient, passiveScore, proficiencyBonus, RACE_IDS, savingThrow, SKILL_KEYS, skillBonus,
  slotsRefreshOnShortRest, spellAttackBonus, spellcastingAbility, spellSaveDc, spellSlots, weaponAttack, WEAPON_IDS,
} from '~/rules/dnd5e-2014'
import { getRuleset } from '~/rules'
import { hasMessage } from '~/composables/useT'

const slotCounts = (classId: Parameters<typeof spellSlots>[0], level: number, third = false) =>
  spellSlots(classId, level, third).map(s => s.slots)

describe('caractéristiques et maîtrise', () => {
  it('modificateur = (valeur − 10) / 2 arrondi vers le bas', () => {
    expect([1, 7, 8, 9, 10, 11, 15, 16, 18, 20, 30].map(abilityModifier)).toEqual([-5, -2, -1, -1, 0, 0, 2, 3, 4, 5, 10])
  })

  it('bonus de maîtrise par niveau', () => {
    const expected = [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6]
    expect(expected.map((_, i) => proficiencyBonus(i + 1))).toEqual(expected)
  })

  it('borne le niveau entre 1 et 20', () => {
    expect([0, -3, 1, 20, 25, 6.7].map(clampLevel)).toEqual([1, 1, 1, 20, 20, 6])
  })

  it('sauvegarde : mod + PB si maîtrisée + ajustement', () => {
    expect(savingThrow(4, 3, true)).toBe(7)
    expect(savingThrow(2, 3, false)).toBe(2)
    expect(savingThrow(2, 3, true, 1)).toBe(6)
  })
})

describe('compétences', () => {
  const base = { abilityMod: 4, pb: 2, proficient: false, expertise: false, jackOfAllTrades: false }

  it('maîtrise, expertise, sans maîtrise', () => {
    expect(skillBonus({ ...base, proficient: true })).toBe(6)
    // Kael : Discrétion avec expertise, Dex +4, PB 2
    expect(skillBonus({ ...base, proficient: true, expertise: true })).toBe(8)
    expect(skillBonus(base)).toBe(4)
  })

  it('Touche-à-tout : moitié du PB arrondie vers le bas, seulement sans maîtrise', () => {
    expect(skillBonus({ ...base, pb: 3, jackOfAllTrades: true })).toBe(5)
    expect(skillBonus({ ...base, pb: 3, proficient: true, jackOfAllTrades: true })).toBe(7)
    expect(hasJackOfAllTrades('bard', 1)).toBe(false)
    expect(hasJackOfAllTrades('bard', 2)).toBe(true)
    expect(hasJackOfAllTrades('rogue', 10)).toBe(false)
  })

  it('valeur passive et initiative', () => {
    // Dareth : Perception +5 → 15
    expect(passiveScore(5)).toBe(15)
    expect(initiative(4, 3, false)).toBe(4)
    expect(initiative(2, 3, true)).toBe(3)
    expect(initiative(2, 2, false, 5)).toBe(7)
  })
})

describe('classe d\'armure', () => {
  const mods = { dexterity: 4, constitution: 2, wisdom: 3 }
  const ac = (over: Partial<Parameters<typeof armorClass>[0]>) =>
    armorClass({ armorId: null, shield: false, unarmored: 'standard', mods, ...over })

  it('armure légère : base + Dex (Dareth, cuir : 15)', () => {
    expect(ac({ armorId: 'leather' })).toBe(15)
  })

  it('armure intermédiaire : Dex plafonné à +2', () => {
    expect(ac({ armorId: 'breastplate' })).toBe(16)
    expect(ac({ armorId: 'hide', mods: { ...mods, dexterity: 1 } })).toBe(13)
    expect(ac({ armorId: 'hide', mods: { ...mods, dexterity: -1 } })).toBe(11)
  })

  it('armure lourde : Dex ignoré, bouclier +2 (Maera, cotte de mailles + bouclier : 18)', () => {
    expect(ac({ armorId: 'chain-mail', shield: true })).toBe(18)
    expect(ac({ armorId: 'plate', mods: { ...mods, dexterity: -1 } })).toBe(18)
  })

  it('formules sans armure', () => {
    expect(ac({})).toBe(14)
    expect(ac({ unarmored: 'barbarian', shield: true })).toBe(18)
    expect(ac({ unarmored: 'monk' })).toBe(17)
    // Skamos : résilience draconique, Dex +2 → 15
    expect(ac({ unarmored: 'draconic', mods: { ...mods, dexterity: 2 } })).toBe(15)
  })

  it('la défense du moine ne s\'applique pas avec un bouclier', () => {
    expect(ac({ unarmored: 'monk', shield: true })).toBe(16)
  })

  it('une armure remplace la formule sans armure', () => {
    expect(ac({ armorId: 'leather', unarmored: 'barbarian' })).toBe(15)
  })

  it('ajoute l\'ajustement', () => {
    expect(ac({ armorId: 'leather', adjust: 1 })).toBe(16)
  })
})

describe('incantation', () => {
  it('caractéristique d\'incantation par classe', () => {
    expect(spellcastingAbility('wizard')).toBe('intelligence')
    expect(spellcastingAbility('ranger')).toBe('wisdom')
    expect(spellcastingAbility('warlock')).toBe('charisma')
    expect(spellcastingAbility('fighter')).toBeUndefined()
    expect(spellcastingAbility('fighter', true)).toBe('intelligence')
    expect(spellcastingAbility('barbarian', true)).toBeUndefined()
  })

  it('DD et attaque de sort (Skamos, Cha 15 : DD 12, +4 ; Thunon : DD 14, +6)', () => {
    expect(spellSaveDc(2, 2)).toBe(12)
    expect(spellAttackBonus(2, 2)).toBe(4)
    expect(spellSaveDc(2, 4)).toBe(14)
    expect(spellAttackBonus(2, 4)).toBe(6)
    expect(spellSaveDc(2, 2, 1)).toBe(13)
  })

  it('lanceur complet, niveaux 1 à 20 (PHB)', () => {
    const table = [
      [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
      [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
      [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1],
      [4, 3, 3, 3, 3, 2, 2, 1, 1],
    ]
    for (const classId of ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'] as const) {
      expect(table.map((_, i) => slotCounts(classId, i + 1))).toEqual(table)
    }
    expect(spellSlots('wizard', 3)).toEqual([{ level: 1, slots: 4 }, { level: 2, slots: 2 }])
  })

  it('demi-lanceur (paladin, rôdeur), niveaux 1 à 20 (PHB)', () => {
    const table = [
      [], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2],
      [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2],
      [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2],
    ]
    expect(table.map((_, i) => slotCounts('paladin', i + 1))).toEqual(table)
    expect(table.map((_, i) => slotCounts('ranger', i + 1))).toEqual(table)
  })

  it('tiers-lanceur (Chevalier occulte, Escroc arcanique), niveaux 1 à 20 (PHB)', () => {
    const table = [
      [], [], [2], [3], [3], [3], [4, 2], [4, 2], [4, 2], [4, 3],
      [4, 3], [4, 3], [4, 3, 2], [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1],
    ]
    expect(table.map((_, i) => slotCounts('fighter', i + 1, true))).toEqual(table)
    expect(table.map((_, i) => slotCounts('rogue', i + 1, true))).toEqual(table)
    expect(slotCounts('rogue', 10)).toEqual([])
    expect(slotCounts('barbarian', 10, true)).toEqual([])
  })

  it('magie de pacte (Zanna, occultiste 3 : 2 emplacements de niveau 2)', () => {
    expect(spellSlots('warlock', 3)).toEqual([{ level: 2, slots: 2 }])
    expect(spellSlots('warlock', 1)).toEqual([{ level: 1, slots: 1 }])
    expect(spellSlots('warlock', 9)).toEqual([{ level: 5, slots: 2 }])
    expect(spellSlots('warlock', 11)).toEqual([{ level: 5, slots: 3 }])
    expect(spellSlots('warlock', 20)).toEqual([{ level: 5, slots: 4 }])
    expect(slotsRefreshOnShortRest('warlock')).toBe(true)
    expect(slotsRefreshOnShortRest('wizard')).toBe(false)
  })

  it('classes sans sorts', () => {
    for (const classId of ['barbarian', 'monk'] as const) expect(spellSlots(classId, 20)).toEqual([])
  })
})

describe('points de vie', () => {
  it('moyenne PHB (cas de l\'audit)', () => {
    expect(averageMaxHp('ranger', 6, 2)).toBe(52) // Dareth
    expect(averageMaxHp('sorcerer', 4, 2)).toBe(26) // Skamos, sans résilience draconique
    expect(averageMaxHp('warlock', 3, 0)).toBe(18) // Zanna
    expect(averageMaxHp('paladin', 4, 3)).toBe(40) // Maera
    expect(averageMaxHp('wizard', 4, 2)).toBe(26) // Thunon
    expect(averageMaxHp('rogue', 4, 1)).toBe(27) // Kael
  })

  it('niveau 1 : maximum du dé + Con', () => {
    expect(averageMaxHp('barbarian', 1, 3)).toBe(15)
  })

  it('ténacité naine : +1 PV par niveau', () => {
    expect(averageMaxHp('cleric', 3, 1, 'hill-dwarf')).toBe(8 + 2 * 5 + 3 * 2)
    expect(averageMaxHp('cleric', 3, 1, 'mountain-dwarf')).toBe(8 + 2 * 5 + 3)
  })

  it('dés de vie : dé de la classe × niveau', () => {
    expect(hitDice('ranger', 6)).toEqual({ die: 10, total: 6 })
    expect(hitDice('wizard', 4)).toEqual({ die: 6, total: 4 })
  })
})

describe('armes', () => {
  it('maîtrise par catégorie, liste de classe ou race', () => {
    expect(isWeaponProficient('longbow', 'ranger')).toBe(true)
    expect(isWeaponProficient('rapier', 'rogue')).toBe(true)
    expect(isWeaponProficient('greatsword', 'rogue')).toBe(false)
    expect(isWeaponProficient('longbow', 'wizard')).toBe(false)
    expect(isWeaponProficient('longbow', 'wizard', 'high-elf')).toBe(true)
    expect(isWeaponProficient('warhammer', 'wizard', 'hill-dwarf')).toBe(true)
    expect(isWeaponProficient('scimitar', 'druid')).toBe(true)
  })

  const attack = (over: Partial<Parameters<typeof weaponAttack>[0]>) => weaponAttack({
    weaponId: 'longbow', classId: 'ranger', level: 6, mods: { strength: 0, dexterity: 4 }, pb: 3, proficient: true, ...over,
  })

  it('arme à distance : Dex (Dareth, arc long : +7, 1d8+4)', () => {
    const result = attack({})
    expect(result.attackBonus).toBe(7)
    expect(result.damage).toEqual({ count: 1, die: 8, bonus: 4 })
    expect(result.damageType).toBe('piercing')
  })

  it('finesse : la meilleure de For et Dex (Zanna, dague : +3, 1d4+1)', () => {
    const result = attack({ weaponId: 'dagger', classId: 'warlock', mods: { strength: -2, dexterity: 1 }, pb: 2 })
    expect(result.attackBonus).toBe(3)
    expect(result.damage).toEqual({ count: 1, die: 4, bonus: 1 })
  })

  it('corps à corps sans finesse : For, même avec une meilleure Dex (Zanna, masse : +0, 1d6−2)', () => {
    const result = attack({ weaponId: 'mace', classId: 'warlock', mods: { strength: -2, dexterity: 1 }, pb: 2 })
    expect(result.attackBonus).toBe(0)
    expect(result.damage).toEqual({ count: 1, die: 6, bonus: -2 })
    expect(result.ability).toBe('strength')
  })

  it('arme de lancer sans finesse : For', () => {
    expect(attack({ weaponId: 'javelin', mods: { strength: 3, dexterity: 1 } }).ability).toBe('strength')
  })

  it('sans maîtrise : pas de PB', () => {
    expect(attack({ proficient: false }).attackBonus).toBe(4)
  })

  it('arts martiaux du moine : Dex avec une arme de moine', () => {
    const monk = { classId: 'monk' as const, mods: { strength: 1, dexterity: 4 } }
    expect(attack({ ...monk, weaponId: 'quarterstaff' }).ability).toBe('dexterity')
    expect(attack({ ...monk, weaponId: 'greatclub' }).ability).toBe('strength')
    expect(attack({ classId: 'fighter', weaponId: 'quarterstaff', mods: { strength: 1, dexterity: 4 } }).ability).toBe('strength')
  })

  it('polyvalente, ajustements, arme sans dégâts', () => {
    const sword = attack({ weaponId: 'longsword', mods: { strength: 3, dexterity: 0 }, attackAdjust: 1, damageAdjust: 1 })
    expect(sword.attackBonus).toBe(7)
    expect(sword.damage).toEqual({ count: 1, die: 8, bonus: 4 })
    expect(sword.versatile).toEqual({ count: 1, die: 10, bonus: 4 })
    expect(attack({ weaponId: 'net' }).damage).toBeUndefined()
  })
})

describe('tables', () => {
  it('chaque identifiant a un nom français', () => {
    const keys = [
      ...CLASS_IDS.map(id => `rules.class.${id}`),
      ...RACE_IDS.map(id => `rules.race.${id}`),
      ...ARMOR_IDS.map(id => `rules.armor.${id}`),
      ...WEAPON_IDS.map(id => `rules.weapon.${id}`),
      ...SKILL_KEYS.map(id => `rules.skill.${id}`),
    ]
    expect(keys.filter(key => !hasMessage(key))).toEqual([])
  })

  it('12 classes, 14 races et sous-races, 12 armures, 37 armes, 18 compétences', () => {
    expect([CLASS_IDS.length, RACE_IDS.length, ARMOR_IDS.length, WEAPON_IDS.length, SKILL_KEYS.length]).toEqual([12, 14, 12, 37, 18])
  })

  it('getRuleset renvoie le moteur 5e 2014', () => {
    expect(getRuleset('dnd5e-2014').proficiencyBonus(5)).toBe(3)
  })
})
