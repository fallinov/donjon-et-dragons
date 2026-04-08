<script setup lang="ts">
function print(): void {
  window.print()
}
</script>

<template>
  <div class="no-print fixed bottom-4 right-4 z-20">
    <button
      type="button"
      aria-label="Imprimer la fiche"
      class="border border-gold/60 bg-charcoal/80 hover:bg-charcoal text-gold-bright font-display text-xs tracking-wider-3 uppercase px-3 py-2 transition-colors"
      @click="print"
    >
      ⎙ Imprimer
    </button>
  </div>
</template>
