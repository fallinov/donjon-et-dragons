<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { Character } from '~~/shared/types/character'
import { hasMessage, t } from '~/composables/useT'
import type { ValidationError } from '~/utils/validateCharacter'

const props = defineProps<{
  title: string
  errors: ValidationError[]
  saving: boolean
  saveFailed: boolean
}>()
const emit = defineEmits<{ save: [], cancel: [] }>()
const character = defineModel<Character>({ required: true })

const showErrors = ref(false)
const summary = ref<HTMLElement>()
const visibleErrors = computed(() => showErrors.value ? props.errors : [])

const ABILITY_FIELDS: Record<string, string> = {
  score: t('field.score'),
  modifier: t('field.modifier'),
  saveModifier: t('field.saveModifier'),
}

/** Libellé lisible d'un champ en erreur (récapitulatif). */
function fieldName(path: string): string {
  const [head = '', first = '', second = ''] = path.split('.')
  if (head === 'abilities') {
    const ability = character.value.abilities[first as keyof Character['abilities']]
    return `${ability?.label ?? first} · ${ABILITY_FIELDS[second] ?? second}`
  }
  if (head === 'skills') return `${t('field.skillName')} ${Number(first) + 1}`
  if (head === 'languages') return `${t('field.languageName')} ${Number(first) + 1}`
  if (head === 'hitDice') return first === 'die' ? t('field.hitDie') : t('field.hitDiceTotal')
  const position = (label: string, at: string): string => `${label} ${Number(at) + 1}`
  if (head === 'features') {
    return second === 'benefits' ? `${position(t('field.featureTitle'), first)} · ${position(t('field.benefit'), path.split('.')[3] ?? '0')}` : position(t('field.featureTitle'), first)
  }
  if (head === 'attacks') return position(t('field.attackName'), first)
  if (head === 'rituals') return position(t('field.ritualNumber'), first)
  if (head === 'spellcasting') {
    const [, , at = '0', field = ''] = path.split('.')
    if (first === 'saveDc') return t('field.saveDc')
    if (first === 'attackBonus') return t('field.spellAttackBonus')
    if (first === 'slotLevels') return `${t('editor.subsection.slots')} ${Number(at) + 1} · ${field === 'slots' ? t('field.slotCount') : t('field.slotLevel')}`
    return `${t('field.spellTitle')} ${Number(at) + 1}${field === 'level' ? ` · ${t('field.spellLevel')}` : ''}`
  }
  const key = `field.${head}`
  return hasMessage(key) ? t(key) : path
}

async function submit(): Promise<void> {
  if (props.errors.length) {
    showErrors.value = true
    await nextTick()
    summary.value?.focus()
    return
  }
  emit('save')
}
</script>

<template>
  <form class="space-y-8 pb-28 sm:space-y-6" novalidate @submit.prevent="submit">
    <h1 class="font-display uppercase tracking-wider-2 text-gold-bright text-[clamp(1.5rem,6vw,2.5rem)]">{{ title }}</h1>

    <div
      v-if="visibleErrors.length"
      ref="summary"
      tabindex="-1"
      role="alert"
      class="border border-ember/60 bg-blood/30 p-4 text-parchment"
      data-error-summary
    >
      <p class="font-display text-sm tracking-wider-2 uppercase text-ember-light mb-2">{{ t('editor.errorsTitle') }}</p>
      <ul class="list-disc pl-5 text-base">
        <li v-for="error in visibleErrors" :key="error.path">{{ fieldName(error.path) }} — {{ t(error.message) }}</li>
      </ul>
    </div>

    <EditIdentity v-model="character" :errors="visibleErrors" />
    <EditPortrait v-model="character" />
    <EditStats v-model="character" :errors="visibleErrors" />
    <EditAbilities v-model="character" :errors="visibleErrors" />
    <EditSkills v-model="character" :errors="visibleErrors" />
    <EditFeatures v-model="character" :errors="visibleErrors" />
    <EditAttacks v-model="character" :errors="visibleErrors" />
    <EditSpellcasting v-model="character" :errors="visibleErrors" />
    <EditRituals v-model="character" :errors="visibleErrors" />
    <EditLanguages v-model="character" :errors="visibleErrors" />
    <EditPersonality v-model="character" />

    <div class="fixed bottom-0 left-0 right-0 z-30 border-t border-gold/30 bg-charcoal/95 backdrop-blur-md edit-bar">
      <div class="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <p v-if="saveFailed" role="alert" class="flex-1 text-sm text-ember-light">{{ t('editor.saveError') }}</p>
        <span v-else class="flex-1" />
        <button
          type="button"
          class="min-h-11 border border-gold/30 px-4 font-display text-sm tracking-wider-2 uppercase text-parchment-dim hover:text-gold-bright transition-colors"
          @click="emit('cancel')"
        >{{ t('editor.cancel') }}</button>
        <button
          type="submit"
          :disabled="saving"
          class="min-h-11 border border-gold/60 bg-gold/15 px-5 font-display text-sm tracking-wider-2 uppercase text-gold-bright hover:bg-gold/25 disabled:opacity-50 transition-colors"
        >{{ saving ? t('editor.saving') : t('editor.save') }}</button>
      </div>
    </div>
  </form>
</template>

<style scoped>
.edit-bar {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
