<script setup lang="ts">
import { useMobileTab } from '~/composables/useMobileTab'

const { activeTab, tabs, setTab } = useMobileTab()
</script>

<template>
  <nav
    aria-label="Navigation mobile"
    class="fixed bottom-0 left-0 right-0 z-30 bg-charcoal/95 backdrop-blur-md border-t border-gold/30 safe-area-bottom lg:hidden"
  >
    <ul class="flex items-end justify-around px-1">
      <li v-for="tab in tabs" :key="tab.id" class="flex-1">
        <button
          type="button"
          :aria-current="activeTab === tab.id ? 'page' : undefined"
          class="w-full flex flex-col items-center gap-0.5 py-2 transition-colors relative !outline-none"
          :class="activeTab === tab.id ? 'text-gold-bright' : 'text-parchment-mute hover:text-parchment'"
          @click="setTab(tab.id)"
        >
          <!-- Indicateur actif -->
          <span
            v-if="activeTab === tab.id"
            class="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gold-bright rounded-full"
          />

          <!-- Icônes SVG inline (combat = plus grand) -->
          <svg
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <!-- Perso : parchemin -->
            <template v-if="tab.icon === 'scroll'">
              <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
              <path d="M19 17V5a2 2 0 0 0-2-2H4" />
            </template>
            <!-- Traits : ADN -->
            <template v-else-if="tab.icon === 'dna'">
              <path d="M2 15c6.667-6 13.333 0 20-6" />
              <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
              <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
              <path d="M17 6l-2.5 2.5" /><path d="M14 8l-1.5 1.5" />
              <path d="M7 18l2.5-2.5" /><path d="M3.5 14.5l.5-.5" />
            </template>
            <!-- Combat : épée -->
            <template v-else-if="tab.icon === 'sword'">
              <path d="M14.5 3.5L20.5 9.5L18 12L15 9L12 12L9 15L6 12L9 9L12 6L14.5 3.5Z" />
              <path d="M6 12L3.5 14.5L5.5 16.5L3 19L5 21L7.5 18.5L9.5 20.5L12 18" />
              <line x1="9" y1="9" x2="6" y2="12" />
            </template>
            <!-- Sorts : étincelles -->
            <template v-else-if="tab.icon === 'sparkles'">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              <path d="M5 3v4" /><path d="M3 5h4" />
              <path d="M19 17v4" /><path d="M17 19h4" />
            </template>
            <!-- Stats : barres -->
            <template v-else-if="tab.icon === 'chart'">
              <path d="M3 3v18h18" />
              <path d="M7 16v-3" /><path d="M11 16V8" />
              <path d="M15 16v-5" /><path d="M19 16v-1" />
            </template>
          </svg>

          <span class="text-[10px] font-display tracking-wider-2 uppercase">{{ tab.label }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
