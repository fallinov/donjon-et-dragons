<script setup lang="ts">
import { computed } from 'vue'
import type { Character, Spell, SpellCost, SpellSlotLevel } from '~~/shared/types/character'
import { t, type MessageKey } from '~/composables/useT'
import { fillSpellTexts } from '~/composables/useCharacterDraft'
import { errorFor, type ValidationError } from '~/utils/validateCharacter'

defineProps<{ errors: ValidationError[] }>()
const character = defineModel<Character>({ required: true })

const COSTS: SpellCost[] = ['cantrip', 'slot', 'daily']
const costOptions = COSTS.map(value => ({ value, label: t(`spellCost.${value}` as MessageKey) }))

/** Lanceur de sorts : décocher retire tout le bloc sorts de la fiche. */
const isCaster = computed({
  get: () => character.value.spellcasting !== undefined,
  set: (enabled: boolean) => {
    // DD vide (NaN) : à saisir, aucune valeur inventée
    character.value.spellcasting = enabled ? { saveDc: Number.NaN, slotLevels: [], spells: [] } : undefined
  },
})

const attackBonus = computed({
  get: () => character.value.spellcasting?.attackBonus ?? Number.NaN,
  set: (value: number) => {
    if (character.value.spellcasting) character.value.spellcasting.attackBonus = Number.isNaN(value) ? undefined : value
  },
})

const shortRestRefresh = computed({
  get: () => character.value.spellcasting?.shortRestRefresh ?? false,
  set: (value: boolean) => {
    if (character.value.spellcasting) character.value.spellcasting.shortRestRefresh = value
  },
})

const createSlot = (): SpellSlotLevel => ({ level: Number.NaN, slots: 0 })
const createSpell = (): Spell => fillSpellTexts({ title: '', description: '', level: 0, cost: 'cantrip' })
</script>

<template>
  <EditSection id="edit-spellcasting" :title="t('editor.section.spellcasting')">
    <EditCheckbox v-model="isCaster" :label="t('field.isCaster')" />

    <div v-if="character.spellcasting" class="mt-4 space-y-6">
      <div class="grid grid-cols-2 gap-4">
        <EditNumber v-model="character.spellcasting.saveDc" :label="t('field.saveDc')" required :error="errorFor(errors, 'spellcasting.saveDc')" />
        <EditNumber v-model="attackBonus" signed :label="t('field.spellAttackBonus')" :hint="t('field.spellAttackBonusHint')" :error="errorFor(errors, 'spellcasting.attackBonus')" />
      </div>
      <EditCheckbox v-model="shortRestRefresh" :label="t('field.shortRestRefresh')" />

      <fieldset>
        <legend class="font-display text-xs tracking-wider-3 text-gold/80 uppercase mb-2">{{ t('editor.subsection.slots') }}</legend>
        <EditList
          v-model="character.spellcasting.slotLevels"
          :add-label="t('editor.add')"
          :item-name="slot => Number.isNaN(slot.level) ? '' : t('spells.slotLevel', { level: slot.level })"
          :create="createSlot"
        >
          <template #default="{ item: slot, index }">
            <div class="grid grid-cols-2 gap-2">
              <EditNumber v-model="slot.level" :label="t('field.slotLevel')" :error="errorFor(errors, `spellcasting.slotLevels.${index}.level`)" />
              <EditNumber v-model="slot.slots" :label="t('field.slotCount')" :error="errorFor(errors, `spellcasting.slotLevels.${index}.slots`)" />
            </div>
          </template>
        </EditList>
      </fieldset>

      <fieldset>
        <legend class="font-display text-xs tracking-wider-3 text-gold/80 uppercase mb-2">{{ t('editor.subsection.spells') }}</legend>
        <EditList v-model="character.spellcasting.spells" collapsible :invalid="i => errors.some(e => e.path.startsWith(`spellcasting.spells.${i}.`))" :add-label="t('editor.add')" :item-name="spell => spell.title" :create="createSpell">
          <template #default="{ item: spell, index }">
            <div class="grid gap-3 sm:grid-cols-2">
              <EditText v-model="spell.title" :label="t('field.spellTitle')" :error="errorFor(errors, `spellcasting.spells.${index}.title`)" />
              <div class="grid grid-cols-2 gap-2">
                <EditNumber v-model="spell.level" :label="t('field.spellLevel')" :error="errorFor(errors, `spellcasting.spells.${index}.level`)" />
                <EditSelect v-model="spell.cost" :label="t('field.spellCost')" :options="costOptions" />
              </div>
              <EditText v-model="spell.description" class="sm:col-span-2" multiline :rows="2" :label="t('field.spellDescription')" />
              <EditText v-model="spell.castingTime!" :label="t('field.castingTime')" />
              <EditText v-model="spell.range!" :label="t('field.range')" />
              <EditText v-model="spell.duration!" :label="t('field.duration')" />
              <EditCheckbox :model-value="spell.concentration ?? false" :label="t('field.concentration')" @update:model-value="spell.concentration = $event" />
              <EditText v-model="spell.check!" :label="t('field.check')" :hint="t('field.checkHint')" />
              <EditText v-model="spell.effect!" :label="t('field.effect')" :hint="t('field.effectHint')" />
            </div>
          </template>
        </EditList>
      </fieldset>
    </div>
  </EditSection>
</template>
