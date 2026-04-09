import { describe, it, expect, beforeEach } from 'vitest'
import { useCharacterState, computePassivePerception } from '~/composables/useCharacterState'
import { darethBrumeval } from '~/data/characters/dareth-brumeval'
import { zanna } from '~/data/characters/zanna'

describe('computePassivePerception', () => {
  it('calcule 14 pour Dareth (sag +2, Perception maîtrise, bonus +2)', () => {
    expect(computePassivePerception(darethBrumeval)).toBe(14)
  })

  it('calcule 10 pour Zanna (sag 0, Perception non maîtrise)', () => {
    expect(computePassivePerception(zanna)).toBe(10)
  })
})

describe('useCharacterState — HP', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear()
  })

  it('initialise à hpMax', () => {
    const { state } = useCharacterState(darethBrumeval)
    expect(state.value.hpCurrent).toBe(33)
    expect(state.value.hpTemp).toBe(0)
  })

  it('damage décrémente les HP sans passer sous zéro', () => {
    const { state, damage } = useCharacterState(darethBrumeval)
    damage(10)
    expect(state.value.hpCurrent).toBe(23)
    damage(999)
    expect(state.value.hpCurrent).toBe(0)
  })

  it('damage consomme d\'abord les HP temporaires', () => {
    const { state, damage, setTempHp } = useCharacterState(darethBrumeval)
    setTempHp(5)
    damage(3)
    expect(state.value.hpTemp).toBe(2)
    expect(state.value.hpCurrent).toBe(33)
    damage(5)
    expect(state.value.hpTemp).toBe(0)
    expect(state.value.hpCurrent).toBe(30)
  })

  it('heal ne dépasse pas hpMax', () => {
    const { state, damage, heal } = useCharacterState(darethBrumeval)
    damage(10)
    heal(999)
    expect(state.value.hpCurrent).toBe(33)
  })

  it('heal au-dessus de 0 reset les jets de mort', () => {
    const { state, damage, heal, toggleDeathSaveSuccess } = useCharacterState(darethBrumeval)
    damage(999)
    toggleDeathSaveSuccess(0)
    toggleDeathSaveSuccess(1)
    expect(state.value.deathSaves.successes).toBe(2)
    heal(5)
    expect(state.value.deathSaves.successes).toBe(0)
  })
})

describe('useCharacterState — jets de mort', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear()
  })

  it('toggleDeathSaveSuccess bascule de coché à décoché', () => {
    const { state, toggleDeathSaveSuccess } = useCharacterState(darethBrumeval)
    toggleDeathSaveSuccess(0)
    expect(state.value.deathSaves.successes).toBe(1)
    toggleDeathSaveSuccess(1)
    expect(state.value.deathSaves.successes).toBe(2)
    toggleDeathSaveSuccess(1)
    expect(state.value.deathSaves.successes).toBe(1)
  })
})

describe('useCharacterState — repos', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear()
  })

  it('longRest restaure HP, slots, HP temp, daily et reset jets de mort', () => {
    const { state, damage, setTempHp, consumeSlot, toggleDeathSaveFailure, longRest } = useCharacterState(darethBrumeval)
    damage(20)
    setTempHp(4)
    consumeSlot(0)
    toggleDeathSaveFailure(0)
    state.value.dailySpellsUsed = ['test']
    longRest()
    expect(state.value.hpCurrent).toBe(33)
    expect(state.value.hpTemp).toBe(0)
    expect(state.value.spellSlotsUsed[0]).toBe(0)
    expect(state.value.dailySpellsUsed).toEqual([])
    expect(state.value.deathSaves.failures).toBe(0)
  })

  it('longRest récupère la moitié des dés de vie (min 1)', () => {
    const { state, spendHitDie, longRest } = useCharacterState(darethBrumeval)
    spendHitDie()
    spendHitDie()
    spendHitDie()
    expect(state.value.hitDiceUsed).toBe(3)
    longRest()
    // dareth total 4, récupère 2, 3 - 2 = 1
    expect(state.value.hitDiceUsed).toBe(1)
  })

  it('shortRest restaure les emplacements de sort pour un occultiste', () => {
    const { state, consumeSlot, shortRest } = useCharacterState(zanna)
    consumeSlot(0)
    consumeSlot(0)
    expect(state.value.spellSlotsUsed[0]).toBe(2)
    shortRest()
    expect(state.value.spellSlotsUsed[0]).toBe(0)
  })

  it('shortRest ne restaure PAS les emplacements pour un non-occultiste', () => {
    const { state, consumeSlot, shortRest } = useCharacterState(darethBrumeval)
    consumeSlot(0)
    shortRest()
    expect(state.value.spellSlotsUsed[0]).toBe(1)
  })
})

describe('useCharacterState — inspiration', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear()
  })

  it('commence à 0 et s\'incrémente/décrémente', () => {
    const { state, addInspiration, useInspiration } = useCharacterState(darethBrumeval)
    expect(state.value.inspiration).toBe(0)
    addInspiration()
    addInspiration()
    expect(state.value.inspiration).toBe(2)
    useInspiration()
    expect(state.value.inspiration).toBe(1)
  })

  it('ne descend pas sous 0', () => {
    const { state, useInspiration } = useCharacterState(darethBrumeval)
    useInspiration()
    expect(state.value.inspiration).toBe(0)
  })
})

describe('useCharacterState — dés de vie', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear()
  })

  it('spendHitDie incrémente le compteur sans dépasser le total', () => {
    const { state, spendHitDie } = useCharacterState(darethBrumeval)
    for (let i = 0; i < 10; i++) spendHitDie()
    expect(state.value.hitDiceUsed).toBe(4) // Dareth a 4 dés de vie
  })
})
