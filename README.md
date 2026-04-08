# Donjon et Dragons — Codex de personnages

Fiches de personnages D&D 5e en HTML statique, design narratif (parchemin / or / obsidienne), conformes à la nomenclature officielle francophone Wizards of the Coast.

🔗 **Demo** : https://fallinov.github.io/donjon-et-dragons/fiche-dareth-brumeval.html

## Stack

- HTML statique, zéro build
- [Tailwind CSS](https://tailwindcss.com) v3 (Play CDN auto-hébergé dans `libs/`)
- Polices [Cinzel](https://fonts.google.com/specimen/Cinzel) + [EB Garamond](https://fonts.google.com/specimen/EB+Garamond) auto-hébergées dans `fonts/`
- Portrait généré via [Nano Banana](https://github.com/gemini-cli-extensions/nanobanana) (Gemini 2.5 Flash Image)

> **Souveraineté** : aucune ressource externe en production (cf. règle CEJEF). Tailwind, fonts, images, JS — tout est servi en relatif.

## Structure

```
.
├── fiche-dareth-brumeval.html   # fiche complète, autonome
├── img/                          # portraits + favicons
├── fonts/                        # Cinzel, EB Garamond (.ttf)
├── libs/                         # tailwindcss.js
└── UX-AUDIT-REPORT.md            # audit UX/a11y NN/g + WCAG 2.2
```

## Développement

```bash
python3 -m http.server 8765
# puis http://localhost:8765/fiche-dareth-brumeval.html
```

## Accessibilité

- WCAG 2.2 AA — focus visible, skip link, `prefers-reduced-motion`, sections ARIA
- Responsive mobile-first (390 px → desktop)
- Print-friendly (`@media print`)

## Conventions

- Terminologie D&D 5e officielle francophone (cf. fiche WotC : Compétences, Capacités et traits, Attaques et incantations, DD de sauvegarde des sorts…)
- Code en anglais, commits en français
- Branches : `feat/`, `fix/`, `docs/`, `chore/`
