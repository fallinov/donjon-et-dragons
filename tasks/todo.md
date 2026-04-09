# TODO — Donjon et Dragons

Features inspirées de [D&D Beyond](https://www.dndbeyond.com/) pour transformer le codex en outil de table utilisable en partie, tout en préservant l'identité visuelle parchemin/or/obsidienne.

## Question d'architecture à trancher avant le Lot 1

**Persistance de l'état mutable** (HP, slots, inspiration, notes) :

- [x] **Choix retenu** : `localStorage` par slug (clé `codex:<slug>:state`) via composable `useCharacterState(character)` singleton `useState` Nuxt. Export JSON / Neon + auth reportés si besoin multi-device.

---

## ⭐ Lot 1 — Haute valeur (aligné scope "codex de table")

- [x] **1. HP tracker interactif** — current / max / temp avec inputs +/−, reset au long rest, persistance localStorage (PR #5)
- [x] **2. Bonus de maîtrise** — bloc dédié dans le bandeau `CodexStatusBar` (PR #5)
- [x] **3. Sagesse passive (Perception)** — calculée via `computePassivePerception` et affichée dans le bandeau (PR #5)
- [x] **4. Dés de vie** — compteur `Nd<die>` cliquable dans le bandeau, récupération ½ au long rest (PR #5)
- [x] **5. Jets de sauvegarde contre la mort** — 3 cases succès / 3 cases échecs, visibles uniquement à HP=0 (PR #5)
- [ ] **6. Dice roller visuel** — clic sur compétence/attaque/sauv → animation de dé, résultat affiché (M, 🟢🟢🟢) — **reporté**
- [x] **7. Short rest / Long rest buttons** — règles D&D 5e (short restaure slots occultiste, long restaure HP+slots+½dés de vie+jets de mort) (PR #5)
- [x] **8. Inspiration toggle** — badge cochable dans le bandeau (PR #5)
- [ ] **9. Conditions actives** — toggles visibles (empoisonné, à terre, étourdi, concentration…) (M, 🟢🟢) — **reporté**
- [ ] **10. Concentration tracker** — indique le sort de concentration en cours, case "briser la concentration" (S, 🟢🟢) — **reporté**

## 🟡 Lot 2 — Valeur moyenne

- [x] **11. Tabs mobile** — 4 onglets Profil/Combat/Sorts/Stats (feat/mobile-tabs)
- [x] **12. Emplacements de sort multi-niveaux** — `SpellSlotLevel[]` + `Spell.cost` (cantrip/slot/daily) + bouton Lancer dans CodexSpells
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
