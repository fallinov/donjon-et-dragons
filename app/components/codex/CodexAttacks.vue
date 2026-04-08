<script setup lang="ts">
import type { Attack } from '~~/shared/types/character'

defineProps<{ attacks: Attack[] }>()
</script>

<template>
  <div>
    <!-- Mobile : cards -->
    <div class="print-arsenal-cards space-y-3 md:hidden">
      <article
        v-for="attack in attacks"
        :key="attack.name"
        class="border border-gold/25 bg-charcoal/40 p-3"
      >
        <p class="font-display text-gold-bright text-base">{{ attack.name }}</p>
        <p class="text-xs text-parchment-mute italic">{{ attack.note }}</p>
        <p class="mt-2 text-sm">
          <span class="text-gold">Bonus d'att.</span> · <span class="font-display text-parchment">{{ attack.attackBonus }}</span>
        </p>
        <p class="text-sm">
          <span class="text-gold">Dégâts</span> · <span class="font-display text-parchment">{{ attack.damage }} <em class="text-bone not-italic text-xs">{{ attack.damageType }}</em></span>
        </p>
      </article>
    </div>

    <!-- Desktop : table -->
    <table class="print-arsenal-table hidden md:table w-full border-collapse">
      <caption class="sr-only">Armes équipées avec bonus d'attaque et dégâts</caption>
      <thead>
        <tr class="border-b border-gold/30">
          <th scope="col" class="text-left font-display text-xs tracking-wider-4 text-gold uppercase pb-2">Arme</th>
          <th scope="col" class="text-left font-display text-xs tracking-wider-4 text-gold uppercase pb-2">Bonus d'att.</th>
          <th scope="col" class="text-left font-display text-xs tracking-wider-4 text-gold uppercase pb-2">Dégâts</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gold/15">
        <tr v-for="attack in attacks" :key="attack.name">
          <td class="py-3">
            <div class="font-display text-gold-bright">{{ attack.name }}</div>
            <div class="text-xs text-parchment-mute italic">{{ attack.note }}</div>
          </td>
          <td class="py-3 font-display">{{ attack.attackBonus }}</td>
          <td class="py-3 font-display">{{ attack.damage }} <em class="text-bone not-italic text-xs">{{ attack.damageType }}</em></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
