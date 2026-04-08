# Donjon et Dragons — Codex des personnages

Bibliothèque de fiches de personnages **D&D 5e** en codex médiévaux (parchemin, or, obsidienne). Construit en **Nuxt 4** + **Tailwind CSS v4** + **TypeScript strict**.

🌐 **Production** : https://donjon-et-dragons.vercel.app/

## Personnages consignés

| Slug | Personnage | Race · Classe |
|---|---|---|
| [`dareth-brumeval`](https://donjon-et-dragons.vercel.app/personnages/dareth-brumeval) | Dareth Brumeval | Demi-elfe · Rôdeur niveau 4 |
| [`skamos-aurum`](https://donjon-et-dragons.vercel.app/personnages/skamos-aurum) | Skamos Aurum | Tieffelin · Ensorceleur niveau 4 |
| [`zanna`](https://donjon-et-dragons.vercel.app/personnages/zanna) | Zanna la sage | Gnome des forêts · Occultiste niveau 3 |

## Stack

- **Nuxt 4.4** (Vue 3.5 + Nitro + Vite 7)
- **Tailwind CSS v4** — CSS-first via `@theme` inline dans `app/assets/css/main.css`
- **TypeScript strict** (zéro `any`)
- **Polices auto-hébergées** : Cinzel (display) + EB Garamond (body) dans `public/fonts/` (souveraineté CEJEF, aucun CDN externe)
- **Portraits générés via Nano Banana** (Gemini Flash Image), style painterly medieval oil
- **Tests** : Vitest (unit) + Playwright (e2e, chromium + mobile safari)
- **Déploiement** : Vercel (Nitro preset) via `vercel.json`

## Structure

```
donjon-et-dragons/
├── app/
│   ├── app.vue                      # layout racine + skip link
│   ├── assets/css/main.css          # @theme Tailwind + @font-face + print A4 paysage
│   ├── components/
│   │   ├── PrintButton.vue
│   │   └── codex/
│   │       ├── CodexHero.vue        # portrait + nom + vitals
│   │       ├── CodexAbilityScores.vue
│   │       ├── CodexSkillList.vue
│   │       ├── CodexFeatureList.vue
│   │       ├── CodexPersonality.vue
│   │       ├── CodexAttacks.vue
│   │       ├── CodexSpells.vue      # slots interactifs aria-pressed
│   │       ├── CodexLanguages.vue
│   │       ├── CodexRituals.vue
│   │       └── CodexSection.vue
│   ├── data/characters/
│   │   ├── index.ts                 # agrégation + getCharacter(slug)
│   │   ├── dareth-brumeval.ts
│   │   ├── skamos-aurum.ts
│   │   └── zanna.ts
│   └── pages/
│       ├── index.vue                # liste des codex
│       └── personnages/[slug].vue   # fiche dynamique
├── shared/types/character.ts        # interface Character (abilities, skills, attacks, spellcasting, rituals, personality)
├── public/
│   ├── fonts/                       # Cinzel, EB Garamond (.ttf)
│   └── img/                         # portraits + favicons
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
pnpm test             # Vitest (unit) — 10 tests
pnpm test:watch       # Vitest en mode watch
pnpm test:e2e         # Playwright e2e — 10 tests (chromium desktop + mobile safari)
```

Le serveur e2e tourne sur le port **3210** pour éviter les collisions avec un dev server existant.

## Déploiement

Déploiement automatique sur Vercel via Git (branche `main`).

**Manuel** :
```bash
pnpm dlx vercel deploy --prod
```

Le projet est lié via `.vercel/project.json` (org `steves-projects-7a849401`, projet `donjon-et-dragons`). Nitro preset `vercel` est configuré dans `nuxt.config.ts`.

## Ajouter un personnage

1. Créer `app/data/characters/<slug>.ts` exportant un `Character` typé depuis `~~/shared/types/character`
2. L'importer dans `app/data/characters/index.ts` et l'ajouter au tableau `characters`
3. Ajouter le portrait dans `public/img/<slug>.png` (3:4 recommandé, style painterly medieval oil pour la cohérence)
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
