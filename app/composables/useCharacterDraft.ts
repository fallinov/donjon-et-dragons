import { computed, ref, shallowRef } from 'vue'
import type { Character, Spell } from '~~/shared/types/character'
import { deepEqual } from '~/utils/deepEqual'
import { toPlain } from '~/utils/toPlain'
import { validateCharacter } from '~/utils/validateCharacter'
import { ensureVital, VITAL_LABELS, type VitalKey } from '~/utils/vitals'

const EDITED_VITALS: VitalKey[] = ['armorClass', 'initiative', 'speed']

/** Textes facultatifs d'un sort : chaîne vide plutôt qu'absents (champs de l'éditeur). */
export function fillSpellTexts(spell: Spell): Spell {
  spell.castingTime ??= ''
  spell.range ??= ''
  spell.duration ??= ''
  spell.check ??= ''
  spell.effect ??= ''
  spell.concentration ??= false
  return spell
}

/** Brouillon d'édition d'une fiche : copie modifiable, détection des changements, validation. */
export function useCharacterDraft() {
  const original = shallowRef<Character>()
  const draft = ref<Character>()

  /** Démarre l'édition d'une fiche (la fiche source n'est jamais modifiée). */
  function start(source: Character): void {
    const plain = structuredClone(toPlain(source))
    // L'éditeur propose toujours CA, initiative et vitesse
    for (const key of EDITED_VITALS) ensureVital(plain, key)
    // Champs texte facultatifs : chaîne vide plutôt qu'absents (l'affichage les traite pareil)
    plain.lastName ??= ''
    plain.personality.idealLabel ??= ''
    const speed = plain.vitals.find(vital => vital.label === VITAL_LABELS.speed)
    if (speed) speed.unit ??= ''
    plain.ritualsNote ??= ''
    for (const feature of plain.features) feature.benefits ??= []
    for (const spell of plain.spellcasting?.spells ?? []) fillSpellTexts(spell)
    for (const ritual of plain.rituals) {
      ritual.footnote ??= ''
      for (const step of ritual.steps) step.emphasis ??= ''
    }
    original.value = structuredClone(plain)
    draft.value = structuredClone(plain)
  }

  /** Annule les modifications. */
  function reset(): void {
    if (original.value) draft.value = structuredClone(original.value)
  }

  /** Le brouillon courant devient la référence (après enregistrement). */
  function commit(): void {
    if (draft.value) original.value = structuredClone(toPlain(draft.value))
  }

  const dirty = computed(() => Boolean(draft.value && original.value && !deepEqual(draft.value, original.value)))
  const errors = computed(() => draft.value ? validateCharacter(draft.value) : [])

  return { draft, dirty, errors, start, reset, commit }
}
