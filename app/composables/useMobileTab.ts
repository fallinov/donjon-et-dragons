import { computed } from 'vue'
import { t } from '~/composables/useT'

export type TabId = 'profil' | 'combat' | 'sorts' | 'sac' | 'stats'

export interface Tab {
  id: TabId
  label: string
  icon: string
}

const TABS_RIGHT: Tab[] = [
  { id: 'profil', label: t('tabs.profil'), icon: 'scroll' },
  { id: 'combat', label: t('tabs.combat'), icon: 'sword' },
  { id: 'sorts', label: t('tabs.sorts'), icon: 'sparkles' },
  { id: 'sac', label: t('tabs.sac'), icon: 'bag' },
  { id: 'stats', label: t('tabs.stats'), icon: 'chart' },
]

export function useMobileTab() {
  const activeTab = useState<TabId>('mobile-tab', () => 'profil')
  const leftHanded = useState<boolean>('left-handed', () => false)

  // Charge la préférence depuis localStorage côté client
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('codex:left-handed')
    if (stored === 'true') leftHanded.value = true
  }

  const tabs = computed(() => leftHanded.value ? [...TABS_RIGHT].reverse() : TABS_RIGHT)

  function setTab(id: TabId): void {
    activeTab.value = id
  }

  function swipeLeft(): void {
    const list = tabs.value
    const idx = list.findIndex(t => t.id === activeTab.value)
    if (idx < list.length - 1) activeTab.value = list[idx + 1]!.id
  }

  function swipeRight(): void {
    const list = tabs.value
    const idx = list.findIndex(t => t.id === activeTab.value)
    if (idx > 0) activeTab.value = list[idx - 1]!.id
  }

  function toggleHand(): void {
    leftHanded.value = !leftHanded.value
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('codex:left-handed', String(leftHanded.value))
    }
  }

  return { activeTab, tabs, leftHanded, setTab, swipeLeft, swipeRight, toggleHand }
}
