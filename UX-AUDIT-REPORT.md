# Audit UX — fiche-dareth-brumeval.html

**Date :** 2026-04-08
**Cible :** `fiche-dareth-brumeval.html` (page unique, statique)
**Méthode :** Playwright (desktop 1440×900, mobile 390×844) + analyse code source
**Référentiels :** NN/g (10 heuristiques), WCAG 2.2, Material 3, Apple HIG, Refactoring UI
**Captures :** `playwright/dareth-desktop.png`, `playwright/dareth-mobile.png`

---

## Verdict global

| Axe | Note | Commentaire |
|---|---|---|
| Accessibilité | 🟠 4/10 | Structure sémantique pauvre, contrastes limites, pas de focus visible, pas de skip link |
| Utilisabilité | 🟢 7/10 | Page statique simple, hiérarchie claire en desktop |
| Typographie | 🟡 5/10 | Polices fallback exotiques (Herculanum/Papyrus), letter-spacing extrême, lisibilité dégradée |
| Design visuel | 🟢 8/10 | Direction artistique forte, cohérente, palette maîtrisée |
| Mobile | 🔴 2/10 | **Bloquant** : débordement horizontal, padding excessif, hiérarchie cassée |

**Priorité absolue : corriger le mobile.** Le rendu actuel est inutilisable < 600 px.

---

## 1. Accessibilité (WCAG 2.2 AA / NN/g #4 — Cohérence et standards)

### 🔴 Critiques

1. **Hiérarchie de titres absente.** Un seul `<h1>` pour tout le document. Les sections « Arts & Savoirs », « Arsenal », « Incantations », « Rites de combat » sont stylées comme des titres mais codées en `<div class="section-title">`. Lecteur d'écran : impossible de naviguer par titres.
   - **Fix :** convertir en `<h2>` + `<section aria-labelledby="...">`.

2. **Pas de landmarks suffisants.** `<main>` présent (✅) mais pas de `<nav>`, `<header>` interne sémantique uniquement décoratif. Aucun rôle ARIA pour les blocs caractéristiques.
   - **Fix :** structurer en `<section>` nommées.

