<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { AccountSummary } from '~~/shared/types/account'
import { t, type MessageKey } from '~/composables/useT'
import { useCharacterList } from '~/composables/useCharacters'
import { syncNow } from '~/composables/useSync'
import { AUTH_PRIMARY, AUTH_SECONDARY } from '~/utils/authUi'

useSeoMeta({ title: t('accounts.seo') })

const { user } = useAuth()
const { characters } = useCharacterList()
const { remote } = useOwnership()
const ownerMessage = ref<MessageKey>()
const ownerError = ref(false)

/** Attribue une fiche (valeur vide : fiche du groupe), puis synchronise pour l'afficher partout. */
async function assign(characterId: string, ownerId: string): Promise<void> {
  ownerMessage.value = undefined
  const result = await callApi(`/api/characters/${encodeURIComponent(characterId)}/owner`, 'PATCH', { ownerId: ownerId || null })
  ownerError.value = !result.ok
  ownerMessage.value = result.ok ? 'accounts.ownerSaved' : result.error === 'auth.error.offline' ? 'accounts.ownerOffline' : result.error
  if (result.ok) await syncNow()
}
const { confirm } = useConfirm()
const accounts = ref<AccountSummary[]>()
const listError = ref<MessageKey>()
const username = ref('')
const busy = ref(false)
const error = ref<MessageKey>()
/** Erreur d'une action sur un compte de la liste (renommer, rôle, réinitialiser, supprimer). */
const actionError = ref<MessageKey>()
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
    actionError.value = result.error
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
  if (!result.ok) actionError.value = result.error
  if (issued.value?.username === account.username) issued.value = undefined
  await load()
}

/** Compte en cours de renommage (formulaire dans sa ligne). */
const renaming = ref<string>()
const newName = ref('')

function startRename(account: AccountSummary): void {
  renaming.value = account.id
  newName.value = account.username
  actionError.value = undefined
}

async function rename(account: AccountSummary): Promise<void> {
  const result = await accountsApi.update(account.id, { username: newName.value })
  if (!result.ok) {
    actionError.value = result.error
    return
  }
  if (account.id === user.value?.id) user.value = result.value.user
  renaming.value = undefined
  actionError.value = undefined
  await load()
}

async function changeRole(account: AccountSummary): Promise<void> {
  const promote = account.role === 'player'
  const self = account.id === user.value?.id
  const ok = await confirm({
    title: t(promote ? 'accounts.promoteTitle' : 'accounts.demoteTitle'),
    message: self ? t('accounts.demoteSelfMessage') : t(promote ? 'accounts.promoteMessage' : 'accounts.demoteMessage', { username: account.username }),
    confirmLabel: t(promote ? 'accounts.promoteShort' : 'accounts.demoteShort'),
    cancelLabel: t('accounts.cancel'),
    danger: !promote,
  })
  if (!ok) return
  const result = await accountsApi.update(account.id, { role: promote ? 'master' : 'player' })
  if (!result.ok) {
    actionError.value = result.error
    return
  }
  actionError.value = undefined
  if (self) {
    user.value = result.value.user
    await navigateTo('/', { replace: true })
    return
  }
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
      <p v-if="actionError" role="alert" class="mb-3 text-ember-light leading-snug" data-list-error>{{ t(actionError) }}</p>
      <p v-if="listError" role="alert" class="text-ember-light">{{ t(listError) }}</p>
      <p v-else-if="!accounts" role="status" class="text-parchment-dim italic">{{ t('accounts.loading') }}</p>
      <ul v-else class="divide-y divide-gold/20 border-y border-gold/20">
        <li v-for="account in accounts" :key="account.id" class="py-3" :data-account="account.username">
          <p class="text-lg text-parchment">
            {{ account.username }}
            <span v-if="account.id === user?.id" class="text-parchment-dim">{{ t('accounts.you') }}</span>
            <span class="ml-2 font-display text-xs tracking-wider-2 uppercase text-parchment-dim">{{ t(account.role === 'master' ? 'accounts.role.master' : 'accounts.role.player') }}</span>
          </p>
          <p v-if="account.mustChangePassword" class="text-sm text-parchment-dim italic">{{ t('accounts.pending') }}</p>
          <form v-if="renaming === account.id" novalidate class="mt-2" data-rename-form @submit.prevent="rename(account)">
            <AuthField v-model="newName" :label="t('accounts.renameLabel', { username: account.username })" autocomplete="off" />
            <div class="flex flex-wrap gap-2">
              <button type="submit" :class="AUTH_PRIMARY">{{ t('accounts.renameSave') }}</button>
              <button type="button" :class="AUTH_SECONDARY" @click="renaming = undefined">{{ t('accounts.cancel') }}</button>
            </div>
          </form>
          <div v-else class="mt-2 flex flex-wrap gap-2">
            <button type="button" :class="AUTH_SECONDARY" :aria-label="t('accounts.rename', { username: account.username })" @click="startRename(account)">{{ t('accounts.renameShort') }}</button>
            <button
              type="button"
              :class="AUTH_SECONDARY"
              :aria-label="t(account.role === 'player' ? 'accounts.promote' : 'accounts.demote', { username: account.username })"
              @click="changeRole(account)"
            >{{ t(account.role === 'player' ? 'accounts.promoteShort' : 'accounts.demoteShort') }}</button>
            <template v-if="account.id !== user?.id">
              <button type="button" :class="AUTH_SECONDARY" :aria-label="t('accounts.reset', { username: account.username })" @click="reset(account)">{{ t('accounts.resetShort') }}</button>
              <button type="button" :class="AUTH_SECONDARY" :aria-label="t('accounts.delete', { username: account.username })" @click="remove(account)">{{ t('accounts.deleteShort') }}</button>
            </template>
          </div>
        </li>
      </ul>
    </section>

    <section aria-labelledby="sheets-owners" class="mt-10" data-sheet-owners>
      <h2 id="sheets-owners" class="font-display text-sm tracking-wider-3 text-gold uppercase mb-2">{{ t('accounts.sheets') }}</h2>
      <p class="mb-4 text-sm text-parchment-dim">{{ t('accounts.sheetsIntro') }}</p>
      <p v-if="ownerMessage" role="status" class="mb-3 text-sm" :class="ownerError ? 'text-ember-light' : 'text-gold-bright'" data-owner-message>{{ t(ownerMessage) }}</p>
      <ul v-if="characters.some(c => remote.has(c.id))" class="divide-y divide-gold/20 border-y border-gold/20">
        <template v-for="character in characters" :key="character.id">
          <li v-if="remote.has(character.id)" class="py-3" :data-sheet-owner="character.id">
            <EditSelect
              :model-value="remote.get(character.id)?.ownerId ?? ''"
              :label="t('accounts.ownerLabel', { name: `${character.firstName}${character.lastName ? ` ${character.lastName}` : ''}` })"
              :options="[{ value: '', label: t('accounts.ownerGroup') }, ...(accounts ?? []).map(a => ({ value: a.id, label: a.username }))]"
              @update:model-value="assign(character.id, String($event))"
            />
          </li>
        </template>
      </ul>
      <p v-else class="text-parchment-dim italic">{{ t('accounts.noSheets') }}</p>
    </section>
  </AuthPage>
</template>
