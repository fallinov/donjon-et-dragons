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
- **Tests** : Vitest (unit, 301 tests) + Playwright (e2e, 146 tests, chromium desktop + mobile safari)
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
│   │   ├── platform.ts              # iPhone / app installée (écran d'accueil)
│   │   └── swipe.ts                 # logique pure du swipe mobile (verrouillage d'axe)
│   ├── components/
│   │   ├── PrintButton.vue
│   │   ├── ConfirmDialog.vue        # boîte de confirmation du codex (useConfirm), remplace confirm()
│   │   ├── pwa/                     # PwaUpdateToast (nouvelle version), PwaInstallHint (installation)
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
pnpm test             # Vitest (unit) — 301 tests (requêtes SQL sur PGlite, stockage IndexedDB, composables d'état et de sac, dataset, composants, swipe)
pnpm test:watch       # Vitest en mode watch
pnpm test:e2e         # Playwright e2e — 146 tests (chromium desktop + mobile safari)
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
- **Persistance** : store IndexedDB `inventories`, clé = identifiant de la fiche. Synchronisé avec le compte (partie « sac » de la fiche, voir Synchronisation dans l'app).
- **Affichage** : cinquième onglet « Sac » sur mobile, section sous les rites sur ordinateur. Non imprimé.
- **Robustesse** : une sauvegarde abîmée est nettoyée, une quantité à 0 retire l'objet.

## Export, import et partage

Menu « ⋯ » d'une fiche : **Partager** (menu natif du téléphone : Mail, Messages, WhatsApp, Fichiers… ; masqué si le navigateur ne sait pas partager de fichiers), **Exporter (fichier)** (téléchargement), **Restaurer l'original** (fiches de départ) et **Supprimer**. Sur l'accueil : **Nouvelle fiche** en haut ; **Importer une fiche** (lien discret sous la liste) et restauration des fiches de départ supprimées (masters). Le passage d'une fiche d'un appareil à l'autre se fait par la synchronisation des comptes ; le transfert par code a été retiré (#56).

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

## Base de données

**Mise en service** : Vercel → Storage → Create → Neon (région Frankfurt), connecter le projet en Production et Preview (injecte `DATABASE_URL`). Le schéma est créé et mis à jour au premier appel (migrations de `server/utils/database.ts`). Optionnel : `CRON_SECRET` pour réserver le nettoyage à la tâche Cron.

## Comptes

Connexion par identifiant et mot de passe, **obligatoire** (issue #53). Le **master** crée les comptes des joueurs (aucune inscription publique) et réinitialise les mots de passe oubliés (aucune adresse email enregistrée). Une fois connecté, chacun retrouve toutes les fiches du groupe sur tous ses appareils ; il modifie les siennes, celles des autres sont en lecture seule.

**Parcours** :
1. **Installation**, une seule fois : `/installation` crée le compte master. En ligne, le code d'installation est demandé (variable `SETUP_CODE` à définir dans Vercel) ; la page ne fonctionne plus dès qu'un compte existe.
2. **Comptes** (`/comptes`, master) : créer un compte joueur affiche un mot de passe provisoire (`K7P4-QX9M-3HDE`), une seule fois. Sur chaque compte : **Renommer** (le sien compris), **Passer master** / **Passer joueur** (le groupe garde toujours au moins un master), **Réinitialiser** (nouveau mot de passe provisoire, déconnexion de tous ses appareils) et **Supprimer**. Tous les masters ont les mêmes droits ; un master ne peut ni se supprimer ni réinitialiser son propre mot de passe.
3. **Connexion** (`/connexion`, lien en bas de l'accueil). Avec un mot de passe provisoire, l'app impose d'abord d'en choisir un nouveau (`/mot-de-passe`).

**Sécurité** :
- mot de passe haché avec scrypt (`node:crypto`, sel aléatoire), 8 caractères minimum ;
- session : jeton aléatoire dans un cookie `httpOnly`, `Secure` en ligne, `SameSite=Lax`, valable 90 jours et prolongé à l'usage ; le serveur n'en garde que l'empreinte ;
- par heure : 10 essais de connexion par identifiant et adresse IP, 30 par adresse IP, 100 par identifiant ; 10 essais du code d'installation par adresse IP ; 10 essais du mot de passe actuel par compte. Même réponse pour un identifiant inconnu ou un mauvais mot de passe ;
- sans `SETUP_CODE`, l'installation n'est possible qu'en développement local (`pnpm dev`) ;
- requêtes de modification : même origine et JSON obligatoires (protection CSRF, `server/middleware/csrf.ts`).

| Élément | Rôle |
|---|---|
| `server/utils/database.ts` | client Neon partagé, migrations numérotées (`schema_migrations`), compteurs de limitation |
| `server/utils/accountStore.ts` | comptes et sessions, Neon ou mémoire (local, e2e) |
| `server/utils/accountRules.ts`, `password.ts`, `session.ts` | règles (identifiant, mot de passe, durées), scrypt, cookie de session et contrôles d'accès |
| `server/api/setup.*`, `server/api/auth/*`, `server/api/users/*` | installation, connexion, déconnexion, compte courant, mot de passe, gestion des comptes (création, renommage, rôle, réinitialisation, suppression) |
| `app/composables/useAuth.ts` | compte connecté (`useState`), appels à l'API, erreurs traduites |
| `app/pages/connexion.vue`, `mot-de-passe.vue`, `installation.vue`, `comptes.vue` | pages des comptes ; `app/middleware/auth.global.ts` protège `/comptes` et impose le changement d'un mot de passe provisoire |

### Synchronisation dans l'app

- **Connexion** : obligatoire ; le compte est gardé sur l'appareil, l'app s'ouvre donc hors ligne après une première connexion. Session expirée : retour à la connexion, les fiches restent sur l'appareil.
- **Modifications** : chaque écriture (fiche, PV, sac, suppression) est notée dans l'outbox IndexedDB (`app/db/characterRepository.ts`), dans la même transaction. `useSync` (`app/composables/useSync.ts`) envoie l'outbox 2 s après une modification, au démarrage, au retour au premier plan, au retour du réseau et toutes les 60 s, puis reçoit ce qui a changé (curseur relu 50 révisions en arrière).
- **Données reçues** : écrites par `app/db/syncRepository.ts` sans passer par l'outbox ; une partie qui a une modification locale en attente n'est pas touchée. Les PV et le sac affichés se mettent à jour sans être renvoyés (`applyExternal` de `persistState`).
- **Droits** (`useOwnership`) : un master modifie tout ; un joueur, ses fiches. Fiche d'un autre : mention « Fiche de X — lecture seule », zone de jeu désactivée (`CodexLock`, un `fieldset disabled`), ni Modifier, ni Restaurer, ni Supprimer. Importer la fiche d'un autre en fait une copie à soi.
- **Première connexion d'un compte sur l'appareil** : une fiche déjà présente et modifiée ici part sur le serveur si le compte peut l'écrire, sinon elle devient une copie à soi ; les autres prennent la version du serveur. Le premier master envoie les 6 fiches de départ.
- **Attribution** : `/comptes` → section Fiches, un propriétaire par fiche (ou « Groupe (masters) »).
- **Déconnexion** : la synchronisation s'arrête d'abord (elle reprend si la déconnexion échoue, hors ligne), puis les fiches sont retirées de l'appareil (il peut être partagé) ; confirmation, avec un avertissement si des modifications n'ont pas encore été envoyées.

### API de synchronisation (serveur)

Les fiches sont stockées sur le serveur, une ligne par fiche. Une fiche a trois parties datées : la fiche elle-même, l'état de jeu (PV, emplacements…) et le sac. **La dernière modification gagne, partie par partie** : des PV joués à la table n'écrasent pas une fiche modifiée sur l'ordinateur. Le portrait est stocké à part ; un appareil ne le télécharge que si son empreinte a changé.

| Route | Rôle |
|---|---|
| `GET /api/sync?since=N` | fiches modifiées depuis le curseur `N` (0 : toutes), par pages de 20, avec propriétaire et dates |
| `POST /api/sync` | modifications `{ id, part: sheet \| state \| inventory \| delete, data, changedAt }`, au plus 50 ; résultat par modification : `applied`, `stale` (plus ancienne que le serveur), `forbidden`, `invalid`, `notFound` |
| `GET /api/portraits/:id` | portrait (ETag = empreinte ; `nosniff` et CSP `sandbox`) |
| `PATCH /api/characters/:id/owner` | attribuer une fiche à un compte (master) ; `null` : fiche du groupe |
| `GET /api/members` | membres du groupe (identifiant, rôle), pour afficher le propriétaire d'une fiche |

Règles :
- chaque compte connecté **lit** toutes les fiches ; un joueur **modifie** les siennes, un master toutes ;
- une nouvelle fiche appartient à celui qui l'envoie ; les fiches de départ ne peuvent être créées que par un master ;
- une fiche reçue passe par la même lecture stricte qu'un fichier importé (`parseCharacterFile`) ;
- une date de modification à plus d'une minute dans le futur est ramenée à l'heure du serveur ;
- plafonds : fiche 100 Ko (hors portrait), portrait 1,5 Mo (JPEG, PNG ou WebP reconnus à leur contenu, jamais de SVG), sac 50 Ko, 20 fiches par joueur, 1 200 envois par heure et par compte ; un joueur ne crée que des fiches à identifiant UUID ;
- une suppression efface les données (la ligne reste pour prévenir les autres appareils) ; une fiche envoyée après la suppression la fait revenir ;
- compte supprimé : ses fiches reviennent au groupe.

Fichiers : `server/utils/syncRules.ts` (règles pures), `server/utils/syncStore.ts` (Neon ou mémoire), `shared/types/sync.ts`.

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
