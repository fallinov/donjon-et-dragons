# Donjon et Dragons — Codex des personnages

Bibliothèque de fiches de personnages **D&D 5e** en codex médiévaux (parchemin, or, obsidienne). Construit en **Nuxt 4** + **Tailwind CSS v4** + **TypeScript strict**.

🌐 **Production** : https://donjon-et-dragons.vercel.app/

## Personnages consignés

| Slug | Personnage | Joueur | Race · Classe |
|---|---|---|---|
| [`dareth-brumeval`](https://donjon-et-dragons.vercel.app/personnages/dareth-brumeval) | Dareth Brumeval | Steve | Demi-elfe · Rôdeur niveau 6 |
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
- **Application installable (PWA)** : `@vite-pwa/nuxt`, manifeste « Codex D&D », service worker Workbox (mise à jour proposée par un bandeau), utilisable hors ligne, aide à l'installation (bouton sur Android, instructions sur iPhone)
- **Fiches stockées sur l'appareil** : IndexedDB (lib `idb`), rendu 100 % client (`ssr: false`, page d'accueil pré-rendue). Les 6 fiches de `app/data/characters/` sont importées au premier lancement
- **État interactif persisté** : composable `useCharacterState` singleton (HP, inspiration, repos, jets de mort, slots multi-niveaux, sorts daily) via `useState` Nuxt, enregistré dans IndexedDB à chaque changement
- **Sac persisté** : composable `useInventory` (équipement, argent, notes), modifiable et enregistré dans IndexedDB
- **Éditeur de fiche** : création, modification et suppression sur l'appareil (`/personnages/nouveau`, `/personnages/<id>/modifier`), validation structurelle, confirmation avant de quitter sans enregistrer
- **Tests** : Vitest (unit, 267 tests) + Playwright (e2e, 132 tests, chromium desktop + mobile safari)
- **Déploiement** : Vercel (Nitro preset) via `vercel.json`

## Structure

