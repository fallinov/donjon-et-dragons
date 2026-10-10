<script setup lang="ts">
import { t } from '~/composables/useT'
</script>

<template>
  <div>
    <NuxtPwaManifest />
    <NuxtRouteAnnouncer />
    <a href="#contenu" class="skip-link">{{ t('common.skipLink') }}</a>
    <NuxtPage />
    <ConfirmDialog />
    <PwaUpdateToast />
  </div>
</template>
