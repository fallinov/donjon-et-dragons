# Audit UX/UI — Codex Dareth Brumeval

**Date** : 2026-04-08
**Fichier audite** : `fiche-dareth-brumeval.html` (466 lignes, HTML statique + Tailwind)
**Methode** : analyse du code source (Option D). Aucun serveur local fourni, pas d'execution Playwright lors de cette passe.
**Auditeur** : skill `sfa-audit-ux`

---

## 1. Detection de la stack

- **Plateforme** : Web statique, fichier HTML unique
- **Framework** : aucun (HTML5 vanilla)
- **UI Library** : Tailwind CSS (script auto-heberge `libs/tailwindcss.js`, conforme souverainete CEJEF)
- **Styling** : Tailwind + config inline + CSS custom (focus-visible, grain, fleurons, print)
- **Polices** : Cinzel (display) + EB Garamond (body), auto-hebergees dans `fonts/`
- **Cibles** : web responsive (mobile `sm`, desktop `lg`), impression optimisee

Respect integral de la regle de souverainete : zero CDN externe, polices locales, script Tailwind local.

---

## 2. Contexte d'usage

Fiche de personnage JDR (D&D) mise en forme comme un codex medieval. Usage attendu : consultation pendant une partie (table, mobile, ecran partage) et impression. L'interface est **purement lecture** — aucune interaction, aucun formulaire, aucun changement d'etat. Le scope UX se limite donc a : lisibilite, hierarchie, scannabilite, accessibilite, impression, responsive.

---

## 3. Points forts

### Accessibilite (base solide)
- `lang="fr"` declare (l. 2) — WCAG 3.1.1
- **Skip link** fonctionnel `.skip-link` vers `#contenu` (l. 91-97, 134) — WCAG 2.4.1
- **Focus-visible** custom dore avec offset, reset propre sur `:focus` (l. 83-88) — WCAG 2.4.7
- **`prefers-reduced-motion`** respecte, neutralise `rise` et `ember` (l. 100-106) — WCAG 2.3.3
- **`motion-safe:`** applique sur toutes les animations utilitaires (l. 139, 181, 383-385, 423, 458)
- Alt texte **descriptif et contextuel** pour le portrait (l. 142-143)
- Sections structurees par `<section aria-labelledby="…">` partout (l. 184, 251, 265, 287, 313, 377, 409, 423)
- `sr-only` utilise pour le titre "Caracteristiques" masque visuellement (l. 185)
- Separateurs decoratifs `·` marques `aria-hidden="true"` (l. 153-156)
- `role="group"` + `aria-label` descriptif pour les emplacements de sorts (l. 382)
- Structure semantique correcte : `header`, `main`, `section`, `article`, `dl/dt/dd`, `table/thead/tbody`, `footer`
- CSS print dedie qui force noir sur blanc et masque `.no-print` (l. 123-128)

### Typographie et hierarchie
- Couple Cinzel (titres) / EB Garamond (corps) coherent, deux familles seulement — Refactoring UI respecte
- `font-feature-settings: "liga", "dlig", "onum"` (l. 72) — ligatures + chiffres elzeviriens, detail soigne
- Hierarchie H1 → H2 → H3 claire, un seul H1 (`Dareth Brumeval` l. 148)
- `clamp(2rem, 8vw, 4.25rem)` pour le H1 (l. 148) — fluide sans media queries
- `leading-relaxed` sur le body, interlignes confortables

### Responsive
- Grille qui passe de 1 colonne a `260px_1fr_1fr` en `lg` (l. 181)
- Header qui bascule `grid-cols-1 lg:grid-cols-[auto_1fr_auto]` (l. 139)
- **Double rendu** pour le tableau des armes : cartes en mobile, `<table>` en desktop (l. 317-374) — excellent pattern
- Paddings progressifs `px-4 py-6 sm:px-8 sm:py-12 lg:px-10 lg:py-16` (l. 132)
- `max-w-6xl mx-auto` centre et limite la largeur (l. 136)

### Signifiers visuels (Norman)
- Caracteristiques maitrisees differenciees par bordure pleine + gradient + shadow inset (l. 198, 228) — affordance visuelle forte
- Rituels de combat numerotes I/II/III (l. 429-454) — ordre mental respecte
- Resume HP/CA/Init/Vitesse en haut — scan immediat des stats critiques en combat

---

## 4. Problemes identifies

### A. Accessibilite — severite moyenne

