<script setup lang="ts">
import { useMobileTab } from '~/composables/useMobileTab'
import { detectAxis, resolveSwipe, type SwipeAxis } from '~/utils/swipe'

const { swipeLeft, swipeRight } = useMobileTab()

// État du geste en cours (non réactif : inutile pour le rendu)
let startX = 0
let startY = 0
let deltaX = 0
let deltaY = 0
let axis: SwipeAxis = null
let tracking = false

function reset(): void {
  tracking = false
  axis = null
  deltaX = 0
  deltaY = 0
}

function onTouchStart(e: TouchEvent): void {
  // Geste multi-doigts (pinch) : pas un swipe
  if (e.touches.length !== 1) {
    reset()
    return
  }
  startX = e.touches[0]!.clientX
  startY = e.touches[0]!.clientY
  deltaX = 0
  deltaY = 0
  axis = null
  tracking = true
}

function onTouchMove(e: TouchEvent): void {
  if (!tracking) return
  deltaX = e.touches[0]!.clientX - startX
  deltaY = e.touches[0]!.clientY - startY
  // Verrouille l'axe dès le premier mouvement significatif
  if (axis === null) axis = detectAxis(deltaX, deltaY)
}

function onTouchEnd(): void {
  if (!tracking) return
  const direction = resolveSwipe(axis, deltaX, deltaY)
  reset()
  if (direction === 'right') swipeRight()
  else if (direction === 'left') swipeLeft()
}
</script>

<template>
  <div
    class="min-h-0 overflow-y-auto"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="reset"
  >
    <slot />
  </div>
</template>
