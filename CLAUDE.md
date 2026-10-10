# Donjon & Dragons — Codex numérique

## Stack
- Nuxt 4 + Vue 3 + TypeScript strict + Tailwind CSS v4
- Fiches stockées sur l'appareil dans IndexedDB (`app/db/`, lib `idb`), rendu client uniquement (`ssr: false`)
- Fiches de départ (seeds) en fichiers TypeScript typés (`app/data/characters/`), importées au premier lancement par `app/plugins/db.client.ts`. Une fiche supprimée ne revient pas
- Types partagés dans `shared/types/character.ts`
- État interactif : composable `useCharacterState` (HP, slots, repos, jets de mort), store IndexedDB `states`
- Sac (équipement, argent, notes) : composable `useInventory`, store IndexedDB `inventories`. Seul sac : le sac de départ des seeds y est copié au premier lancement
- Persistance des états partagés : `persistState()` (écriture à chaque changement) ; toujours passer par `toPlain()` avant d'écrire un objet réactif dans IndexedDB
- Tests : Vitest (unit) + Playwright (e2e)
- Éditeur de fiche : pages `personnages/nouveau.vue` et `personnages/[id]/modifier.vue`, composants `app/components/edit/`, brouillon `useCharacterDraft`, validation structurelle seulement (`validateCharacter`) — aucune borne de règle D&D avant la phase 2
- Confirmations : `useConfirm()` + `<ConfirmDialog>` (jamais `confirm()` natif)
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
5. Vérifier que les types compilent (`vue-tsc --noEmit`).
6. Lancer les tests : `pnpm test && pnpm test:e2e`.

### Style des portraits
Tous les portraits doivent respecter le même style visuel (peinture à l'huile dark fantasy). Le prompt de base est dans `prompts/character-portrait.md` — ne jamais modifier la partie commune, uniquement la personnalisation.

### Brouillard animé
Effet CSS multi-couches sur le hero mobile (`CodexHero.vue`) et les cartes d'accueil (`CodexCharacterCard.vue`). Textures `public/img/fog1.png` et `fog2.png` (PNG avec canal alpha, source : [CSS_FOG_ANIMATION](https://github.com/danielstuart14/CSS_FOG_ANIMATION)). 6 layers (3 paires avec doublons pour boucle sans couture), `scale: 1.2` pour masquer les bords, opacités basses à durées non-multiples. Dissipation via `opacity/filter` transition. Sur les cartes d'accueil, l'animation démarre via `IntersectionObserver` au scroll (statique avant).
