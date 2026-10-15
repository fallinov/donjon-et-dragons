<script setup lang="ts">
import { t } from '~/composables/useT'

defineProps<{ title: string, intro?: string }>()
</script>

<template>
  <main id="contenu" class="font-body text-parchment min-h-screen px-4 py-10 sm:px-8 sm:py-16 relative z-10">
    <div class="mx-auto max-w-md">
      <NuxtLink to="/" class="inline-flex min-h-11 items-center font-display text-sm tracking-wider-2 uppercase text-gold hover:text-gold-bright">
        <span aria-hidden="true" class="mr-2">←</span>{{ t('auth.back') }}
      </NuxtLink>
      <h1 class="mt-4 mb-3 font-display uppercase tracking-wider-2 font-normal text-gold-bright text-[clamp(1.75rem,6vw,2.5rem)]">{{ title }}</h1>
      <p v-if="intro" class="text-parchment-dim leading-snug mb-6">{{ intro }}</p>
      <slot />
    </div>
  </main>
</template>
