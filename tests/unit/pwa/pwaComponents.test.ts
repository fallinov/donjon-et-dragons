import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import PwaInstallHint from '~/components/pwa/PwaInstallHint.vue'
import PwaUpdateToast from '~/components/pwa/PwaUpdateToast.vue'

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36'

function fakePwa(overrides: Record<string, unknown> = {}) {
  return reactive({
    needRefresh: false,
    showInstallPrompt: false,
    isPWAInstalled: false,
    install: vi.fn(async () => {}),
    cancelInstall: vi.fn(),
    cancelPrompt: vi.fn(async () => {}),
    updateServiceWorker: vi.fn(async () => {}),
    ...overrides,
  })
}

function setPwa(pwa: ReturnType<typeof fakePwa> | undefined): void {
  ;(globalThis as unknown as { useNuxtApp: () => unknown }).useNuxtApp = () => ({ $pwa: pwa })
}

function setUserAgent(ua: string): void {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua)
}

describe('PwaInstallHint', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
  })
  afterEach(() => vi.restoreAllMocks())

  it('Android : propose le bouton Installer quand le navigateur le permet', async () => {
    setUserAgent(ANDROID_UA)
    const pwa = fakePwa({ showInstallPrompt: true })
    setPwa(pwa)
    const wrapper = mount(PwaInstallHint)
    const install = wrapper.findAll('button').find(b => b.text() === 'Installer')!
    await install.trigger('click')
    expect(pwa.install).toHaveBeenCalled()
  })

  it('iPhone : explique la marche à suivre, masquée durablement', async () => {
    setUserAgent(IPHONE_UA)
    setPwa(fakePwa())
    const wrapper = mount(PwaInstallHint)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain("Sur l'écran d'accueil")
    await wrapper.findAll('button').find(b => b.text() === 'Masquer')!.trigger('click')
    expect(wrapper.find('[data-pwa-install]').exists()).toBe(false)
    expect(localStorage.getItem('codex:ios-install-dismissed')).toBe('true')

    const again = mount(PwaInstallHint)
    await again.vm.$nextTick()
    expect(again.find('[data-pwa-install]').exists()).toBe(false)
  })

  it('n\'affiche rien une fois l\'app installée ou sans proposition du navigateur', async () => {
    setUserAgent(ANDROID_UA)
    setPwa(fakePwa({ showInstallPrompt: false }))
    expect(mount(PwaInstallHint).find('[data-pwa-install]').exists()).toBe(false)

    setUserAgent(IPHONE_UA)
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
    const standalone = mount(PwaInstallHint)
    await standalone.vm.$nextTick()
    expect(standalone.find('[data-pwa-install]').exists()).toBe(false)
  })

  it('sans PWA active (mode dev) : rien', () => {
    setUserAgent(ANDROID_UA)
    setPwa(undefined)
    expect(mount(PwaInstallHint).find('[data-pwa-install]').exists()).toBe(false)
  })
})

describe('PwaUpdateToast', () => {
  it('propose la mise à jour quand une nouvelle version attend', async () => {
    const pwa = fakePwa({ needRefresh: true })
    setPwa(pwa)
    const wrapper = mount(PwaUpdateToast)
    expect(wrapper.text()).toContain('nouvelle version')
    await wrapper.findAll('button').find(b => b.text() === 'Mettre à jour')!.trigger('click')
    expect(pwa.updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('« Plus tard » referme le bandeau', async () => {
    const pwa = fakePwa({ needRefresh: true })
    setPwa(pwa)
    const wrapper = mount(PwaUpdateToast)
    await wrapper.findAll('button').find(b => b.text() === 'Plus tard')!.trigger('click')
    expect(pwa.cancelPrompt).toHaveBeenCalled()
  })

  it('n\'affiche rien sans mise à jour', () => {
    setPwa(fakePwa())
    expect(mount(PwaUpdateToast).find('[data-pwa-update]').exists()).toBe(false)
  })
})
