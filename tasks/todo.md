# TODO — Donjon et Dragons

Features inspirées de [D&D Beyond](https://www.dndbeyond.com/) pour transformer le codex en outil de table utilisable en partie, tout en préservant l'identité visuelle parchemin/or/obsidienne.

## Question d'architecture à trancher avant le Lot 1

**Persistance de l'état mutable** (HP, slots, inspiration, notes) :

- [ ] Choisir : `localStorage` seul / `localStorage` + export JSON / Neon Postgres + auth / URL state
- **Recommandation** : démarrer par `localStorage` (composable `useCharacterState(slug)`), ajouter un export JSON en option, prévoir Neon + auth plus tard si multi-device.

---

## ⭐ Lot 1 — Haute valeur (aligné scope "codex de table")

- [ ] **1. HP tracker interactif** — current / max / temp avec boutons +/−, reset au long rest, persistance localStorage (S, 🟢🟢🟢)
- [ ] **2. Bonus de maîtrise** — bloc dédié en haut de la fiche (+2, +3…) (XS, 🟢🟢)
- [ ] **3. Sagesse passive (Perception)** — affichée explicitement dans le hero ou aside caractéristiques (XS, 🟢🟢)
- [ ] **4. Dés de vie** — affichage `1d8 × N` avec compteur consommé, reset partiel au long rest (½ récupérés) (S, 🟢🟢)
- [ ] **5. Jets de sauvegarde contre la mort** — 3 cases succès / 3 cases échecs cochables (S, 🟢🟢)
- [ ] **6. Dice roller visuel** — clic sur compétence/attaque/sauv → animation de dé, résultat affiché (M, 🟢🟢🟢)
- [ ] **7. Short rest / Long rest buttons** — restaurent HP/slots/dés de vie selon règles D&D 5e (S, 🟢🟢)
- [ ] **8. Inspiration toggle** — case cochable avec petite animation dorée (XS, 🟢)
- [ ] **9. Conditions actives** — toggles visibles (empoisonné, à terre, étourdi, concentration…) (M, 🟢🟢)
- [ ] **10. Concentration tracker** — indique le sort de concentration en cours, case "briser la concentration" (S, 🟢🟢)

## 🟡 Lot 2 — Valeur moyenne

- [ ] **11. Tabs mobile** — Combat / Actions / Sorts / Équipement / Personnage / Notes (pattern DDB mobile) (M, 🟡🟡)
- [ ] **12. Emplacements de sort multi-niveaux** — niv 1, 2, 3… (actuellement un seul niveau) (S, 🟡🟡)
- [ ] **13. Monnaie** — PO/PA/PE/PC/PP + inventaire simple (M, 🟡)
- [ ] **14. Poids d'équipement / encombrement** — calcul automatique selon Force (S, 🟡)
- [ ] **15. Niveau XP + barre de progression** — vers niveau suivant selon table D&D 5e (XS, 🟡)
- [ ] **16. Notes libres** — textarea persistée en localStorage par personnage (S, 🟡🟡)
- [ ] **17. Familier / companion** — sous-fiche compacte accessible depuis la fiche principale (M, 🟡)

---

## 🔴 Hors scope

Ne pas implémenter — ça transformerait le codex en gestionnaire d'état complet type D&D Beyond :

- Gestion de compte utilisateur / multi-joueurs
- Import DDB / sync API
- Combat tracker multi-personnages (MJ screen)
- Build / level up (progression de classe)
- Marketplace de personnages

---

## Méthode

- Un lot = une PR, branche `feat/lot-<n>-<sujet>`
- Chaque feature du lot = un commit atomique
- Tests Vitest pour chaque composable d'état (HP tracker, rest logic, death saves…)
- Tests Playwright e2e pour les flux interactifs critiques
- Validation finale : `pnpm test && pnpm test:e2e && pnpm build`

## Légende

- **Effort** : XS (5 min) · S (30 min) · M (1-2 h) · L (½ journée) · XL (1+ jour)
- **Valeur** : 🟢🟢🟢 critique · 🟢🟢 forte · 🟢 moyenne · 🟡 nice-to-have