```
donjon-et-dragons/
├── app/
│   ├── app.vue                      # layout racine + skip link
│   ├── assets/css/main.css          # @theme Tailwind + @font-face + print A4 paysage
│   ├── composables/
│   │   ├── useCharacterState.ts     # état mutable + repos D&D 5e, enregistré dans IndexedDB
│   │   ├── useInventory.ts          # sac : équipement, argent, notes, enregistré dans IndexedDB
│   │   ├── persistState.ts          # synchronise un état partagé avec IndexedDB (chargement unique, écriture à chaque changement)
│   │   ├── useCharacters.ts         # useCharacterList(), useCharacter(id) depuis IndexedDB
│   │   ├── useObjectUrl.ts          # URL blob: d'un portrait, révoquée automatiquement
│   │   ├── useMobileTab.ts          # onglet actif mobile (Profil, Combat, Sorts, Sac, Stats)
│   │   ├── useT.ts                  # t() / tCount() : textes de l'interface
│   │   ├── useTransfer.ts           # transfert par code : envoi chiffré, réception, erreurs traduites
│   │   └── useIsDesktop.ts          # détecte le viewport >= lg
│   ├── db/
│   │   ├── schema.ts                # base IndexedDB `codex` : stores characters, states, inventories, meta
│   │   ├── characterRepository.ts   # lecture, écriture, suppression atomique des fiches
│   │   ├── migrations.ts            # migration des documents selon `schemaVersion`
│   │   ├── seed.ts                  # import des fiches de départ (et de leur sac) au premier lancement
│   │   └── legacy.ts                # reprise des données des versions précédentes (localStorage, format v1)
│   ├── plugins/
│   │   └── db.client.ts             # seed + demande de stockage persistant avant le premier rendu
│   ├── i18n/
│   │   └── fr.ts                    # catalogue des textes de l'interface (clés plates)
│   ├── utils/
│   │   ├── image.ts                 # portrait importé : réduit à 1024 px, JPEG 0,85, orientation EXIF, 25 Mo max
│   │   ├── characterFile.ts         # format d'export « codex-dnd/character » : sérialisation, lecture stricte, nom de fichier
│   │   ├── characterShape.ts        # contrôle complet des types d'une fiche importée
│   │   ├── base64.ts                # portrait ↔ base64 (export)
│   │   ├── share.ts                 # partage natif (Web Share) ou téléchargement
│   │   ├── toPlain.ts               # copie sans proxy réactif (avant écriture IndexedDB)
│   │   ├── characterFactory.ts      # fiche vierge (niveau 1) et fiche prête à enregistrer depuis un brouillon
│   │   ├── validateCharacter.ts     # contrôles structurels de l'éditeur (aucune règle D&D)
│   │   ├── vitals.ts                # libellés CA / initiative / vitesse lus par l'en-tête
│   │   ├── deepEqual.ts             # détection des modifications du brouillon
│   │   ├── newId.ts                 # UUID v4, aussi en http (réseau local)
│   │   ├── transferCode.ts          # code de transfert base32 Crockford, saisie tolérante
│   │   ├── transferCrypto.ts        # chiffrement AES-GCM, clé PBKDF2 dérivée du code
│   │   ├── platform.ts              # iPhone / app installée (écran d'accueil)
│   │   └── swipe.ts                 # logique pure du swipe mobile (verrouillage d'axe)
│   ├── components/
│   │   ├── PrintButton.vue
│   │   ├── ConfirmDialog.vue        # boîte de confirmation du codex (useConfirm), remplace confirm()
│   │   ├── pwa/                     # PwaUpdateToast (nouvelle version), PwaInstallHint (installation)
│   │   ├── transfer/                # TransferDialog : code de transfert, copier, partager le lien
│   │   ├── edit/                    # éditeur : EditForm, sections (identité, stats, caractéristiques, compétences, aptitudes, attaques, sorts, rites, langues, personnalité), champs (EditText, EditNumber, EditList repliable…)
│   │   ├── mobile/
│   │   │   ├── MobileMiniHeader.vue
│   │   │   ├── MobileSwipeContainer.vue # swipe horizontal entre onglets
│   │   │   └── MobileTabBar.vue
│   │   └── codex/
│   │       ├── CodexCharacterCard.vue # carte accueil avec brouillard au scroll
│   │       ├── CodexCounter.vue     # compteur +/− générique
│   │       ├── CodexHero.vue        # portrait + nom + vitals + brouillard animé
│   │       ├── CodexStatusBar.vue   # HP tracker + inspiration + repos + jets de mort
│   │       ├── CodexAbilityScores.vue
│   │       ├── CodexSkillList.vue
│   │       ├── CodexFeatureList.vue # capacités + liste d'avantages
│   │       ├── CodexInventory.vue   # argent, équipement, notes éditables
│   │       ├── CodexPersonality.vue
│   │       ├── CodexAttacks.vue
│   │       ├── CodexSpells.vue      # slots interactifs aria-pressed, consomme useCharacterState
│   │       ├── CodexSpellInfo.vue   # détails d'un sort : incantation, portée, durée, concentration
│   │       ├── CodexLanguages.vue
│   │       ├── CodexRituals.vue     # rites de combat, accordéon sur mobile
│   │       └── CodexSection.vue
│   ├── data/characters/
│   │   ├── index.ts                 # fiches de départ : seeds + getSeed(slug)
│   │   ├── dareth-brumeval.ts
│   │   ├── skamos-aurum.ts
│   │   ├── zanna.ts
│   │   ├── maera-vifbois.ts
│   │   ├── thunon.ts
│   │   └── kael-draven.ts
│   └── pages/
│       ├── index.vue                # liste des codex
│       ├── recevoir.vue             # recevoir une fiche par code ou lien
│       └── personnages/
│           ├── nouveau.vue          # création d'une fiche
│           └── [id]/
│               ├── index.vue        # fiche dynamique (lue dans IndexedDB)
│               └── modifier.vue     # édition d'une fiche
├── shared/types/character.ts        # interface Character (abilities, skills, attacks, spellcasting, rituals, personality)
├── prompts/
│   └── character-portrait.md        # template prompt pour la génération des portraits (Gemini)
├── public/
│   ├── fonts/                       # Cinzel, EB Garamond (.ttf)
│   └── img/                         # portraits JPEG (6) + fog textures (fog1/fog2.png) + favicons
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
pnpm test             # Vitest (unit) — 267 tests (stockage IndexedDB, composables d'état et de sac, dataset, composants, swipe)
pnpm test:watch       # Vitest en mode watch
pnpm test:e2e         # Playwright e2e — 132 tests (chromium desktop + mobile safari)
                      # dont mobile-standards.spec.ts : normes smartphone (débordement, 44 px, tailles, contraste 7:1) sur tous les écrans
pnpm test:e2e:pwa     # Playwright sur build de production : manifeste, hors ligne, /api hors service worker (port 3211)
```

