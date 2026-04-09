<script setup lang="ts">
import { ref } from 'vue'
import { useMobileTab } from '~/composables/useMobileTab'

const { swipeLeft, swipeRight } = useMobileTab()

const touchStartX = ref(0)
const touchDeltaX = ref(0)
const swiping = ref(false)
const THRESHOLD = 50

function onTouchStart(e: TouchEvent): void {
  touchStartX.value = e.touches[0]!.clientX
  touchDeltaX.value = 0
  swiping.value = true
}

function onTouchMove(e: TouchEvent): void {
  if (!swiping.value) return
  touchDeltaX.value = e.touches[0]!.clientX - touchStartX.value
}

function onTouchEnd(): void {
  if (!swiping.value) return
  swiping.value = false
  if (touchDeltaX.value > THRESHOLD) swipeRight()
  else if (touchDeltaX.value < -THRESHOLD) swipeLeft()
  touchDeltaX.value = 0
}
</script>

<template>
  <div
    class="min-h-0 overflow-y-auto"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="onTouchEnd"
  >
    <slot />
  </div>
</template>
