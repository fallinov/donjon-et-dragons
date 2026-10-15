<script setup lang="ts">
import { t } from '~/composables/useT'
import { AUTH_SECONDARY } from '~/utils/authUi'

/** Compte sur l'accueil : connexion, ou compte connecté avec ses liens (comptes pour le master). */
const { user, logout } = useAuth()
</script>

<template>
  <section v-if="user !== undefined" :aria-label="t('auth.login.title')" class="mt-12 border-t border-gold/30 pt-6 text-center" data-auth-bar>
    <NuxtLink v-if="!user" to="/connexion" :class="[AUTH_SECONDARY, 'inline-flex items-center']">{{ t('auth.bar.signIn') }}</NuxtLink>
    <template v-else>
      <p class="mb-3 text-parchment-dim">{{ t('auth.bar.signedIn', { username: user.username }) }}</p>
      <div class="flex flex-wrap justify-center gap-3">
        <NuxtLink v-if="user.role === 'master'" to="/comptes" :class="[AUTH_SECONDARY, 'inline-flex items-center']">{{ t('auth.bar.accounts') }}</NuxtLink>
        <NuxtLink to="/mot-de-passe" :class="[AUTH_SECONDARY, 'inline-flex items-center']">{{ t('auth.bar.password') }}</NuxtLink>
        <button type="button" :class="AUTH_SECONDARY" @click="logout">{{ t('auth.bar.signOut') }}</button>
      </div>
    </template>
  </section>
</template>
