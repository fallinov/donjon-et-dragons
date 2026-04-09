# Rapport d'audit UX/UI — Donjon et Dragons (Codex)

**Date** : 2026-04-09
**Auditeur** : Claude Code
**Pages/écrans audités** : `/personnages/dareth-brumeval` (fiche personnage) + `/` (index)
**Règles UX du projet appliquées** : `frontend.md` (WCAG AAA visé, ratio 7:1 texte / 4.5:1 UI)

---

## Identification du projet

```
Plateforme : Web (SSR/SSG)
Framework  : Nuxt 4.x
UI Library : Custom (pas de Nuxt UI — composants maison)
Styling    : Tailwind CSS v4 (@theme tokens)
Cibles     : Web responsive (desktop + tablette + mobile)
```

---

## Résumé exécutif

| Catégorie | Score | Poids | Statut |
|-----------|-------|-------|--------|
| Accessibilité | 7/10 | 30% | orange |
| Utilisabilité | 8/10 | 25% | vert |
| Cohérence | 9/10 | 15% | vert |
| Mobile & Responsive | 6/10 | 20% | orange |
| Flux UX | 8/10 | 10% | vert |
| **Score global pondéré** | **7.3/10** | | **orange** |

| Sous-critère | Évaluation |
|--------------|------------|
| Daltonisme | à améliorer |
| Lecteur d'écran | conforme |
| Navigation clavier | conforme |
| Responsive | à améliorer |

---

## Problèmes critiques (bloquants)

| # | Catégorie | Problème | Impact | Utilisateurs affectés | Solution | Effort |
|---|-----------|----------|--------|----------------------|----------|--------|
| 1 | A11y | `<img>` brut dans `CodexHero.vue` (l. 10-13) et `index.vue` (l. 33-35) au lieu de `<NuxtImage>`. Le `alt` est présent via binding `:alt` mais la source HTML n'est pas optimisée (pas de lazy, pas de srcset, pas de format moderne) | Performance, SEO, pas de responsive images | Tous les utilisateurs sur mobile/connexion lente | Remplacer `<img>` par `<NuxtImage>` ou `<NuxtPicture>` avec `loading="lazy"`, `sizes`, et formats WebP/AVIF | Faible |
| 2 | A11y | Absence d'`aria-live` sur le tracker HP (`CodexStatusBar.vue`). Quand l'utilisateur applique des dégâts ou des soins, la valeur HP change dynamiquement mais aucune annonce n'est faite au lecteur d'écran | Les changements d'état (HP, emplacements de sort) sont invisibles aux utilisateurs de lecteurs d'écran | Utilisateurs malvoyants | Ajouter `aria-live="polite"` sur le paragraphe affichant `state.hpCurrent` et sur le compteur d'emplacements de sort | Faible |
| 3 | Mobile | Touch targets trop petits : boutons `−` et `+` de dégâts/soins (`CodexStatusBar.vue` l. 72-76, l. 86-89) avec `px-2 py-1` (environ 28x24px). Boutons death saves `w-5 h-5` (20x20px). Emplacements de sort `w-5 h-5` rotated (l. 42-43) | Impossible de taper précisément sur mobile | Tous les utilisateurs mobiles | Augmenter à `min-h-11 min-w-11` (44px) sur mobile ou ajouter `hitSlop` via padding invisible | Moyen |

---

## Problèmes majeurs (à corriger)

