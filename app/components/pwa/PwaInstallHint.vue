<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { t } from '~/composables/useT'

const IOS_DISMISSED_KEY = 'codex:ios-install-dismissed'

const { $pwa } = useNuxtApp()
const iosHint = ref(false)

/** iPhone / iPad (y compris iPadOS qui se présente comme un Mac tactile). */
function isIos(): boolean {
  const ua = navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
}

function isStandalone(): boolean {
  const legacy = (navigator as Navigator & { standalone?: boolean }).standalone
  return legacy === true || window.matchMedia('(display-mode: standalone)').matches
}

onMounted(() => {
  try {
    iosHint.value = isIos() && !isStandalone() && localStorage.getItem(IOS_DISMISSED_KEY) !== 'true'
  }
  catch {
    iosHint.value = false
  }
})

// Android / Chrome : le navigateur a proposé l'installation (beforeinstallprompt intercepté)
const installable = computed(() => Boolean($pwa?.showInstallPrompt) && !$pwa?.isPWAInstalled)

function install(): void {
  void $pwa?.install()
}

function dismiss(): void {
  if (installable.value) $pwa?.cancelInstall()
  if (iosHint.value) {
    iosHint.value = false
    try {
      localStorage.setItem(IOS_DISMISSED_KEY, 'true')
    }
    catch {
      // stockage indisponible : l'aide réapparaîtra au prochain lancement
    }
  }
}
</script>

<template>
  <aside
    v-if="installable || iosHint"
    class="no-print mx-auto mb-10 max-w-xl border border-gold/40 bg-charcoal/60 p-4 text-left"
    :aria-label="t('pwa.installTitle')"
    data-pwa-install
  >
    <p class="font-display text-sm tracking-wider-3 text-gold-bright uppercase mb-1">{{ t('pwa.installTitle') }}</p>
    <p class="text-sm text-parchment-dim">{{ t('pwa.installText') }}</p>
    <p v-if="iosHint && !installable" class="mt-2 text-sm text-parchment">{{ t('pwa.iosText') }}</p>
    <div class="mt-3 flex justify-end gap-2">
      <button type="button" class="min-h-11 px-3 font-display text-sm tracking-wider-2 uppercase text-parchment-dim hover:text-gold-bright" @click="dismiss">{{ t('pwa.dismiss') }}</button>
      <button v-if="installable" type="button" class="min-h-11 border border-gold/60 bg-gold/15 px-4 font-display text-sm tracking-wider-2 uppercase text-gold-bright hover:bg-gold/25" @click="install">{{ t('pwa.install') }}</button>
    </div>
  </aside>
</template>
