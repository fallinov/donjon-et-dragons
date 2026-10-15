<script setup lang="ts">
import { ref } from 'vue'
import { t, tCount, type MessageKey } from '~/composables/useT'
import { useSync } from '~/composables/useSync'
import { countOutbox } from '~/db/syncRepository'
import { AUTH_SECONDARY } from '~/utils/authUi'

/** Compte connecté sur l'accueil : état de la synchronisation, liens et déconnexion. */
const { user, logout } = useAuth()
const { status, pending } = useSync()
const { confirm } = useConfirm()
const error = ref<MessageKey>()

async function signOut(): Promise<void> {
  const waiting = await countOutbox()
  const ok = await confirm({
    title: t('sync.logoutTitle'),
    message: waiting ? `${t('sync.logoutMessage')} ${t('sync.logoutPending')}` : t('sync.logoutMessage'),
    confirmLabel: t('auth.bar.signOut'),
    cancelLabel: t('actions.cancel'),
    danger: waiting > 0,
  })
  if (!ok) return
  const result = await logout()
  error.value = result.ok ? undefined : result.error
  if (result.ok) await navigateTo('/connexion', { replace: true })
}
</script>

<template>
  <section v-if="user" :aria-label="t('auth.login.title')" class="mt-12 border-t border-gold/30 pt-6 text-center" data-auth-bar>
    <p class="mb-1 text-parchment-dim">{{ t('auth.bar.signedIn', { username: user.username }) }}</p>
    <p role="status" aria-live="polite" class="mb-3 text-sm text-parchment-dim" data-sync-status :data-state="status">
      {{ t(`sync.status.${status === 'done' ? 'idle' : status}`) }}
      <template v-if="pending">{{ tCount('sync.pending', pending) }}</template>
    </p>
    <p v-if="error" role="alert" class="mb-3 text-ember-light" data-logout-error>{{ t(error) }}</p>
    <div class="flex flex-wrap justify-center gap-3">
      <NuxtLink v-if="user.role === 'master'" to="/comptes" :class="[AUTH_SECONDARY, 'inline-flex items-center']">{{ t('auth.bar.accounts') }}</NuxtLink>
      <NuxtLink to="/mot-de-passe" :class="[AUTH_SECONDARY, 'inline-flex items-center']">{{ t('auth.bar.password') }}</NuxtLink>
      <button type="button" :class="AUTH_SECONDARY" @click="signOut">{{ t('auth.bar.signOut') }}</button>
    </div>
  </section>
</template>
