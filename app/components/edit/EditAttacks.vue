<script setup lang="ts">
import type { Attack, Character } from '~~/shared/types/character'
import { t } from '~/composables/useT'
import { errorFor, type ValidationError } from '~/utils/validateCharacter'

defineProps<{ errors: ValidationError[] }>()
const character = defineModel<Character>({ required: true })

const createAttack = (): Attack => ({ name: '', note: '', attackBonus: '', damage: '', damageType: '' })
</script>

<template>
  <EditSection id="edit-attacks" :title="t('editor.section.attacks')" :hint="t('editor.derivedHint')">
    <EditList v-model="character.attacks" collapsible :invalid="i => errors.some(e => e.path.startsWith(`attacks.${i}.`))" :add-label="t('editor.add')" :item-name="attack => attack.name" :create="createAttack">
      <template #default="{ item: attack, index }">
        <div class="grid gap-3 sm:grid-cols-2">
          <EditText v-model="attack.name" :label="t('field.attackName')" :error="errorFor(errors, `attacks.${index}.name`)" />
          <EditText v-model="attack.note" :label="t('field.attackNote')" :hint="t('field.attackNoteHint')" />
          <EditText v-model="attack.attackBonus" :label="t('field.attackBonus')" :hint="t('field.attackBonusHint')" />
          <div class="grid grid-cols-2 gap-2">
            <EditText v-model="attack.damage" :label="t('field.damage')" />
            <EditText v-model="attack.damageType" :label="t('field.damageType')" />
          </div>
        </div>
      </template>
    </EditList>
  </EditSection>
</template>
