<script setup lang="ts">
function print(): void {
  window.print()
}
</script>

<template>
  <div class="no-print hidden sm:block sm:fixed sm:bottom-4 sm:right-4 sm:z-20">
    <button
      type="button"
      aria-label="Imprimer la fiche"
      class="border border-gold/60 bg-charcoal/80 hover:bg-charcoal text-gold-bright font-display text-sm tracking-wider-3 uppercase min-h-11 px-4 py-2 transition-colors sm:backdrop-blur-sm"
      @click="print"
    >
      ⎙ Imprimer
    </button>
  </div>
</template>
