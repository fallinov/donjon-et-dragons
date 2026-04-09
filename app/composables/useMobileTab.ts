import { ref, computed } from 'vue'

export type TabId = 'perso' | 'traits' | 'combat' | 'sorts' | 'stats'

export interface Tab {
  id: TabId
  label: string
  icon: string
}

const TABS_RIGHT: Tab[] = [
  { id: 'perso', label: 'Perso', icon: 'scroll' },
  { id: 'traits', label: 'Traits', icon: 'dna' },
  { id: 'combat', label: 'Combat', icon: 'sword' },
  { id: 'sorts', label: 'Sorts', icon: 'sparkles' },
  { id: 'stats', label: 'Stats', icon: 'chart' },
]

const activeTab = ref<TabId>('perso')
const leftHanded = ref(false)

export function useMobileTab() {
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