1. **Contraste `parchment-mute` (#9a8a64) sur fond `obsidian` (#0b0907)** : ratio ~5.8:1, passe AA normal mais echoue AAA et devient limite sur `text-xs` / `text-[10px]`. Concerne `sauv · +0` (l. 192), `45 m / 180 m` (l. 320), captions italiques, footer (l. 458).
   - Recommandation : remonter `parchment-mute` a `#b09d72` (~7.2:1, AAA small text).

2. **Texte `text-[10px]` et `text-[11px]`** omnipresent sur les labels de caracteristiques (l. 162, 166, 170, 174, 190, 202, etc.). WCAG recommande 12px minimum pour du texte informatif ; en Garamond (petite hauteur d'x) la lecture sur mobile devient difficile.
   - Recommandation : passer a `text-xs` (12px) minimum pour tout texte informatif.

3. **Losange `◆` ambivalent** : signale la maitrise d'une carac (l. 202, 232 avec `aria-label="maitrise"`) ET sert de bullet decoratif dans `.section-title::before` (l. 116-120). Meme symbole, deux significations — incoherence semantique.
   - Recommandation : badge textuel distinct pour la maitrise (`<abbr title="Maitrise">M</abbr>` ou SVG dedie).

4. **Tableau des armes** (l. 344-374) : pas de `<caption>` ni de `scope="col"` sur les `<th>`.
   - Recommandation : `<caption class="sr-only">Armes equipees</caption>` + `scope="col"` sur chaque `<th>`.

5. **Emplacements de sorts animes** (l. 383-385) : `aria-label` donne bien "3 sur 3" aux AT, mais la valeur n'est **visible** nulle part pour les voyants. Un joueur qui regarde la fiche sans la memoriser ne sait pas combien d'emplacements il lui reste sans les compter.
   - Recommandation : afficher `3 / 3` en texte a cote du groupe.

6. **Cartes mobiles armes (l. 317-342)** : labels "Bonus d'att." et "Degats" repetes textuellement sans lien semantique. Une `<dl>` dans chaque article serait plus propre pour lecteur d'ecran.

### B. Utilisabilite (Nielsen, Krug, Norman) — severite moyenne

7. **Aucun etat de consommation** : HP 33/33, sorts 3/3, inspirations, sont **figes**. En usage reel, un joueur coche, barre, raye. La fiche n'est utilisable qu'a pleine puissance ou en impression. Pas de case a cocher, pas d'input numerique, pas de compteur.
   - Recommandation : meme en statique, `<input type="checkbox">` stylises pour sorts + mini compteur HP (`<input type="number">`). Sinon, etiqueter explicitement dans le README "feuille de reference non-editable, imprimer pour usage table".

8. **Pas de navigation** : document isole, aucun lien "autres personnages", aucun retour, aucun breadcrumb. Si le projet doit heberger plusieurs fiches, c'est une impasse (chaque fiche est un cul-de-sac — viole Nielsen #3 "User control and freedom").
   - Recommandation : `index.html` listant les personnages + lien retour en haut de chaque fiche.

9. **Bouton d'impression absent** alors que le CSS print est soigne (l. 123-128). L'utilisateur doit deviner que Ctrl+P fonctionne — viole Nielsen #6 "Recognition rather than recall".
   - Recommandation : bouton discret `.no-print` `onclick="window.print()"` en haut a droite, icone + `aria-label`.

10. **Footer sans utilite fonctionnelle** (l. 458-462) : pas de date de derniere modification, pas de version, pas de lien campagne/MJ. Detail, mais un codex vivant merite un horodatage.

### C. Design visuel — severite faible

11. **Distinction "maitrise" fragile en lumiere forte** : le shadow inset `rgba(201,162,74,0.15)` (l. 198, 228) est a peine perceptible sur un ecran mat en exterieur.

12. **Palette dark-only, aucun support `prefers-color-scheme: light`**. Pour de la lecture prolongee en journee, seule l'impression offre une alternative claire.
    - Recommandation : theme clair optionnel OU documenter explicitement le parti-pris dark-only dans le README.

13. **Effet `grain` en `mix-blend-mode: overlay`** (l. 74-80) : decoratif mais reduit le contraste reel de tout le texte superpose. A valider avec un contrast checker "live".

14. **Animations `rise` 900ms avec delais 0.2/0.4/0.6s** (l. 181, 423, 458) : agreables au premier chargement, agacent a la 20e ouverture en soiree. `reduced-motion` les neutralise, mais pour les autres utilisateurs 500ms suffirait.

### D. Responsive — severite faible

15. **Largeur de ligne mobile** : sur `grid-cols-1`, les descriptions de dons (l. 270-282) atteignent 80+ caracteres sur iPhone standard — limite haute Refactoring UI (45-75 recommandes).

16. **Breakpoint `md:hidden`/`md:table`** pour les armes (l. 317, 344) : en tablette portrait ~768px, la table s'affiche un peu a l'etroit. A verifier visuellement avec Playwright a 768 px exactement.

### E. Coherence et contenu — severite tres faible

17. **Pattern carte caracteristique duplique 6 fois** (l. 188-245) avec variantes normal/maitrise. Acceptable en HTML statique, mais un Web Component reduirait le risque de derive.

18. **Typo contenu** : l. 270 "Draconique **su** comme langue maternelle" — probable faute pour "parle" ou "connu". A verifier.

---

## 5. Notation par reference

```
┌─────────────────────────────┬───────┬─────────────────────────────────────────────────────────┐
│ Reference                   │ Note  │ Justification                                           │
├─────────────────────────────┼───────┼─────────────────────────────────────────────────────────┤
│ Nielsen (10 heuristiques)   │ 6/10  │ Feedback et visibilite systeme nuls (rien d'interactif),│
│                             │       │ control/freedom absent. Aesthetic & minimalist OK.      │
│ Don Norman                  │ 7/10  │ Signifiers visuels forts (bordure pleine = maitrise),   │
│                             │       │ mais pas d'affordance interactive : tout est fige.      │
│ Steve Krug                  │ 8/10  │ Scannable, conventions respectees, "omit needless".     │
│                             │       │ Labels 10-11px penalisent localement la scannabilite.   │
│ Alan Cooper (About Face)    │ 6/10  │ Persona clair (joueur en partie) mais flux absent —     │
│                             │       │ la fiche n'accompagne aucune tache reelle.              │
│ Luke Wroblewski (Mobile 1st)│ 7/10  │ Double rendu cards/table excellent. Typo 10px trop     │
│                             │       │ petite en mobile. Script Tailwind JIT en JS = poids.    │
│ Brad Frost (Atomic Design)  │ 6/10  │ Tokens couleurs/fonts bien definis dans tailwind.config,│
│                             │       │ mais zero composant, HTML plat avec duplication.        │
│ Material Design 3           │ 4/10  │ Esthetique anti-M3 (volontairement). Pas de tokens M3,  │
│                             │       │ pas d'elevation standard. Parti-pris assume.            │
│ Apple HIG                   │ 5/10  │ Clarte OK, deference absente (theme charge), profondeur │
│                             │       │ via ombres OK, focus ring conforme.                     │
│ Refactoring UI              │ 8/10  │ Hierarchie forte, 2 polices, palette limitee,           │
│                             │       │ espacement coherent, profondeur via ombres/gradients.   │
│ Laws of UX (Yablonski)      │ 7/10  │ Jakob OK (conventions), Miller OK (blocs de 4-6).       │
│                             │       │ Aesthetic-Usability tres bien exploite.                 │
├─────────────────────────────┼───────┼─────────────────────────────────────────────────────────┤
│ MOYENNE GLOBALE             │ 6.4/10│                                                         │
└─────────────────────────────┴───────┴─────────────────────────────────────────────────────────┘
```

**Lecture** : le projet est esthetiquement et typographiquement tres maitrise (Krug, Refactoring UI, Laws of UX ≥ 7), et l'a11y technique est nettement au-dessus de la moyenne. Ce qui fait chuter la moyenne, c'est que **la fiche est statique** alors que son contexte d'usage demande de l'interaction (Nielsen, Cooper, Norman). Choix assume, mais non nomme.

---

## 6. Recommandations prioritaires

| # | Priorite | Action | Effort | Impact |
|---|----------|--------|--------|--------|
| 1 | Haute | Remonter `parchment-mute` a >= #b09d72 et passer tous les `text-[10px]/[11px]` a `text-xs` | 15 min | A11y AAA |
| 2 | Haute | Ajouter bouton "Imprimer" `.no-print` en haut + `aria-label` | 10 min | Nielsen #6 |
| 3 | Haute | Ajouter `<caption class="sr-only">` et `scope="col"` au tableau armes | 5 min | WCAG 1.3.1 |
| 4 | Haute | Corriger typo l. 270 "Draconique su" | 1 min | Qualite contenu |
| 5 | Moyenne | Afficher "3 / 3" textuel a cote des emplacements de sort | 5 min | Parite voyants/AT |
| 6 | Moyenne | Rendre les emplacements cochables (`<button aria-pressed>`) | 30 min | Nielsen #1 |
| 7 | Moyenne | Remplacer le losange `◆` de maitrise par un badge `M` distinct du bullet | 15 min | Levee d'ambiguite |
| 8 | Basse | Reduire les animations `rise` a 500ms | 2 min | Confort repetition |
| 9 | Basse | Creer un `index.html` listant les fiches | 1 h | Nielsen #3 |
| 10 | Basse | Theme clair via `prefers-color-scheme: light` OU doc du parti-pris dark-only | 2 h | Confort journee |

---

## 7. Conclusion

**Le codex Dareth Brumeval est un exercice de style typographique et d'accessibilite de base remarquable.** Direction artistique coherente, fondations WCAG serieuses (skip link, focus-visible, reduced-motion, aria-labelledby, alt riche), patterns responsive dignes d'une production (double rendu table/cartes).

**Les faiblesses sont de deux ordres** :
1. **Techniques, corrigeables en < 1 h** : micro-contrastes, tailles 10-11px, caption de table, typo contenu.
2. **Structurelles, liees au scope** : la fiche est passive dans un contexte d'usage actif (partie JDR). Tant que le parti-pris "document imprimable VS outil interactif" n'est pas tranche, le produit reste un bel objet plutot qu'un outil de table.

**Note globale : 6.4/10** — projet soigne, techniquement propre, limite par un choix de scope non assume. Passer a 8/10 demande les 4 actions haute priorite ci-dessus plus une decision explicite sur l'interactivite.

---

*Fichiers de reference :*
- `/Users/fallste/WebstormProjects/donjon-et-dragons/fiche-dareth-brumeval.html`
- `/Users/fallste/WebstormProjects/donjon-et-dragons/README.md`
