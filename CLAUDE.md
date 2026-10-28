# Donjon & Dragons — Codex numérique

## Stack
- Nuxt 4 + Vue 3 + TypeScript strict + Tailwind CSS v4
- Fiches stockées sur l'appareil dans IndexedDB (`app/db/`, lib `idb`), rendu client uniquement (`ssr: false`)
- Fiches de départ (seeds) en fichiers TypeScript typés (`app/data/characters/`), importées au premier lancement par `app/plugins/db.client.ts`. Une fiche supprimée ne revient pas
- API serveur (`server/`, fonctions Vercel en `fra1`) : comptes et synchronisation. Stockage Neon si `DATABASE_URL` est défini (intégration Vercel, une base séparée par branche de preview ; ne jamais lire ni afficher sa valeur), mémoire en local et en e2e, 503 en production sans base. Nettoyage quotidien `/api/cron/cleanup` (Cron Vercel : sessions expirées, compteurs de limitation). Le transfert par code a été retiré (#56) : la synchronisation le remplace. Détection iPhone / app installée : `app/utils/platform.ts`
- Comptes (`server/api/auth`, `server/api/users`, `/installation`) : un master crée, renomme, promeut ou rétrograde les comptes et réinitialise les mots de passe (tous les masters ont les mêmes droits, au moins un master reste toujours), pas d'inscription ni d'email. scrypt (`node:crypto`), cookie de session `httpOnly` (90 jours glissants, seul le hachage du jeton est stocké), CSRF par `server/middleware/csrf.ts` (même origine + JSON). Schéma Neon par migrations numérotées (`server/utils/database.ts`, ne jamais modifier une migration publiée). Premier master protégé par `SETUP_CODE` (variable Vercel, ne jamais la lire). Composable `useAuth`
- Synchronisation (`server/api/sync`, `server/utils/syncRules.ts`, `syncStore.ts`) : fiche, état de jeu et sac datés séparément, la dernière modification gagne partie par partie (date de l'appareil, futur > 1 min ramené à l'heure du serveur). Lecture pour tout compte connecté, écriture : propriétaire ou master ; un joueur ne crée que des fiches UUID (slugs réservés aux masters) ; portraits JPEG/PNG/WebP vérifiés par leurs octets, jamais de SVG servi par le site ; plafonds de taille dans `syncRules.ts` ; compte supprimé → fiches au groupe (`owner_id` NULL, masters). Une fiche reçue passe par `parseCharacterFile`. Validateurs purs de l'état et du sac dans `app/utils/characterParts.ts` (importables par le serveur, contrairement aux composables)
- Synchronisation côté app : connexion obligatoire (`app/middleware/auth.global.ts`, compte gardé dans IndexedDB `meta.session`). Toute écriture de `characterRepository` note la partie dans le store `outbox` (même transaction) ; les données reçues passent par `syncRepository` (jamais d'outbox). Moteur `useSync` (`runSync` testable avec un `fetch` injecté et `tests/helpers/fakeSyncServer.ts`). Droits côté interface : `useOwnership().canEdit(id)` (même règle que le serveur), zone de jeu dans `<CodexLock>`. États partagés persistés par clé (`persistState({ key })`), valeurs du serveur appliquées par `applyExternal`. Le plugin `auth` dépend du plugin `db` (fiches de départ importées avant la première synchronisation)
- Tests e2e : chaque test a son groupe isolé sur le serveur de dev (en-tête `x-e2e-tenant`, `server/utils/e2eTenant.ts`, ignoré hors `pnpm dev` + `NUXT_E2E`) et démarre connecté en master (`tests/e2e/fixtures.ts` : importer `test` de `./fixtures`, `newDevice()` pour un autre téléphone, `api()` pour un autre client)
- Types partagés dans `shared/types/character.ts`, `account.ts` et `sync.ts`
- État interactif : composable `useCharacterState` (HP, slots, repos, jets de mort), store IndexedDB `states`
- Sac (équipement, argent, notes) : composable `useInventory`, store IndexedDB `inventories`. Seul sac : le sac de départ des seeds y est copié au premier lancement
- Persistance des états partagés : `persistState()` (écriture à chaque changement) ; toujours passer par `toPlain()` avant d'écrire un objet réactif dans IndexedDB
- Tests : Vitest (unit ; requêtes SQL des stores Neon exécutées sur PGlite, `tests/helpers/pgliteSql.ts`) + Playwright (e2e, `pnpm dev`) + Playwright PWA (`pnpm test:e2e:pwa`, build de production node-server : le service worker n'existe pas en dev)
- PWA : `@vite-pwa/nuxt` (config `pwa` dans `nuxt.config.ts`), `registerType: 'prompt'`. Précache : JS, CSS, HTML, polices woff2, SVG, textures de brouillard — pas les portraits (copiés dans IndexedDB) ni les icônes. Icônes générées depuis `public/img/icon-512.png`
- Éditeur de fiche : pages `personnages/nouveau.vue` et `personnages/[id]/modifier.vue`, composants `app/components/edit/`, brouillon `useCharacterDraft`, validation structurelle seulement (`validateCharacter`) — aucune borne de règle D&D avant la phase 2. Les noms servant de clé d'affichage (aptitudes, avantages, attaques, rites, sorts, compétences, langues) doivent être non vides et uniques. Le sac ne s'édite que dans l'onglet Sac de la fiche
- **Normes smartphone** (vérifiées par `tests/e2e/mobile-standards.spec.ts` à 360 px, ajouter chaque nouvel écran à la liste) : aucun défilement horizontal, cibles ≥ 44×44 px, texte ≥ 12 px (interactif et libellés ≥ 14 px), champs ≥ 16 px, contraste ≥ 7:1 (≥ 4,5:1 grands textes). Texte rouge-orangé : `text-ember-light` (jamais `text-ember`/`text-ember-bright`, < 7:1). Pas de couleur de texte transparente (`text-gold/60`…). Champs en grille : colonnes `minmax(0,1fr)`, `fieldset { min-width: 0 }`
- Portrait : photo de la galerie ou de l'appareil (`<input type="file" accept="image/*">` sans `capture`), réduite par `resizePortrait` (`app/utils/image.ts`) : côté long 1024 px, JPEG qualité 0,85, source refusée au-delà de 25 Mo (limites validées par Steve)
- Export/import : format `codex-dnd/character` (`app/utils/characterFile.ts`), lecture stricte (`hasCharacterShape` + `migrateDocument` + `validateCharacter`) : un fichier importé est une donnée non fiable. Toute évolution du modèle doit rester importable (migration). Écriture fiche + état + sac par `replaceCharacterData` (transaction unique). Partage en `.codex.txt` / `text/plain` (Chrome Android refuse le `.json`), export en `.codex.json`, import des deux (`CHARACTER_FILE_KINDS`, `CHARACTER_FILE_ACCEPT`)
- Boutons à appui long (`@pointerdown`) : toujours ajouter un `@click` filtré sur `event.detail === 0` pour le clavier et les lecteurs d'écran
- Confirmations : `useConfirm()` / `choose()` (troisième choix `extraLabel`) + `<ConfirmDialog>` (jamais `confirm()` natif)
- Sorts à emplacement : affichés par niveau du sort ; « Lancer » consomme le plus petit emplacement libre de niveau ≥ au sort (`slotIndexForSpell`, lancement à niveau supérieur et magie de pacte, validé par Steve)
- CA, initiative et vitesse : toujours via `findVital()` / `VITAL_LABELS` (`app/utils/vitals.ts`), jamais en comparant un libellé en dur
- Composants auto-importés : Nuxt préfixe par le dossier (`edit/EditForm.vue` → `EditForm`, `codex/CodexActions.vue` → `CodexActions`). Nommer les fichiers avec ce préfixe
- Textes de l'interface : catalogue `app/i18n/fr.ts` + `t()` / `tCount()` (`app/composables/useT.ts`), jamais de texte en dur dans un composant

## Personnages (6)
Steve (Dareth Brumeval), Normand (Skamos Aurum), Myriam (Zanna), Sandra (Maera Vifbois), Juan (Thunon), Jérôme (Kael Draven).

## Modèle de données

### Character, StoredCharacter, CharacterSeed
- `Character` : `id` (slug pour les fiches de départ, UUID pour les fiches créées) et `portrait: { data: ArrayBuffer, mime, alt }` (octets bruts, pas de Blob : clonables partout et testables).
- `StoredCharacter` = `Character` + `schemaVersion`, `origin` (`builtin` | `user` | `import`), `createdAt`, `updatedAt`.
- `CharacterSeed` : forme des fichiers `app/data/characters/*.ts`, avec `slug` et `portrait: { src, alt }`.
- Toute évolution du modèle : incrémenter `CHARACTER_SCHEMA_VERSION` et ajouter une migration dans `app/db/migrations.ts`.

Champs obligatoires : `id`, `player`, `firstName`, `eyebrow`, `race`, `className`, `level`, `background`, `alignment`, `proficiencyBonus`, `maxHp`, `hitDice`, `portrait`, `vitals`, `abilities`, `skills`, `features`, `personality`, `attacks`, `languages`, `rituals`, `colophon`.
Optionnels : `lastName`, `spellcasting`, `darkvision`, `ritualsNote` (rappel affiché sous les rites). `inventory` (sac de départ : `equipment`, `coins`, `notes`) n'existe que sur `CharacterSeed`.

### Spellcasting (nouveau modèle multi-niveaux)
```typescript
interface Spellcasting {
  saveDc: number
  attackBonus?: number
  slotLevels: SpellSlotLevel[]  // { level, slots } par niveau
  spells: Spell[]               // title, description, level, cost
                                // + optionnels : castingTime, range, duration, concentration, check, effect
  shortRestRefresh?: boolean    // occultiste
}
type SpellCost = 'cantrip' | 'slot' | 'daily'
```

## Conventions

### Création d'un nouveau personnage
1. Créer `app/data/characters/{slug}.ts` en suivant le type `CharacterSeed` (`shared/types/character.ts`).
2. Renseigner le champ `player` avec le prénom du joueur.
3. Enregistrer le personnage dans le tableau `seeds` de `app/data/characters/index.ts`.
4. **Générer le portrait** en utilisant le prompt template de `prompts/character-portrait.md`. Adapter uniquement la section `[PERSONNALISATION]` au nouveau personnage. Convertir en JPEG qualité 85 et sauvegarder dans `public/img/{slug}.jpg`.
   - Méthode privilégiée : skill `/nano-banana`.
   - Fallback : API Gemini directe avec le modèle `gemini-2.5-flash-image` (responseModalities `["TEXT", "IMAGE"]`).
5. Vérifier que les types compilent (`pnpm typecheck`, jamais `vue-tsc --noEmit` qui ne vérifie rien : la config racine ne fait que référencer `.nuxt/tsconfig.*`).
6. Lancer les tests : `pnpm test && pnpm test:e2e`.

### Style des portraits
Tous les portraits doivent respecter le même style visuel (peinture à l'huile dark fantasy). Le prompt de base est dans `prompts/character-portrait.md` — ne jamais modifier la partie commune, uniquement la personnalisation.

### Brouillard animé
Effet CSS multi-couches sur le hero mobile (`CodexHero.vue`) et les cartes d'accueil (`CodexCharacterCard.vue`). Textures `public/img/fog1.png` et `fog2.png` (PNG avec canal alpha, source : [CSS_FOG_ANIMATION](https://github.com/danielstuart14/CSS_FOG_ANIMATION)). 6 layers (3 paires avec doublons pour boucle sans couture), `scale: 1.2` pour masquer les bords, opacités basses à durées non-multiples. Dissipation via `opacity/filter` transition. Sur les cartes d'accueil, l'animation démarre via `IntersectionObserver` au scroll (statique avant).
