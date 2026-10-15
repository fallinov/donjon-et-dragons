<script setup lang="ts">
import { ref } from 'vue'
import { t, type MessageKey } from '~/composables/useT'
import { AUTH_PRIMARY, safeNext } from '~/utils/authUi'

useSeoMeta({ title: t('auth.login.seo') })

const { login } = useAuth()
const route = useRoute()
const username = ref('')
const password = ref('')
const busy = ref(false)
const error = ref<MessageKey>()

async function submit(): Promise<void> {
  if (busy.value) return
  busy.value = true
  error.value = undefined
  const result = await login(username.value, password.value)
  busy.value = false
  if (!result.ok) {
    error.value = result.status === 400 ? 'auth.error.invalid' : result.error
    return
  }
  await navigateTo(result.value.mustChangePassword ? '/mot-de-passe' : safeNext(route.query.suite), { replace: true })
}
</script>

<template>
  <AuthPage :title="t('auth.login.title')" :intro="t('auth.login.intro')">
    <form novalidate :aria-busy="busy" data-login-form @submit.prevent="submit">
      <AuthField v-model="username" :label="t('auth.username')" autocomplete="username" :invalid="Boolean(error)" />
      <AuthField v-model="password" :label="t('auth.password')" type="password" autocomplete="current-password" :invalid="Boolean(error)" />
      <p v-if="error" role="alert" class="mb-4 text-ember-light leading-snug" data-auth-error>{{ t(error) }}</p>
      <p v-if="busy" role="status" class="mb-4 text-parchment-dim italic">{{ t('auth.login.loading') }}</p>
      <button type="submit" :class="[AUTH_PRIMARY, 'w-full']" :disabled="busy">{{ t('auth.login.submit') }}</button>
      <p class="mt-6 text-sm text-parchment-dim">{{ t('auth.login.forgot') }}</p>
    </form>
  </AuthPage>
</template>