| # | Catégorie | Problème | Impact | Solution | Effort |
|---|-----------|----------|--------|----------|--------|
| 1 | A11y | Couleur `ember` (#c23b1a) sur fond sombre : ratio 3.52:1 sur charcoal, 3.72:1 sur obsidian. Échoue le seuil AA (4.5:1) pour du texte normal. Utilisé dans les boutons de dégâts (`bg-blood/40 text-ember-bright` est OK à 5.66:1) mais les bordures `border-ember` et éléments décoratifs sont sous le seuil | Texte `ember` non lisible pour les personnes avec faible vision | Réserver `ember` aux textes larges (>=18px) ou passer à `ember-bright` (#e8652a, 5.66:1) pour le texte normal. Viser 7:1 selon les règles du projet | Faible |
| 2 | A11y | Inputs numériques de dégâts/soins dans `CodexStatusBar.vue` (l. 67-70, l. 81-84) : les `<input>` sont imbriqués dans des `<label>` avec un `<span>` texte, ce qui est correct pour l'association label-input. Cependant, les inputs ont `text-sm` (14px) — sur iOS Safari, cela déclenche un **zoom automatique** au focus | Layout cassé sur iPhone quand l'utilisateur interagit avec les inputs | Ajouter `text-base` sur mobile : `text-base sm:text-sm` ou forcer `font-size: 16px` via CSS | Faible |
| 3 | Typo | Usage massif de `text-xs` (12px) pour les labels de section, labels de caractéristiques, labels de compétences, labels status bar. Bien que ce soit des labels décoratifs en `font-display` (Cinzel) avec du tracking large, la taille effective de lecture est ~10-11px à cause du tracking. Exemples : `CodexAbilityScores.vue` l. 30, `CodexSection.vue` l. 9, `CodexStatusBar.vue` l. 48/98/102/106 | Lisibilité réduite sur petits écrans et pour les utilisateurs avec faible vision | Les labels en `text-xs` avec `tracking-wider-4` devraient être au minimum `text-sm` sur mobile. Utiliser `text-xs sm:text-xs` est insuffisant ; viser `text-sm` de base | Moyen |
| 4 | Mobile | Pas de meta `theme-color`, pas de `apple-mobile-web-app-capable`, pas de `viewport-fit=cover` dans `nuxt.config.ts`. L'app n'est pas PWA-ready | L'app ne s'intègre pas bien quand ajoutée à l'écran d'accueil sur mobile | Ajouter les meta dans `nuxt.config.ts` : `{ name: 'theme-color', content: '#0b0907' }` et `{ name: 'apple-mobile-web-app-capable', content: 'yes' }` | Faible |
| 5 | A11y / Daltonisme | Les compétences maîtrisées (`CodexSkillList.vue` l. 17) sont distinguées uniquement par la couleur (`text-gold-bright` vs `text-parchment-dim`). Même problème pour les caractéristiques avec maîtrise (`CodexAbilityScores.vue` l. 24-26) | Utilisateurs daltoniens ne peuvent pas distinguer les compétences maîtrisées | Ajouter un indicateur non-colorimétrique : badge `M`, point, icône, ou `font-weight: bold` en complément de la couleur | Faible |
| 6 | A11y | `outline: none` sur `:focus` dans `main.css` l. 68. Bien que compensé par `:focus-visible` avec un ring gold-bright (l. 69-73), la suppression du outline par défaut peut poser problème sur certains navigateurs qui ne supportent pas bien `:focus-visible` | Navigation clavier dégradée sur anciens navigateurs | Ajouter un fallback : `:focus:not(:focus-visible) { outline: 2px solid var(--color-gold-bright); }` | Faible |

---

## Améliorations recommandées

| # | Catégorie | Constat | Recommandation | Effort |
|---|-----------|---------|----------------|--------|
| 1 | UX | Le lien retour « ← Retour aux codex » utilise le caractère `←` en texte brut. Pas de sémantique de navigation, pas de `nav` englobante | Encadrer dans `<nav aria-label="Fil d'Ariane">` et utiliser une icône SVG plutôt qu'un caractère Unicode | Faible |
| 2 | UX | Pas de confirmation avant « Repos long » qui remet tous les HP au max et restaure les emplacements de sort. Action destructrice sans undo | Ajouter un `confirm()` ou un toast avec undo (5s) avant d'appliquer le repos long | Faible |
| 3 | UX | Pas de feedback visuel après « Repos court » / « Repos long ». L'utilisateur clique mais ne reçoit aucune confirmation que l'action a eu lieu (sauf observation attentive des HP) | Ajouter un message temporaire (toast ou inline) « Repos court effectué » / « Repos long effectué — HP restaurés » | Faible |
| 4 | Typo | L'échelle typographique responsive n'est pas appliquée. Le corps de texte reste en `text-base` (16px) sur desktop alors que la checklist recommande `text-base lg:text-lg` (18px). Le `h1` utilise `clamp(2rem,6vw,3.5rem)` ce qui est bien, mais les `h2` de section (`text-sm` ~14px) sont trop petits pour des titres | Passer les `h2` de section à `text-base lg:text-lg` et le corps à `text-base lg:text-lg` | Moyen |
| 5 | Cohérence | Le bouton « Imprimer » (`PrintButton.vue`) est fixé en bas à droite (`fixed bottom-4 right-4`) ce qui peut masquer du contenu sur mobile et ne suit pas le flux du document | Sur mobile, intégrer le bouton dans le header ou le lien retour plutôt qu'en position fixe. Ajouter un `z-index` et un backdrop semi-transparent si fixe | Faible |
| 6 | Mobile | La grille 3 colonnes `lg:grid-cols-[260px_1fr_1fr]` passe à 1 colonne sur mobile, ce qui est correct. Mais la colonne des caractéristiques (6 blocs empilés de 260px de large) occupe toute la largeur sur mobile, ce qui est sous-optimal — les blocs pourraient s'afficher en grille 2x3 ou 3x2 sur tablette | Ajouter un breakpoint intermédiaire `md:grid-cols-2` pour les caractéristiques sur tablette | Faible |
| 7 | Perf | Polices au format TTF uniquement. WOFF2 serait ~30% plus léger | Convertir les polices en WOFF2 (`woff2_compress` ou service en ligne) et mettre à jour les `@font-face` | Faible |
| 8 | A11y | Le symbole décoratif `☩` dans le footer (l. 79) a `aria-hidden="true"`, ce qui est correct. Mais le texte du colophon n'a pas de rôle sémantique clair — il est directement dans le `<footer>` sans balise `<p>` | Encadrer `{{ character.colophon }}` dans un `<p>` | Trivial |
| 9 | UX | Le bouton « dépenser un dé » (`CodexStatusBar.vue` l. 108-113) est un lien souligné (`underline`) plutôt qu'un bouton visuellement identifiable. Taille `text-xs` et style lien classique | Styler comme les autres boutons de la status bar (bordure, fond) pour la cohérence | Faible |

---

## Points positifs

- **Sémantique HTML excellente** : `<main>`, `<header>`, `<section>`, `<footer>`, `<figure>`, `<dl>`, `<table>` avec `<caption class="sr-only">`, `<abbr>` — usage exemplaire
- **ARIA riche et correct** : `aria-labelledby` sur toutes les sections, `aria-pressed` sur les toggles, `role="progressbar"` avec `aria-valuenow/min/max`, `role="group"` avec labels sur les groupes de boutons
- **Skip link** fonctionnel (`app.vue` l. 4) avec `<NuxtRouteAnnouncer>` pour les annonces SPA
- **`lang="fr"`** déclaré dans `nuxt.config.ts` — excellent pour les lecteurs d'écran
- **`prefers-reduced-motion`** respecté via `motion-safe:animate-*` ET la media query CSS qui désactive toutes les animations
- **Design system cohérent** : tokens couleur, typographie, espacement via `@theme` Tailwind v4. Pas de valeurs ad hoc
- **Print stylesheet** soigné : A4 paysage, 3 colonnes, niveaux de gris, pagination contrôlée
- **Polices auto-hébergées** (souveraineté données respectée)
- **`font-display: swap`** sur toutes les polices — pas de FOIT
- **Séparateurs décoratifs** (`aria-hidden="true"` sur les `·`) correctement masqués
- **localStorage** avec validation de type (`isValidState`) et gestion gracieuse des erreurs
- **Responsive breakpoints** : `sm:`, `xl:`, `lg:` utilisés aux bons endroits pour le hero et la grille principale
- **Tableau d'attaques** : version cards mobile (`md:hidden`) + table desktop (`hidden md:table`) — excellent pattern responsive
- **Hiérarchie visuelle forte** : Cinzel pour display/titres, EB Garamond pour le corps — deux polices seulement, cohérence totale

---

## Plan d'action recommandé

### Phase 1 — Accessibilité (priorité maximale)

1. [ ] Ajouter `aria-live="polite"` sur les zones dynamiques (HP, emplacements de sort)
2. [ ] Ajouter un indicateur non-colorimétrique pour les compétences/caractéristiques maîtrisées
3. [ ] Remplacer `<img>` par `<NuxtImage>` avec lazy loading et srcset
4. [ ] Corriger le contraste `ember` : utiliser `ember-bright` pour le texte normal
5. [ ] Ajouter fallback `:focus:not(:focus-visible)` dans le CSS
6. [ ] Passer les inputs à `text-base` sur mobile (éviter le zoom iOS)

### Phase 2 — Mobile & Responsive

7. [ ] Augmenter les touch targets des boutons dégâts/soins, death saves et spell slots à 44px minimum
8. [ ] Ajouter `theme-color`, `apple-mobile-web-app-capable`, `viewport-fit=cover`
9. [ ] Ajouter un breakpoint tablette pour les caractéristiques (`md:grid-cols-2`)
10. [ ] Revoir la position du bouton Imprimer sur mobile

### Phase 3 — UX & Typographie

11. [ ] Ajouter confirmation ou undo pour le repos long
12. [ ] Ajouter feedback visuel après repos court/long
13. [ ] Augmenter la taille des labels de section (`text-xs` → `text-sm`)
14. [ ] Appliquer l'échelle typographique responsive (`lg:text-lg` pour le corps)
15. [ ] Convertir les polices en WOFF2

---

## Notation par référence

```
┌─────────────────────────────┬───────┬──────────────────────────────────────────────────────────┐
│ Référence                   │ Note  │ Justification                                            │
├─────────────────────────────┼───────┼──────────────────────────────────────────────────────────┤
│ Nielsen (10 heuristiques)   │ 7/10  │ Visibilité du statut excellente (progressbar HP, slots), │
│                             │       │ mais manque de feedback sur repos et pas de prévention    │
│                             │       │ d'erreur sur actions destructrices (repos long).          │
├─────────────────────────────┼───────┼──────────────────────────────────────────────────────────┤
│ Don Norman                  │ 8/10  │ Affordances claires (boutons stylés, inputs identifiables)│
│                             │       │ bon mapping (layout 3 colonnes D&D standard), feedback HP │
│                             │       │ visuel via progressbar. Manque aria-live pour le feedback  │
│                             │       │ non-visuel et confirmation sur repos long.                 │
├─────────────────────────────┼───────┼──────────────────────────────────────────────────────────┤
│ Steve Krug                  │ 8/10  │ Scannabilité excellente : sections titrées, listes,      │
│                             │       │ hiérarchie visuelle nette. Pas de jargon inutile. Lien   │
│                             │       │ retour clair. Le « dépenser un dé » en lien souligné     │
│                             │       │ est le seul écart stylistique.                            │
├─────────────────────────────┼───────┼──────────────────────────────────────────────────────────┤
│ Alan Cooper (About Face)    │ 8/10  │ Design orienté objectif : chaque section répond à un     │
│                             │       │ besoin clair du joueur en session. Flux continus, retour  │
│                             │       │ possible. Le tracker HP est central et bien intégré.      │
│                             │       │ Manque la persistance confirmée (pas de toast « sauvé »). │
├─────────────────────────────┼───────┼──────────────────────────────────────────────────────────┤
│ Luke Wroblewski (Mobile 1st)│ 6/10  │ Breakpoints responsive présents mais incomplets : touch  │
│                             │       │ targets trop petits (20-28px), pas de breakpoint tablette │
│                             │       │ pour les caractéristiques, zoom iOS sur inputs, polices   │
│                             │       │ TTF non optimisées. Le contenu prioritaire (HP tracker)   │
│                             │       │ est bien placé en haut.                                   │
├─────────────────────────────┼───────┼──────────────────────────────────────────────────────────┤
│ Brad Frost (Atomic Design)  │ 9/10  │ Architecture composants exemplaire : atomes (boutons,    │
│                             │       │ inputs), molécules (CodexSection), organismes (CodexHero, │
│                             │       │ CodexStatusBar), template (page [slug].vue). Pas de      │
│                             │       │ duplication. Tokens centralisés dans @theme.              │
├─────────────────────────────┼───────┼──────────────────────────────────────────────────────────┤
│ Material Design 3           │ 5/10  │ Pas de ripple/state layer tactile. Touch targets sous    │
│                             │       │ 48dp sur plusieurs boutons. Pas de bottom navigation.     │
│                             │       │ Justifié par le choix esthétique médiéval, mais les      │
│                             │       │ utilisateurs Android sont pénalisés.                      │
├─────────────────────────────┼───────┼──────────────────────────────────────────────────────────┤
│ Apple HIG                   │ 6/10  │ Touch targets < 44pt sur death saves et spell slots.     │
│                             │       │ Zoom iOS probable sur inputs text-sm. safe-area-inset    │
│                             │       │ non déclaré. Pas de hover-only (correct). Gestes système │
│                             │       │ non bloqués (correct).                                    │
├─────────────────────────────┼───────┼──────────────────────────────────────────────────────────┤
│ Refactoring UI              │ 8/10  │ Hiérarchie par poids et couleur avant taille (Cinzel     │
│                             │       │ bold/normal + gold/parchment). Ombres multi-couches sur   │
│                             │       │ le portrait. Bordures en tons-sur-tons (gold/30, gold/40).│
│                             │       │ Image traitée comme élément de design (saturate, contrast)│
│                             │       │ Échelle d'espacement non-linéaire respectée.              │
├─────────────────────────────┼───────┼──────────────────────────────────────────────────────────┤
│ Laws of UX (Yablonski)      │ 7/10  │ Hick : nombre de choix limité par section. Fitts : le   │
│                             │       │ tracker HP est grand et central. Jakob : conventions D&D  │
│                             │       │ respectées (fiche de personnage standard). Miller : stats │
│                             │       │ groupées par 6 (caractéristiques). Doherty : animations   │
│                             │       │ rapides (0.5s). Manque : feedback sous 400ms sur repos.   │
├─────────────────────────────┼───────┼──────────────────────────────────────────────────────────┤
│ MOYENNE GLOBALE             │ 7.2/10│                                                          │
└─────────────────────────────┴───────┴──────────────────────────────────────────────────────────┘
```

---

## Checklist de validation finale

- [x] Contraste AA sur tous les textes (sauf `ember` en texte normal — à corriger)
- [x] Navigation clavier complète (focus-visible, skip link, tabulation)
- [ ] Touch targets >= 44px (death saves 20px, spell slots 20px, boutons dégâts 28px)
- [x] Pas de scroll horizontal mobile
- [ ] Feedback sur toutes les actions (repos sans feedback)
- [x] Messages d'erreur explicites (404 géré)
- [ ] Info non transmise par la couleur seule (compétences maîtrisées)

---

## Barème de notation

| Score | Signification |
|-------|---------------|
| 9-10 | Excellent — Aucun problème majeur |
| 7-8 | Bon — Quelques améliorations mineures |
| 5-6 | Acceptable — Problèmes à corriger |
| 3-4 | Insuffisant — Problèmes majeurs |
| 0-2 | Critique — Inutilisable |
