<script setup lang="ts">
import type { Character, Skill } from '~~/shared/types/character'
import { t, type MessageKey } from '~/composables/useT'
import { errorFor, type ValidationError } from '~/utils/validateCharacter'

defineProps<{ errors: ValidationError[] }>()
const character = defineModel<Character>({ required: true })

const ABILITIES: Skill['ability'][] = ['For', 'Dex', 'Con', 'Int', 'Sag', 'Cha']
const abilityOptions = ABILITIES.map(value => ({ value, label: t(`abilityShort.${value}` as MessageKey) }))

/** Ligne repliée : « Discrétion · Dex · +7 ● » (● = maîtrise). */
function skillSummary(skill: Skill): string {
  if (!skill.name.trim()) return ''
  const mod = Number.isNaN(skill.modifier) ? '?' : skill.modifier >= 0 ? `+${skill.modifier}` : String(skill.modifier)
  return `${skill.name} · ${t(`abilityShort.${skill.ability}` as MessageKey)} · ${mod}${skill.proficient ? ' ●' : ''}`
}

const createSkill = (): Skill => ({ name: '', ability: 'Dex', modifier: 0, proficient: false })
</script>

<template>
  <EditSection id="edit-skills" :title="t('editor.section.skills')" :hint="t('editor.derivedHint')">
    <EditList
      v-model="character.skills"
      :add-label="t('editor.add')"
      collapsible
      :invalid="i => errors.some(e => e.path.startsWith(`skills.${i}.`))"
      :item-name="skillSummary"
      :create="createSkill"
    >
      <template #default="{ item, index }">
        <div class="grid grid-cols-[minmax(0,1fr)_6rem] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_auto]">
          <EditText v-model="item.name" :label="t('field.skillName')" :error="errorFor(errors, `skills.${index}.name`)" />
          <EditSelect v-model="item.ability" :label="t('field.skillAbility')" :short="t('field.skillAbilityShort')" :options="abilityOptions" />
          <EditNumber v-model="item.modifier" signed :label="t('field.modifier')" :short="t('field.modifierShort')" :error="errorFor(errors, `skills.${index}.modifier`)" />
          <EditCheckbox v-model="item.proficient" :label="t('field.proficient')" />
        </div>
      </template>
    </EditList>
  </EditSection>
</template>
