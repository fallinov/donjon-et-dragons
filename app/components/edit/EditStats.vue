<script setup lang="ts">
import { computed } from 'vue'
import type { Character, HitDieSize } from '~~/shared/types/character'
import { t } from '~/composables/useT'
import { errorFor, type ValidationError } from '~/utils/validateCharacter'
import { findVital } from '~/utils/vitals'

defineProps<{ errors: ValidationError[] }>()
const character = defineModel<Character>({ required: true })

const hitDieOptions = ([6, 8, 10, 12] as HitDieSize[]).map(die => ({ value: die, label: `d${die}` }))

// Les trois vitals existent toujours dans un brouillon (useCharacterDraft.start)
const armorClass = computed(() => findVital(character.value, 'armorClass')!)
const initiative = computed(() => findVital(character.value, 'initiative')!)
const speed = computed(() => findVital(character.value, 'speed')!)

/** Vision nocturne : champ vide = pas de vision nocturne. */
const darkvision = computed({
  get: () => character.value.darkvision ?? Number.NaN,
  set: (value: number) => { character.value.darkvision = Number.isNaN(value) ? undefined : value },
})
</script>

<template>
  <EditSection id="edit-stats" :title="t('editor.section.stats')" :hint="t('editor.derivedHint')">
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <EditNumber v-model="character.proficiencyBonus" :label="t('field.proficiencyBonus')" signed :error="errorFor(errors, 'proficiencyBonus')" />
      <EditNumber v-model="character.maxHp" :label="t('field.maxHp')" required :error="errorFor(errors, 'maxHp')" />
      <EditSelect v-model="character.hitDice.die" :label="t('field.hitDie')" :options="hitDieOptions" :error="errorFor(errors, 'hitDice.die')" />
      <EditNumber v-model="character.hitDice.total" :label="t('field.hitDiceTotal')" :error="errorFor(errors, 'hitDice.total')" />
      <EditText v-model="armorClass.value" :label="t('field.armorClass')" />
      <EditText v-model="initiative.value" :label="t('field.initiative')" />
      <div class="col-span-2 grid grid-cols-[minmax(0,1fr)_5rem] gap-2 sm:col-span-1">
        <EditText v-model="speed.value" :label="t('field.speed')" />
        <EditText v-model="speed.unit!" :label="t('field.speedUnit')" />
      </div>
      <EditNumber v-model="darkvision" class="col-span-2 sm:col-span-1" :label="t('field.darkvision')" :hint="t('field.darkvisionHint')" :error="errorFor(errors, 'darkvision')" />
    </div>
  </EditSection>
</template>
