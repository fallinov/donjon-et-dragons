# Lessons — Donjon et Dragons

## 2026-04-08 — Vue strippe les espaces en début d'interpolation dans un `<span>`

**Contexte** : rendu conditionnel du nom de famille dans les cartes de la page liste.
Pattern utilisé :
```vue
{{ character.firstName }}<span v-if="character.lastName"> {{ character.lastName }}</span>
```

**Erreur** : le compilateur Vue strippait l'espace en tête du span, rendant `<h2>DarethBrumeval</h2>` sans séparation. Playwright ne trouvait plus le heading via `getByRole('heading', { name: /Dareth Brumeval/i })` et les tests e2e `liste des personnages` + `navigation vers la fiche Dareth` échouaient.

**Correction** : utiliser une expression JavaScript unique qui concatène le séparateur au niveau du template :
```vue
{{ character.firstName }}{{ character.lastName ? ` ${character.lastName}` : '' }}
```

**Règle** : pour un séparateur whitespace conditionnel autour d'une interpolation, **ne jamais s'appuyer sur l'espace littéral à l'intérieur d'un `<span>` ou `<template>`** — Vue le compresse. Utiliser soit une expression ternaire unique, soit `&nbsp;`, soit un `:class="'ml-1'"` sur le span.

---

## 2026-04-08 — `useState` Nuxt non disponible en contexte Vitest pur

**Contexte** : composable `useCharacterState` utilisant `useState` de Nuxt pour faire un singleton par slug.

**Erreur** : Vitest lancé hors d'un runtime Nuxt ne connaît pas l'auto-import de `useState`, les tests du composable crashaient avec `useState is not defined`.

**Correction** :
1. `tests/setup.ts` expose un stub minimal de `useState` sur `globalThis` (un `Map<string, Ref<T>>` reset à chaque test)
2. Le composable utilise un wrapper `useStateSafe` qui appelle `globalThis.useState` si disponible, sinon retombe sur un `ref()` Vue standard
3. Les hooks Vue (`onMounted`, `watch`) sont conditionnés à `getCurrentInstance()` pour ne pas émettre de warning quand le composable est appelé depuis un test unitaire direct (sans composant)

**Règle** : un composable qui utilise des APIs Nuxt auto-importées doit avoir un **fallback** pour les tests unitaires purs, et ses effets de cycle de vie doivent être **gardés par `getCurrentInstance()`**.

---

## 2026-04-08 — Port 3000 occupé par un autre projet Nuxt

**Contexte** : tentative de démarrer `pnpm dev` pour tester localement.

**Erreur** : le port 3000 était déjà utilisé par un autre projet Nuxt sur la même machine, retournant des réponses qui contenaient des éléments d'un autre design system (`nuxt-ui-colors`) et faisaient échouer les tests Playwright qui voyaient un contenu inconnu.

**Correction** : utiliser un port dédié pour les tests e2e (3210) via `pnpm dev --port 3210` et `playwright.config.ts` pointant sur ce port avec `reuseExistingServer: false`.

**Règle** : sur une machine qui héberge plusieurs projets Nuxt, **toujours réserver un port non-standard pour les tests e2e** dans `playwright.config.ts` pour éviter la collision silencieuse.

---

## 2026-04-09 — Migration spellcasting : ne pas oublier les données existantes

**Contexte** : migration du modèle `SpellLevel` (single level) vers `Spellcasting` (multi-niveaux avec `slotLevels[]` et `Spell.cost`).

**Erreur** : les 3 personnages existants (Dareth, Skamos, Zanna) ont été migrés, mais les 2 nouveaux (Vibois Thaera, Thunon) créés juste avant la migration sont restés à l'ancien format (`level`, `slots`, spells `Trait[]`). Le type-checker ne les a pas détectés car `vue-tsc` peut être permissif avec les objets imbriqués.

**Correction** : migrer manuellement vibois-thaera.ts et thunon.ts vers le nouveau format `Spellcasting`.

**Règle** : lors d'une migration de type, **vérifier tous les fichiers de données**, pas seulement ceux qui existaient avant. Lancer `grep -r 'ancienne propriété' app/data/` pour détecter les retardataires.

---

## 2026-04-09 — Index slotLevels : ne pas présumer level-1 = array index

**Contexte** : `canCast()` et `castSpell()` utilisaient `spell.level - 1` comme index dans `slotLevels[]`.

**Erreur** : pour Zanna (occultiste), `slotLevels` est `[{ level: 2, slots: 2 }]` — un seul élément à l'index 0. Un sort niv. 2 calculait `2 - 1 = 1` → index inexistant → bouton Lancer toujours désactivé.

**Correction** : remplacer `spell.level - 1` par `slotLevels.findIndex(sl => sl.level === spell.level)` dans `CodexSpells.vue` et `useCharacterState.ts`.

**Règle** : **ne jamais supposer que l'index d'un tableau correspond au niveau du sort**. Les occultistes et certaines classes n'ont pas de slots à chaque niveau. Toujours faire un `findIndex` par `level`.
