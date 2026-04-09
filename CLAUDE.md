# Donjon & Dragons — Codex numérique

## Stack
- Nuxt 3 + Vue 3 + TypeScript
- Données des personnages en fichiers TypeScript typés (`app/data/characters/`)
- Types partagés dans `shared/types/`

## Conventions

### Création d'un nouveau personnage
1. Créer `app/data/characters/{slug}.ts` en suivant le type `Character` (`shared/types/character.ts`).
2. Enregistrer le personnage dans `app/data/characters/index.ts`.
3. **Générer le portrait** avec le skill `/nano-banana` en utilisant le prompt template de `prompts/character-portrait.md`. Adapter uniquement la section `[PERSONNALISATION]` au nouveau personnage. Sauvegarder dans `public/img/{slug}.png`.
4. Vérifier que les types compilent (`vue-tsc --noEmit`).

### Style des portraits
Tous les portraits doivent respecter le même style visuel (peinture a l'huile dark fantasy). Le prompt de base est dans `prompts/character-portrait.md` — ne jamais modifier la partie commune, uniquement la personnalisation.
