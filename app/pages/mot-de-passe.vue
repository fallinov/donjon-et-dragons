<script setup lang="ts">
import { ref } from 'vue'
import { t, type MessageKey } from '~/composables/useT'
import { AUTH_PRIMARY } from '~/utils/authUi'

useSeoMeta({ title: t('auth.password.seo') })

const { user, changePassword } = useAuth()
const current = ref('')
const next = ref('')
const confirmation = ref('')
const busy = ref(false)
const error = ref<MessageKey>()
const done = ref(false)

async function submit(): Promise<void> {
  if (busy.value) return
  error.value = undefined
  done.value = false
  if ([...next.value].length < 8) error.value = 'auth.error.tooShort'
  else if (next.value !== confirmation.value) error.value = 'auth.error.mismatch'
  if (error.value) return
  busy.value = true
  const wasRequired = user.value?.mustChangePassword
  const result = await changePassword(current.value, next.value)
  busy.value = false
  if (!result.ok) {
    error.value = result.error
    return
  }
  current.value = next.value = confirmation.value = ''
  if (wasRequired) await navigateTo('/', { replace: true })
  else done.value = true
}
</script>

<template>
  <AuthPage :title="t('auth.password.title')" :intro="user?.mustChangePassword ? t('auth.password.required') : undefined">
    <form novalidate :aria-busy="busy" data-password-form @submit.prevent="submit">
      <AuthField v-model="current" :label="t('auth.password.current')" type="password" autocomplete="current-password" :invalid="error === 'auth.error.currentWrong'" />
      <AuthField v-model="next" :label="t('auth.password.next')" type="password" autocomplete="new-password" :hint="t('auth.password.hint')" :invalid="error === 'auth.error.tooShort' || error === 'auth.error.unchanged'" />
      <AuthField v-model="confirmation" :label="t('auth.password.confirm')" type="password" autocomplete="new-password" :invalid="error === 'auth.error.mismatch'" />
      <p v-if="error" role="alert" class="mb-4 text-ember-light leading-snug" data-auth-error>{{ t(error) }}</p>
      <p v-if="done" role="status" class="mb-4 text-gold-bright" data-password-done>{{ t('auth.password.done') }}</p>
      <button type="submit" :class="[AUTH_PRIMARY, 'w-full']" :disabled="busy">{{ t('auth.password.submit') }}</button>
    </form>
  </AuthPage>
</template>
