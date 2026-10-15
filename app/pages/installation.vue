<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { t, type MessageKey } from '~/composables/useT'
import { AUTH_PRIMARY, AUTH_SECONDARY } from '~/utils/authUi'

useSeoMeta({ title: t('auth.setup.seo') })

const { setup, setupStatus } = useAuth()
const status = ref<'loading' | 'needed' | 'done' | 'error'>('loading')
const codeRequired = ref(true)
const setupCode = ref('')
const username = ref('')
const password = ref('')
const busy = ref(false)
const error = ref<MessageKey>()

onMounted(async () => {
  const result = await setupStatus()
  if (!result.ok) {
    status.value = 'error'
    error.value = result.error
    return
  }
  codeRequired.value = result.value.codeRequired
  status.value = result.value.needed ? 'needed' : 'done'
})

async function submit(): Promise<void> {
  if (busy.value) return
  error.value = undefined
  if ([...password.value].length < 8) {
    error.value = 'auth.error.tooShort'
    return
  }
  busy.value = true
  const result = await setup(setupCode.value, username.value, password.value)
  busy.value = false
  if (!result.ok) {
    if (result.status === 409) status.value = 'done'
    else error.value = result.error
    return
  }
  await navigateTo('/comptes', { replace: true })
}
</script>

<template>
  <AuthPage :title="t('auth.setup.title')" :intro="status === 'needed' ? t('auth.setup.intro') : undefined">
    <p v-if="status === 'error' && error" role="alert" class="text-ember-light" data-auth-error>{{ t(error) }}</p>
    <template v-else-if="status === 'done'">
      <p class="mb-6 text-parchment leading-snug" data-setup-done>{{ t('auth.setup.done') }}</p>
      <NuxtLink to="/connexion" :class="[AUTH_SECONDARY, 'inline-flex items-center']">{{ t('auth.login.submit') }}</NuxtLink>
    </template>
    <form v-else-if="status === 'needed'" novalidate :aria-busy="busy" data-setup-form @submit.prevent="submit">
      <AuthField v-if="codeRequired" v-model="setupCode" :label="t('auth.setup.code')" type="password" autocomplete="off" :hint="t('auth.setup.codeHint')" :invalid="error === 'auth.error.setupCode'" />
      <AuthField v-model="username" :label="t('auth.username')" autocomplete="username" :invalid="error === 'auth.error.username'" />
      <AuthField v-model="password" :label="t('auth.password')" type="password" autocomplete="new-password" :hint="t('auth.password.hint')" :invalid="error === 'auth.error.tooShort'" />
      <p v-if="error" role="alert" class="mb-4 text-ember-light leading-snug" data-auth-error>{{ t(error) }}</p>
      <button type="submit" :class="[AUTH_PRIMARY, 'w-full']" :disabled="busy">{{ t('auth.setup.submit') }}</button>
    </form>
  </AuthPage>
</template>
