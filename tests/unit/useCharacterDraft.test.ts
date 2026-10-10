import { describe, expect, it } from 'vitest'
import { useCharacterDraft } from '~/composables/useCharacterDraft'
import { findVital } from '~/utils/vitals'
import { darethBrumeval } from '../helpers/characters'

describe('useCharacterDraft', () => {
  it('démarre propre, devient modifié puis revient à l\'état initial', () => {
    const { draft, dirty, start, reset } = useCharacterDraft()
    start(darethBrumeval)
    expect(dirty.value).toBe(false)
    draft.value!.level = 7
    expect(dirty.value).toBe(true)
    reset()
    expect(draft.value!.level).toBe(6)
    expect(dirty.value).toBe(false)
  })

  it('ne modifie jamais la fiche source', () => {
    const { draft, start } = useCharacterDraft()
    start(darethBrumeval)
    draft.value!.skills[0]!.modifier = 99
    draft.value!.portrait.alt = 'autre'
    expect(darethBrumeval.skills[0]!.modifier).not.toBe(99)
    expect(darethBrumeval.portrait.alt).not.toBe('autre')
  })

  it('ajoute les vitals manquants sans marquer le brouillon comme modifié', () => {
    const { draft, dirty, start } = useCharacterDraft()
    start({ ...darethBrumeval, vitals: [] })
    expect(findVital(draft.value!, 'armorClass')).toEqual({ label: "Classe d'armure", value: '' })
    expect(findVital(draft.value!, 'speed')).toBeDefined()
    expect(dirty.value).toBe(false)
  })

  it('valide le brouillon en continu', () => {
    const { draft, errors, start } = useCharacterDraft()
    start(darethBrumeval)
    expect(errors.value).toEqual([])
    draft.value!.firstName = ''
    expect(errors.value.map(e => e.path)).toEqual(['firstName'])
  })

  it('détecte une modification imbriquée (compétence, portrait)', () => {
    const { draft, dirty, start } = useCharacterDraft()
    start(darethBrumeval)
    draft.value!.skills[2]!.proficient = !draft.value!.skills[2]!.proficient
    expect(dirty.value).toBe(true)
    draft.value!.skills[2]!.proficient = !draft.value!.skills[2]!.proficient
    expect(dirty.value).toBe(false)
    draft.value!.portrait.alt = 'Nouveau texte'
    expect(dirty.value).toBe(true)
  })

  it('commit fait du brouillon la nouvelle référence', () => {
    const { draft, dirty, start, commit } = useCharacterDraft()
    start(darethBrumeval)
    draft.value!.level = 8
    commit()
    expect(dirty.value).toBe(false)
  })
})
