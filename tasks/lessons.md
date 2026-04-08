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
