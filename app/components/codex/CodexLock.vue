<script setup lang="ts">
/**
 * Zone de jeu d'une fiche en lecture seule (fiche d'un autre joueur) : `fieldset disabled`
 * désactive tous les boutons et champs qu'il contient, sans changer la mise en page.
 */
defineProps<{ locked: boolean }>()
</script>

<template>
  <fieldset :disabled="locked" class="contents">
    <slot />
  </fieldset>
</template>