3. **Contrastes à vérifier / probablement insuffisants.**
   - `--parchment-dim: #b4a37c` sur `--obsidian: #0b0907` → ratio ≈ 8.4:1 ✅
   - `--gold-dim: #7a5f23` sur obsidian → ratio ≈ 3.2:1 ❌ (texte normal exige 4.5:1)
   - Texte 10–11 px (`.label`, `.eyebrow`) avec letter-spacing 0.32–0.40em : techniquement WCAG passe en grand contraste mais lisibilité physiologique très faible.
   - **Fix :** auditer chaque usage `--gold-dim`, remonter à `--gold` (#c9a24a).

4. **Aucun focus visible custom.** Pas de `:focus-visible` défini → repose sur le défaut navigateur, souvent invisible sur fond sombre.
   - **Fix :**
     ```css
     :focus-visible { outline: 2px solid var(--gold-bright); outline-offset: 3px; }
     ```

5. **Animation `rise` sans `prefers-reduced-motion`.** Viole WCAG 2.3.3.
   - **Fix :**
     ```css
     @media (prefers-reduced-motion: reduce) {
       .codex > * { animation: none; }
       .slot { animation: none; }
     }
     ```

### 🟢 Points positifs

- `lang="fr"` ✅
- `<meta viewport>` correct ✅
- SVG décoratifs en `aria-hidden="true"` ✅
- `alt` correct sur le portrait ✅
- Charset UTF-8 ✅

---

## 2. Utilisabilité (NN/g #1, #2, #6, #8)

### 🟡 À revoir

1. **NN/g #6 — Reconnaissance plutôt que rappel** : les abréviations `pv`, `ca`, `init`, `m` ne sont pas explicitées (`<abbr title="...">`). Un nouveau lecteur ne sait pas que `+4 init` = bonus d'initiative.

2. **NN/g #8 — Esthétique et minimalisme** : les puces décoratives `◆`, `❦`, `☩`, le double trait `│` sur les en-têtes de section ajoutent du bruit visuel. Esthétiquement justifié pour le thème, mais densité élevée.

3. **NN/g #1 — Visibilité du statut système** : non applicable (page statique sans état).

4. **Pas de table of contents / repère de section** sur une page longue. En desktop le scroll reste maîtrisable, en mobile c'est interminable (capture mobile : ratio hauteur/largeur > 20).

### 🟢 Points positifs

- Hiérarchie visuelle desktop claire (3 colonnes : caractéristiques / dons / arsenal).
- Groupement Gestalt fort (encadrés stat, sections séparées par règles d'or).

---

## 3. Typographie (Refactoring UI — Hierarchy, Whitespace)

### 🔴 Problèmes

1. **Stack de polices fragile.** `"Herculanum", "Luminari", "Trajan Pro", "Papyrus", serif` — toutes ces polices ne sont **présentes que sur macOS**. Sur Windows/Linux, fallback `serif` brut → identité visuelle perdue. Sur mobile Android : fallback générique.
   - **Fix :** héberger une vraie police titre (Cinzel, IM Fell, Marcellus SC) en local (`fonts/`) — voir CLAUDE.md règle souveraineté.

2. **Letter-spacing extrême** : `0.32em` à `0.40em` sur les labels, `0.14em` sur le titre. Fait partie de la signature visuelle mais réduit la vitesse de lecture mesurée d'environ 20–30 %.

3. **Taille texte de base 15 px** : sous le standard moderne (16 px). En lecture longue (« Serments intérieurs », « Rites de combat »), inconfort.
   - **Fix :** `font-size: 16px` minimum body, garder 10–11 px réservés aux labels décoratifs.

4. **`white-space: nowrap` sur `.name-block`** → cause directe du débordement horizontal mobile (cf. capture).

### 🟢 Points positifs

- Mesure de ligne (line-length) respectée dans les blocs prose.
- Hiérarchie de tailles cohérente avec `clamp()` sur le titre principal.
- `font-feature-settings: "liga", "dlig", "onum"` ✅ (chiffres elzéviriens).

---

## 4. Design visuel (Material 3 / Refactoring UI — Color, Depth, Visual weight)

### 🟢 Très bon

- **Palette restreinte et cohérente** : 4 dorés + 3 ambre + 1 obsidien. Refactoring UI : « Use very few colors, vary saturation and lightness » ✅.
- **Profondeur** : grain SVG fixe, gradients radiaux, ombres internes — belle feuille de papier brûlé.
- **Hiérarchie par poids visuel** : caractéristique active (`.attr.prof`) bien distinguée.
- **Direction artistique unique** : la fiche se reconnaît au premier coup d'œil.

### 🟡 À surveiller

- **Fond ultra-sombre + texte parchemin** : fatigue oculaire en lecture longue. Material 3 recommande `#1C1B1F` minimum pour les surfaces sombres ; ici `#0b0907` est plus noir que noir.
- **Animation `ember-pulse` infinie** sur les slots : distraction permanente, ne respecte pas `prefers-reduced-motion`.

---

## 5. Mobile (Apple HIG — Layout, Touch targets / Material 3 — Adaptive)

### 🔴 BLOQUANT

Capture `playwright/dareth-mobile.png` à 390 px : **page totalement cassée**.

1. **Débordement horizontal** : `.name-block { white-space: nowrap }` force « DARETH BRUMEVAL » sur une seule ligne à 36 px → largeur ≈ 480 px → scroll horizontal forcé.
   - **Fix :** retirer `nowrap` ou faire deux `<span>` empilés en mobile :
     ```css
     @media (max-width: 600px) {
       .name-block { white-space: normal; }
       .display .first, .display .last { display: block; }
     }
     ```

2. **Padding body 60px 40px** : sur 390 px de large, il reste 310 px de contenu utile (= 79 %). Excessif.
   - **Fix :** `@media (max-width: 600px) { body { padding: 24px 16px; } }`.

3. **Breakpoint unique à 1100 px** : pas de palier intermédiaire tablette / mobile. Tout passe en colonne unique d'un coup, sans optimisation des tailles de police, des paddings, ni des grilles internes (`.attributes`, `.weapon-table`, `.ritual-grid`).
   - **Fix :** ajouter `@media (max-width: 600px)` avec :
     - réduction `font-size` titres (`clamp(28px, 8vw, 40px)`),
     - `gap` réduits,
     - `padding` cartes réduits,
     - tableau `.weapon-table` en cards verticales (responsive table pattern).

4. **Cibles tactiles** : aucune (page statique sans interaction). Apple HIG min 44×44 px non concerné, mais à anticiper si on ajoute des liens vers d'autres fiches.

5. **Lignes de stats** : la grille `.attributes` à 2 colonnes × N lignes en mobile produit des cartes très étroites où le score (40 px) cohabite mal avec le label.

---

## Top 5 actions prioritaires

| # | Action | Impact | Effort |
|---|---|---|---|
| 1 | Corriger le débordement mobile (`white-space: nowrap` + media query 600 px) | 🔴 Bloquant | XS |
| 2 | Hiérarchie sémantique : `<h2>` sur les sections, `<section aria-labelledby>` | 🟠 A11y | S |
| 3 | Auditer et corriger les usages de `--gold-dim` (contraste < 4.5:1) | 🟠 A11y | S |
| 4 | Ajouter `:focus-visible` + `prefers-reduced-motion` | 🟠 A11y | XS |
| 5 | Auto-hébergement d'une vraie police titre (Cinzel/IM Fell) en `fonts/` | 🟡 Identité | M |

---

## Conformité référentiels

| Référentiel | Conformité |
|---|---|
| **NN/g 10 heuristiques** | 6/10 (échec sur #4 cohérence/standards a11y, #7 flexibilité, #8 minimalisme) |
| **WCAG 2.2 AA** | ❌ Non-conforme (1.4.3 contraste, 1.3.1 structure, 2.3.3 motion, 2.4.7 focus) |
| **Material Design 3** | 🟡 Partiel (palette ✅, responsive ❌, motion ❌) |
| **Apple HIG** | 🟡 Partiel (clarté ✅, deference ✅, adaptive layout ❌) |
| **Refactoring UI** | 🟢 Très bon (couleurs, profondeur, hiérarchie visuelle desktop) |
