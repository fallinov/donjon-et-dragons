# Donjon et Dragons — Codex des personnages

Bibliothèque de fiches de personnages **D&D 5e** en codex médiévaux (parchemin, or, obsidienne). Construit en **Nuxt 4** + **Tailwind CSS v4** + **TypeScript strict**.

🌐 **Production** : https://donjon-et-dragons.vercel.app/

## Personnages consignés

| Slug | Personnage | Joueur | Race · Classe |
|---|---|---|---|
| [`dareth-brumeval`](https://donjon-et-dragons.vercel.app/personnages/dareth-brumeval) | Dareth Brumeval | Steve | Demi-elfe · Rôdeur niveau 4 |
| [`skamos-aurum`](https://donjon-et-dragons.vercel.app/personnages/skamos-aurum) | Skamos Aurum | Normand | Tieffelin · Ensorceleur niveau 4 |
| [`zanna`](https://donjon-et-dragons.vercel.app/personnages/zanna) | Zanna | Myriam | Gnome des forêts · Occultiste niveau 3 |
| [`maera-vifbois`](https://donjon-et-dragons.vercel.app/personnages/maera-vifbois) | Maera Vifbois | Sandra | Humaine · Paladin (Conquête) niveau 4 |
| [`thunon`](https://donjon-et-dragons.vercel.app/personnages/thunon) | Thunon | Juan | Haut-elfe · Magicien (Évocation) niveau 4 |
| [`kael-draven`](https://donjon-et-dragons.vercel.app/personnages/kael-draven) | Kael Draven | Jérôme | Humain · Roublard (Voleur) niveau 4 |

## Stack

- **Nuxt 4.4** (Vue 3.5 + Nitro + Vite 7)
- **Tailwind CSS v4** — CSS-first via `@theme` inline dans `app/assets/css/main.css`
- **TypeScript strict** (zéro `any`)
- **Polices auto-hébergées** : Cinzel (display) + EB Garamond (body) dans `public/fonts/` (souveraineté CEJEF, aucun CDN externe)
- **Portraits générés via Nano Banana** (Gemini Flash Image), style painterly medieval oil
- **État interactif persisté** : composable `useCharacterState` singleton (HP, inspiration, repos, jets de mort, slots multi-niveaux, sorts daily) via `useState` Nuxt + `localStorage` par slug
- **Tests** : Vitest (unit, 24 tests) + Playwright (e2e, 10 tests, chromium desktop + mobile safari)
- **Déploiement** : Vercel (Nitro preset) via `vercel.json`

## Structure

```
donjon-et-dragons/
├── app/
│   ├── app.vue                      # layout racine + skip link
│   ├── assets/css/main.css          # @theme Tailwind + @font-face + print A4 paysage
│   ├── composables/
│   │   └── useCharacterState.ts     # état mutable + localStorage + repos D&D 5e
│   ├── components/
│   │   ├── PrintButton.vue
│   │   └── codex/
│   │       ├── CodexHero.vue        # portrait + nom + vitals
│   │       ├── CodexStatusBar.vue   # HP tracker + inspiration + repos + jets de mort
│   │       ├── CodexAbilityScores.vue
│   │       ├── CodexSkillList.vue
│   │       ├── CodexFeatureList.vue
│   │       ├── CodexPersonality.vue
│   │       ├── CodexAttacks.vue
│   │       ├── CodexSpells.vue      # slots interactifs aria-pressed, consomme useCharacterState
│   │       ├── CodexLanguages.vue
│   │       ├── CodexRituals.vue
│   │       └── CodexSection.vue
│   ├── data/characters/
│   │   ├── index.ts                 # agrégation + getCharacter(slug)
│   │   ├── dareth-brumeval.ts
│   │   ├── skamos-aurum.ts
│   │   ├── zanna.ts
│   │   ├── maera-vifbois.ts
│   │   ├── thunon.ts
│   │   └── kael-draven.ts
│   └── pages/
│       ├── index.vue                # liste des codex
│       └── personnages/[slug].vue   # fiche dynamique
├── shared/types/character.ts        # interface Character (abilities, skills, attacks, spellcasting, rituals, personality)
├── prompts/
│   └── character-portrait.md        # template prompt pour la génération des portraits (Gemini)
├── public/
│   ├── fonts/                       # Cinzel, EB Garamond (.ttf)
│   └── img/                         # portraits (6) + favicons
├── tests/
│   ├── unit/                        # Vitest
│   └── e2e/                         # Playwright
├── docs/UX-AUDIT-REPORT.md
├── nuxt.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── vercel.json
```

## Développement

```bash
pnpm install          # installe les dépendances
pnpm dev              # serveur dev http://localhost:3000
pnpm build            # build Nitro pour Vercel
pnpm generate         # SSG
pnpm preview          # prévisualise le build
pnpm typecheck        # vérification TS stricte
```

## Tests

```bash
pnpm test             # Vitest (unit) — 24 tests (composable d'état, dataset, composants)
pnpm test:watch       # Vitest en mode watch
pnpm test:e2e         # Playwright e2e — 10 tests (chromium desktop + mobile safari)
```

Le serveur e2e tourne sur le port **3210** pour éviter les collisions avec un dev server existant. Le setup Vitest (`tests/setup.ts`) stubbe le hook `useState` de Nuxt pour permettre de tester le composable hors d'un contexte Nuxt.

### État mutable interactif

Le composable [`app/composables/useCharacterState.ts`](app/composables/useCharacterState.ts) expose l'état mutable de chaque personnage (HP courant/temp, inspiration, dés de vie utilisés, jets de mort, emplacements de sort consommés) avec :

- **Persistance** : `localStorage` par slug, clé `codex:<slug>:state`
- **Singleton** : via `useState` Nuxt pour que `CodexStatusBar` et `CodexSpells` partagent le même state
- **Règles D&D 5e** : `damage` / `heal` (HP temp d'abord, reset jets de mort si > 0), `shortRest` (slots occultiste), `longRest` (tout reset, moitié des dés de vie récupérés)
- **Helper** : `computePassivePerception(character)` calcule 10 + mod sagesse + bonus maîtrise si Perception est maîtrisée

## Déploiement

Déploiement automatique sur Vercel via Git (branche `main`).

**Manuel** :
```bash
pnpm dlx vercel deploy --prod
```

Le projet est lié via `.vercel/project.json` (org `steves-projects-7a849401`, projet `donjon-et-dragons`). Nitro preset `vercel` est configuré dans `nuxt.config.ts`.

## Ajouter un personnage

1. Créer `app/data/characters/<slug>.ts` exportant un `Character` typé depuis `~~/shared/types/character` (ne pas oublier le champ `player`)
2. L'importer dans `app/data/characters/index.ts` et l'ajouter au tableau `characters`
3. Générer le portrait avec le template `prompts/character-portrait.md` et le sauvegarder dans `public/img/<slug>.png` (3:4, style painterly medieval oil)
4. La fiche est automatiquement accessible sur `/personnages/<slug>`
5. Tester : `pnpm test && pnpm test:e2e`

## Accessibilité (WCAG 2.2 AA)

- `lang="fr"`, skip link, focus-visible custom, `prefers-reduced-motion`
- Sections ARIA nommées (`aria-labelledby`), caption sr-only sur la table des armes, `scope="col"`
- Slots de sorts cliquables (`role="group"` + `aria-pressed`) avec compteur live
- Badge `<abbr title="Maîtrise">M</abbr>` distinct du bullet décoratif ◆
- Contraste `parchment-mute` à #b09d72 (AAA)

## Impression

`@page A4 landscape` avec marges 5-6 mm. Page 1 : fiche complète en 3 colonnes (caractéristiques / compétences+capacités+personnalité / attaques+sorts+langues). Page 2 : rites de combat en 3 colonnes. Footer masqué, image grayscale, bouton Imprimer fixé en bas-droite (`.no-print`).

## Conventions

- **Code** en anglais, **commits** en français, commentaires en français
- **Branches** : `feat/`, `fix/`, `docs/`, `chore/`
- **Release** : `feat/` → minor, `fix/` → patch, `chore/` → patch, `docs/` → pas de release
- **Terminologie D&D** : alignée sur la fiche WotC officielle française (Compétences, Capacités et traits, Attaques et incantations, DD de sauvegarde des sorts…)
- **Souveraineté** : aucun CDN externe, tout self-hosted (libs, fonts, images)

## Documentation

- [`docs/UX-AUDIT-REPORT.md`](docs/UX-AUDIT-REPORT.md) — Audit UX/a11y NN/g + WCAG 2.2 sur la version HTML initiale
