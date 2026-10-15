<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { AccountSummary } from '~~/shared/types/account'
import { t, type MessageKey } from '~/composables/useT'
import { AUTH_PRIMARY, AUTH_SECONDARY } from '~/utils/authUi'

useSeoMeta({ title: t('accounts.seo') })

const { user } = useAuth()
const { confirm } = useConfirm()
const accounts = ref<AccountSummary[]>()
const listError = ref<MessageKey>()
const username = ref('')
const busy = ref(false)
const error = ref<MessageKey>()
/** Dernier mot de passe provisoire, affiché une seule fois. */
const issued = ref<{ username: string, password: string }>()
const copied = ref<MessageKey>()

async function load(): Promise<void> {
  const result = await accountsApi.list()
  if (result.ok) accounts.value = result.value.users
  else listError.value = result.error
}
onMounted(load)

function show(name: string, password: string): void {
  issued.value = { username: name, password }
  copied.value = undefined
}

async function create(): Promise<void> {
  if (busy.value) return
  busy.value = true
  error.value = undefined
  const result = await accountsApi.create(username.value)
  busy.value = false
  if (!result.ok) {
    error.value = result.error
    return
  }
  show(result.value.user.username, result.value.password)
  username.value = ''
  await load()
}

async function reset(account: AccountSummary): Promise<void> {
  const ok = await confirm({
    title: t('accounts.resetTitle'),
    message: t('accounts.resetMessage', { username: account.username }),
    confirmLabel: t('accounts.resetShort'),
    cancelLabel: t('accounts.cancel'),
  })
  if (!ok) return
  const result = await accountsApi.resetPassword(account.id)
  if (!result.ok) {
    error.value = result.error
    return
  }
  show(account.username, result.value.password)
  await load()
}

async function remove(account: AccountSummary): Promise<void> {
  const ok = await confirm({
    title: t('accounts.deleteTitle'),
    message: t('accounts.deleteMessage', { username: account.username }),
    confirmLabel: t('accounts.deleteShort'),
    cancelLabel: t('accounts.cancel'),
    danger: true,
  })
  if (!ok) return
  const result = await accountsApi.remove(account.id)
  if (!result.ok) error.value = result.error
  if (issued.value?.username === account.username) issued.value = undefined
  await load()
}

async function copyPassword(): Promise<void> {
  if (!issued.value) return
  try {
    await navigator.clipboard.writeText(issued.value.password)
    copied.value = 'accounts.copied'
  }
  catch {
    copied.value = 'accounts.copyFailed'
  }
}
</script>

<template>
  <AuthPage :title="t('accounts.title')" :intro="t('accounts.intro')">
    <aside
      v-if="issued"
      class="mb-6 border border-gold/40 bg-charcoal/60 p-4"
      :aria-label="t('accounts.newPassword', { username: issued.username })"
      data-issued-password
    >
      <p class="font-display text-sm tracking-wider-3 text-gold-bright uppercase mb-2">{{ t('accounts.newPassword', { username: issued.username }) }}</p>
      <p class="font-display text-2xl tracking-wider-2 text-gold-bright mb-2 break-all" data-password-value>{{ issued.password }}</p>
      <p class="text-sm text-parchment-dim mb-3">{{ t('accounts.newPasswordHint') }}</p>
      <button type="button" :class="AUTH_PRIMARY" @click="copyPassword">{{ t('accounts.copy') }}</button>
      <p role="status" aria-live="polite" class="mt-2 min-h-5 text-sm text-gold-bright">{{ copied ? t(copied) : '' }}</p>
    </aside>

    <form novalidate :aria-busy="busy" class="mb-10" data-create-account @submit.prevent="create">
      <AuthField v-model="username" :label="t('accounts.createLabel')" autocomplete="off" :hint="t('auth.error.username')" :invalid="Boolean(error)" />
      <p v-if="error" role="alert" class="mb-4 text-ember-light leading-snug" data-auth-error>{{ t(error) }}</p>
      <button type="submit" :class="[AUTH_PRIMARY, 'w-full']" :disabled="busy">{{ t('accounts.create') }}</button>
    </form>

    <section aria-labelledby="accounts-list">
      <h2 id="accounts-list" class="font-display text-sm tracking-wider-3 text-gold uppercase mb-3">{{ t('accounts.list') }}</h2>
      <p v-if="listError" role="alert" class="text-ember-light">{{ t(listError) }}</p>
      <p v-else-if="!accounts" role="status" class="text-parchment-dim italic">{{ t('accounts.loading') }}</p>
      <ul v-else class="divide-y divide-gold/20 border-y border-gold/20">
        <li v-for="account in accounts" :key="account.id" class="py-3" :data-account="account.username">
          <p class="text-lg text-parchment">
            {{ account.username }}
            <span class="ml-2 font-display text-xs tracking-wider-2 uppercase text-parchment-dim">{{ t(account.role === 'master' ? 'accounts.role.master' : 'accounts.role.player') }}</span>
          </p>
          <p v-if="account.mustChangePassword" class="text-sm text-parchment-dim italic">{{ t('accounts.pending') }}</p>
          <div v-if="account.id !== user?.id" class="mt-2 flex flex-wrap gap-2">
            <button type="button" :class="AUTH_SECONDARY" :aria-label="t('accounts.reset', { username: account.username })" @click="reset(account)">{{ t('accounts.resetShort') }}</button>
            <button type="button" :class="AUTH_SECONDARY" :aria-label="t('accounts.delete', { username: account.username })" @click="remove(account)">{{ t('accounts.deleteShort') }}</button>
          </div>
        </li>
      </ul>
    </section>
  </AuthPage>
</template>
