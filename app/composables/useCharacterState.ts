import { watch, onMounted, ref, getCurrentInstance, type Ref } from 'vue'
import type { Character } from '~~/shared/types/character'

// Fallback si useState Nuxt n'est pas dispo (contexte test pur)
const useStateSafe = <T>(key: string, factory: () => T): Ref<T> => {
  const nuxtUseState = (globalThis as unknown as { useState?: <U>(key: string, factory: () => U) => Ref<U> }).useState
  if (nuxtUseState) return nuxtUseState<T>(key, factory)
  return ref(factory()) as Ref<T>
}

export interface CharacterState {
  hpCurrent: number
  hpTemp: number
  inspiration: number
  hitDiceUsed: number
  deathSaves: { successes: number, failures: number }
  /** Emplacements consommés par niveau (index 0 = niv 1, etc.) */
  spellSlotsUsed: number[]
  /** Sorts daily déjà utilisés (titres) */
  dailySpellsUsed: string[]
}

function storageKey(slug: string): string {
  return `codex:${slug}:state`
}

function defaultState(character: Character): CharacterState {
  return {
    hpCurrent: character.maxHp,
    hpTemp: 0,
    inspiration: 0,
    hitDiceUsed: 0,
    deathSaves: { successes: 0, failures: 0 },
    spellSlotsUsed: (character.spellcasting?.slotLevels ?? []).map(() => 0),
    dailySpellsUsed: [],
  }
}

function isValidState(value: unknown): value is CharacterState {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    typeof s.hpCurrent === 'number'
    && typeof s.hpTemp === 'number'
    && typeof s.inspiration === 'number'
    && typeof s.hitDiceUsed === 'number'
    && Array.isArray(s.spellSlotsUsed)
    && typeof s.deathSaves === 'object'
    && s.deathSaves !== null
  )
}

function loadState(character: Character): CharacterState {
  if (typeof window === 'undefined') return defaultState(character)
  try {
    const raw = window.localStorage.getItem(storageKey(character.slug))
    if (!raw) return defaultState(character)
    const parsed: unknown = JSON.parse(raw)
    if (!isValidState(parsed)) return defaultState(character)
    return parsed
  }
  catch {
    return defaultState(character)
  }
}

/**
 * État mutable d'un personnage, partagé via `useState` Nuxt (singleton par slug),
 * persisté côté client dans `localStorage`.
 */
