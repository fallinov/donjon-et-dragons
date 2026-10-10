<script setup lang="ts">
import type { Character } from '~~/shared/types/character'
import { t } from '~/composables/useT'
import { ABILITY_KEYS } from '~/utils/characterFactory'
import { errorFor, type ValidationError } from '~/utils/validateCharacter'

defineProps<{ errors: ValidationError[] }>()
const character = defineModel<Character>({ required: true })
</script>

<template>
  <EditSection id="edit-abilities" :title="t('editor.section.abilities')" :hint="t('editor.derivedHint')">
    <div class="grid gap-3 lg:grid-cols-2">
      <fieldset
        v-for="key in ABILITY_KEYS"
        :key="key"
        class="border border-gold/25 bg-charcoal/40 p-3"
        :data-ability="key"
      >
        <legend class="px-1 font-display text-sm tracking-wider-3 text-gold-bright uppercase">{{ character.abilities[key].label }}</legend>
        <div class="grid grid-cols-3 gap-2">
          <EditNumber v-model="character.abilities[key].score" :label="t('field.score')" :error="errorFor(errors, `abilities.${key}.score`)" />
          <EditNumber v-model="character.abilities[key].modifier" signed :label="t('field.modifier')" :short="t('field.modifierShort')" :error="errorFor(errors, `abilities.${key}.modifier`)" />
          <EditNumber v-model="character.abilities[key].saveModifier" signed :label="t('field.saveModifier')" :short="t('field.saveModifierShort')" :error="errorFor(errors, `abilities.${key}.saveModifier`)" />
        </div>
        <EditCheckbox v-model="character.abilities[key].proficient" :label="t('field.proficient')" />
      </fieldset>
    </div>
  </EditSection>
</template>
