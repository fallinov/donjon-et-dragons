<script setup lang="ts">
import type { Personality } from '~~/shared/types/character'
import { t } from '~/composables/useT'

defineProps<{ personality: Personality }>()
</script>

<template>
  <dl class="space-y-3 text-parchment-dim">
    <div>
      <dt class="font-display text-xs tracking-wider-4 text-gold uppercase mb-1">{{ t('personality.trait') }}</dt>
      <dd>{{ personality.trait }}</dd>
    </div>
    <div>
      <dt class="font-display text-xs tracking-wider-4 text-gold uppercase mb-1">
        {{ t('personality.ideal') }}<span v-if="personality.idealLabel"> — {{ personality.idealLabel }}</span>
      </dt>
      <dd>{{ personality.ideal }}</dd>
    </div>
    <div>
      <dt class="font-display text-xs tracking-wider-4 text-gold uppercase mb-1">{{ t('personality.bond') }}</dt>
      <dd>{{ personality.bond }}</dd>
    </div>
    <div>
      <dt class="font-display text-xs tracking-wider-4 text-gold uppercase mb-1">{{ t('personality.flaw') }}</dt>
      <dd>{{ personality.flaw }}</dd>
    </div>
  </dl>
</template>