export function useCharacterState(character: Character) {
  const state = useStateSafe<CharacterState>(
    `character-state:${character.slug}`,
    () => defaultState(character),
  )

  // Hydrate depuis localStorage côté client, seulement si appelé depuis un composant
  if (getCurrentInstance()) {
    onMounted(() => {
      state.value = loadState(character)
    })

    watch(
      state,
      (next) => {
        if (typeof window === 'undefined') return
        try {
          window.localStorage.setItem(storageKey(character.slug), JSON.stringify(next))
        }
        catch {
          // quota ou navigation privée — fail silencieusement
        }
      },
      { deep: true },
    )
  }

  // Actions
  function damage(amount: number): void {
    const n = Math.max(0, Math.floor(amount))
    if (state.value.hpTemp > 0) {
      const absorbed = Math.min(state.value.hpTemp, n)
      state.value.hpTemp -= absorbed
      state.value.hpCurrent = Math.max(0, state.value.hpCurrent - (n - absorbed))
    }
    else {
      state.value.hpCurrent = Math.max(0, state.value.hpCurrent - n)
    }
  }

  function heal(amount: number): void {
    const n = Math.max(0, Math.floor(amount))
    state.value.hpCurrent = Math.min(character.maxHp, state.value.hpCurrent + n)
    if (state.value.hpCurrent > 0) {
      state.value.deathSaves = { successes: 0, failures: 0 }
    }
  }

  function setTempHp(amount: number): void {
    state.value.hpTemp = Math.max(0, Math.floor(amount))
  }

  function addInspiration(): void {
    state.value.inspiration += 1
  }

  function useInspiration(): void {
    if (state.value.inspiration > 0) state.value.inspiration -= 1
  }

  function spendHitDie(): void {
    if (state.value.hitDiceUsed < character.hitDice.total) {
      state.value.hitDiceUsed += 1
    }
  }

  function restoreHitDie(): void {
    if (state.value.hitDiceUsed > 0) {
      state.value.hitDiceUsed -= 1
    }
  }

  /** Consomme un emplacement pour un niveau donné (index 0 = niv 1) */
  function consumeSlot(levelIndex: number): boolean {
    const levels = character.spellcasting?.slotLevels ?? []
    if (levelIndex < 0 || levelIndex >= levels.length) return false
    const max = levels[levelIndex]!.slots
    const used = state.value.spellSlotsUsed[levelIndex] ?? 0
    if (used >= max) return false
    state.value.spellSlotsUsed = state.value.spellSlotsUsed.map((v, i) => i === levelIndex ? v + 1 : v)
    return true
  }

  /** Marque un sort daily comme utilisé */
  function useDailySpell(title: string): boolean {
    if (state.value.dailySpellsUsed.includes(title)) return false
    state.value.dailySpellsUsed = [...state.value.dailySpellsUsed, title]
    return true
  }

  /** Lance un sort : consomme la ressource appropriée selon son cost */
  function castSpell(spell: { title: string, level: number, cost: string }): boolean {
    if (spell.cost === 'cantrip') return true
    if (spell.cost === 'daily') return useDailySpell(spell.title)
    if (spell.cost === 'slot') {
      const levels = character.spellcasting?.slotLevels ?? []
      const levelIndex = levels.findIndex(sl => sl.level === spell.level)
      return consumeSlot(levelIndex)
    }
    return false
  }

  function toggleDeathSaveSuccess(index: number): void {
    const current = state.value.deathSaves.successes
    state.value.deathSaves = {
      ...state.value.deathSaves,
      successes: index < current ? index : index + 1,
    }
  }

  function toggleDeathSaveFailure(index: number): void {
    const current = state.value.deathSaves.failures
    state.value.deathSaves = {
      ...state.value.deathSaves,
      failures: index < current ? index : index + 1,
    }
  }

  /**
   * Repos court D&D 5e :
   * - Restaure les emplacements de sort des occultistes uniquement
   */
  function shortRest(): void {
    if (character.spellcasting?.shortRestRefresh) {
      state.value.spellSlotsUsed = state.value.spellSlotsUsed.map(() => 0)
    }
  }

  /**
   * Repos long D&D 5e :
   * - HP remis au max
   * - HP temporaires remis à 0
   * - Tous les emplacements de sort restaurés
   * - Moitié du total de dés de vie récupérée (minimum 1)
   * - Jets de mort remis à 0
   */
  function longRest(): void {
    state.value.hpCurrent = character.maxHp
    state.value.hpTemp = 0
    state.value.spellSlotsUsed = state.value.spellSlotsUsed.map(() => 0)
    state.value.dailySpellsUsed = []
    state.value.deathSaves = { successes: 0, failures: 0 }
    const recovered = Math.max(1, Math.floor(character.hitDice.total / 2))
    state.value.hitDiceUsed = Math.max(0, state.value.hitDiceUsed - recovered)
  }

  return {
    state,
    damage,
    heal,
    setTempHp,
    addInspiration,
    useInspiration,
    spendHitDie,
    restoreHitDie,
    consumeSlot,
    useDailySpell,
    castSpell,
    toggleDeathSaveSuccess,
    toggleDeathSaveFailure,
    shortRest,
    longRest,
  }
}

/**
 * Calcule un sens passif selon les règles D&D 5e : 10 + mod carac + bonus maîtrise.
 */
function computePassiveSkill(character: Character, skillName: string): number {
  const skill = character.skills.find(s => s.name === skillName)
  if (!skill) return 10
  const abilityMap: Record<string, keyof typeof character.abilities> = {
    For: 'strength', Dex: 'dexterity', Con: 'constitution',
    Int: 'intelligence', Sag: 'wisdom', Cha: 'charisma',
  }
  const abilityKey = abilityMap[skill.ability] ?? 'wisdom'
  const mod = character.abilities[abilityKey].modifier
  const profBonus = skill.proficient ? character.proficiencyBonus : 0
  return 10 + mod + profBonus
}

export function computePassivePerception(character: Character): number {
  return computePassiveSkill(character, 'Perception')
}

export function computePassiveInvestigation(character: Character): number {
  return computePassiveSkill(character, 'Investigation')
}

export function computePassiveInsight(character: Character): number {
  return computePassiveSkill(character, 'Perspicacité') || computePassiveSkill(character, 'Intuition')
}
