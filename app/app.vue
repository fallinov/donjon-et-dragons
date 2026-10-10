<script setup lang="ts">
import { t } from '~/composables/useT'
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <a href="#contenu" class="skip-link">{{ t('common.skipLink') }}</a>
    <NuxtPage />
    <ConfirmDialog />
  </div>
</template>
