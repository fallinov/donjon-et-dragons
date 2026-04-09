# Donjon & Dragons — Codex numérique

## Stack
- Nuxt 4 + Vue 3 + TypeScript strict + Tailwind CSS v4
- Données des personnages en fichiers TypeScript typés (`app/data/characters/`)
- Types partagés dans `shared/types/character.ts`
- État interactif : composable `useCharacterState` (HP, slots, repos, jets de mort)
- Tests : Vitest (unit) + Playwright (e2e)

## Personnages (6)
Steve (Dareth Brumeval), Normand (Skamos Aurum), Myriam (Zanna), Sandra (Maera Vifbois), Juan (Thunon), Jérôme (Kael Draven).

## Modèle de données

### Character
Champs obligatoires : `slug`, `player`, `firstName`, `eyebrow`, `race`, `className`, `level`, `background`, `alignment`, `proficiencyBonus`, `maxHp`, `hitDice`, `portrait`, `vitals`, `abilities`, `skills`, `features`, `personality`, `attacks`, `languages`, `rituals`, `colophon`.
Optionnels : `lastName`, `spellcasting`, `darkvision`.

### Spellcasting (nouveau modèle multi-niveaux)
```typescript
interface Spellcasting {
  saveDc: number
  attackBonus?: number
  slotLevels: SpellSlotLevel[]  // { level, slots } par niveau
  spells: Spell[]               // title, description, level, cost
  shortRestRefresh?: boolean    // occultiste
}
type SpellCost = 'cantrip' | 'slot' | 'daily'
```

## Conventions

### Création d'un nouveau personnage
1. Créer `app/data/characters/{slug}.ts` en suivant le type `Character` (`shared/types/character.ts`).
2. Renseigner le champ `player` avec le prénom du joueur.
3. Enregistrer le personnage dans `app/data/characters/index.ts`.
4. **Générer le portrait** en utilisant le prompt template de `prompts/character-portrait.md`. Adapter uniquement la section `[PERSONNALISATION]` au nouveau personnage. Sauvegarder dans `public/img/{slug}.png`.
   - Méthode privilégiée : skill `/nano-banana`.
   - Fallback : API Gemini directe avec le modèle `gemini-2.5-flash-image` (responseModalities `["TEXT", "IMAGE"]`).
5. Vérifier que les types compilent (`vue-tsc --noEmit`).
6. Lancer les tests : `pnpm test && pnpm test:e2e`.

### Style des portraits
Tous les portraits doivent respecter le même style visuel (peinture à l'huile dark fantasy). Le prompt de base est dans `prompts/character-portrait.md` — ne jamais modifier la partie commune, uniquement la personnalisation.

### Brouillard animé
Effet CSS multi-couches sur le hero mobile (`CodexHero.vue`) et les cartes d'accueil (`CodexCharacterCard.vue`). Textures `public/img/fog1.png` et `fog2.png` (PNG avec canal alpha, source : [CSS_FOG_ANIMATION](https://github.com/danielstuart14/CSS_FOG_ANIMATION)). 6 layers (3 paires avec doublons pour boucle sans couture), `scale: 1.2` pour masquer les bords, opacités basses à durées non-multiples. Dissipation via `opacity/filter` transition. Sur les cartes d'accueil, l'animation démarre via `IntersectionObserver` au scroll (statique avant).