Le serveur e2e tourne sur le port **3210** pour éviter les collisions avec un dev server existant. Le setup Vitest (`tests/setup.ts`) stubbe le hook `useState` de Nuxt et fournit une base IndexedDB neuve à chaque test (`fake-indexeddb`). `tests/helpers/characters.ts` construit des fiches stockées à partir des seeds.

### État mutable interactif

Le composable [`app/composables/useCharacterState.ts`](app/composables/useCharacterState.ts) expose l'état mutable de chaque personnage (HP courant/temp, inspiration, dés de vie utilisés, jets de mort, emplacements de sort consommés) avec :

- **Persistance** : store IndexedDB `states`, clé = identifiant de la fiche. Écriture à chaque changement : une écriture différée serait perdue si l'app se ferme juste après
- **Singleton** : via `useState` Nuxt pour que `CodexStatusBar` et `CodexSpells` partagent le même state
- **Règles D&D 5e** : `damage` / `heal` (HP temp d'abord, reset jets de mort si > 0), `castSpell` (plus petit emplacement libre de niveau ≥ au sort : lancement à niveau supérieur, magie de pacte), `shortRest` (slots occultiste), `longRest` (tout reset, moitié des dés de vie récupérés)
- **Helper** : `computePassivePerception(character)` calcule 10 + mod sagesse + bonus maîtrise si Perception est maîtrisée

### Sac du personnage

Le composable [`app/composables/useInventory.ts`](app/composables/useInventory.ts) gère l'équipement, les cinq pièces et les notes :

- **Point de départ** : champ optionnel `inventory` des fiches de départ (`equipment`, `coins`, `notes`), copié dans le sac au premier lancement. Une fiche créée sur l'appareil démarre avec un sac vide.
- **Persistance** : store IndexedDB `inventories`, clé = identifiant de la fiche. Propre à chaque appareil, non synchronisé.
- **Affichage** : cinquième onglet « Sac » sur mobile, section sous les rites sur ordinateur. Non imprimé.
- **Robustesse** : une sauvegarde abîmée est nettoyée, une quantité à 0 retire l'objet.

## Export, import et partage

Menu « ⋯ » d'une fiche : **Transférer** (code à 8 caractères, voir [Relais de transfert](#relais-de-transfert)), **Partager** (menu natif du téléphone : Mail, Messages, WhatsApp, Fichiers… ; masqué si le navigateur ne sait pas partager de fichiers), **Exporter (fichier)** (téléchargement), **Restaurer l'original** (fiches de départ) et **Supprimer**. Sur l'accueil : **Importer une fiche**, **Recevoir une fiche** (page `/recevoir`) et restauration des fiches de départ supprimées.

Format `*.codex.json` (export). **Partager** envoie le même contenu nommé `*.codex.txt` (`text/plain`), car Chrome Android refuse de partager un `.json` ; s'il refuse quand même, la fiche est téléchargée en `.codex.json`. L'import accepte les deux extensions :

```jsonc
{
  "format": "codex-dnd/character",
  "schemaVersion": 2,                // version du modèle (migrée à l'import si plus ancienne)
  "exportedAt": "2026-10-11T12:00:00.000Z",
  "character": { /* fiche complète */ "portrait": { "alt": "…", "mime": "image/jpeg", "base64": "…" } },
  "state": { /* PV, inspiration, dés de vie, emplacements… (facultatif) */ },
  "inventory": { /* sac (facultatif) */ }
}
```

L'import refuse un fichier qui n'est pas une fiche du codex, d'une version plus récente de l'app, de plus de 15 Mo, ou dont un champ a un type inattendu ; un état de jeu ou un sac abîmés sont ignorés. Si la fiche existe déjà sur l'appareil : **Remplacer**, **Importer en copie** (nouvel identifiant, nom suivi de « (copie) ») ou **Annuler**, avec l'indication de la version la plus récente.

## Relais de transfert

Transfert d'une fiche (photo comprise) avec un code de 8 caractères, valable 24 h. Le téléphone chiffre la fiche avant l'envoi : le serveur ne reçoit que l'empreinte du code et un contenu illisible.

**Parcours** : sur sa fiche, « ⋯ » → **Transférer** affiche le code (`K7P4-QX9M`), avec **Copier le code** et **Partager le lien** (`/recevoir#K7P4QX9M` : le code reste après le `#`, jamais envoyé au serveur). Le destinataire touche **Recevoir une fiche** sur l'accueil, saisit le code ou ouvre le lien, puis **Recevoir** : la fiche passe par la même lecture stricte que l'import de fichier, avec le même choix en cas de doublon (Remplacer / Importer en copie / Annuler). Rien n'est importé sans appui sur **Recevoir**.

**iPhone** : un lien s'ouvre dans Safari, dont les fiches sont séparées de celles de l'app installée. Dans Safari, la page `/recevoir` rappelle d'ouvrir l'app installée et d'y saisir le code (bouton **Copier le code**), et propose **Recevoir dans Safari** sinon.

| Élément | Rôle |
|---|---|
| `app/utils/transferCode.ts` | code base32 de Crockford (`K7P4-QX9M`), saisie tolérante |
| `app/utils/transferCrypto.ts` | identifiant = SHA-256 du code ; AES-GCM 256, clé PBKDF2-SHA256 (600 000 itérations) |
| `app/composables/useTransfer.ts` | `sendCharacter` (chiffrement + dépôt, nouveau code si 409), `receiveCharacter` (lecture + déchiffrement + `parseCharacterFile`), erreurs traduites |
| `app/components/transfer/TransferDialog.vue` | boîte « Transférer » : code, échéance, copier, partager le lien, réessayer |
| `app/pages/recevoir.vue` | saisie du code (prérempli depuis le lien), rappel iPhone dans Safari |
| `server/api/transfers/index.post.ts` | dépôt `{ id, data }` → `{ expiresAt }` (400, 409, 413, 429, 503) |
| `server/api/transfers/[id].get.ts` | lecture `{ data, expiresAt }` (404 si inconnu ou expiré) |
| `server/api/cron/transfers-cleanup.get.ts` | nettoyage quotidien (Cron Vercel, 3 h UTC) |
| `server/utils/transferStore.ts` | stockage Neon Postgres (`DATABASE_URL`) ou mémoire (local, e2e) |

Limites : 2 Mo, 20 dépôts et 60 lectures par heure et par adresse IP (stockée hachée). Fonctions Vercel en région `fra1`, base Neon à Francfort.

**Mise en service** : Vercel → Storage → Create → Neon (région Frankfurt), connecter le projet en Production et Preview (injecte `DATABASE_URL`). Les tables sont créées au premier appel. Optionnel : `CRON_SECRET` pour réserver le nettoyage à la tâche Cron.

## Déploiement

Déploiement automatique sur Vercel via Git (branche `main`).

**Manuel** :
```bash
pnpm dlx vercel deploy --prod
```

Le projet est lié via `.vercel/project.json` (org `steves-projects-7a849401`, projet `donjon-et-dragons`). Nitro preset `vercel` est configuré dans `nuxt.config.ts`.

## Ajouter un personnage

Fiche de départ livrée avec l'app (importée au premier lancement sur chaque appareil) :

1. Créer `app/data/characters/<slug>.ts` exportant un `CharacterSeed` typé depuis `~~/shared/types/character` (ne pas oublier le champ `player`)
2. L'importer dans `app/data/characters/index.ts` et l'ajouter au tableau `seeds`
3. Générer le portrait avec le template `prompts/character-portrait.md`, le convertir en JPEG (`sips -s format jpeg -s formatOptions 85 <slug>.png --out public/img/<slug>.jpg`)
4. La fiche est accessible sur `/personnages/<slug>`
5. Tester : `pnpm test && pnpm test:e2e`

⚠️ Un appareil déjà initialisé n'importe pas les nouvelles fiches de départ (l'import ne tourne qu'une fois) ni les modifications des fichiers existants.

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
- **Textes de l'interface** : jamais en dur dans les composants. Ajouter la clé dans `app/i18n/fr.ts` et l'afficher avec `t('cle', { param })` ; pluriels via les paires `cle.one` / `cle.other` et `tCount('cle', n)`
- **Souveraineté** : aucun CDN externe, tout self-hosted (libs, fonts, images)

## Documentation

- [`docs/UX-AUDIT-REPORT.md`](docs/UX-AUDIT-REPORT.md) — Audit UX/a11y NN/g + WCAG 2.2 sur la version HTML initiale
