# Prompt de base — Portrait de personnage D&D

Ce prompt est le template a customiser pour generer les portraits de personnages.
Modifier uniquement la section `[PERSONNALISATION]` pour chaque nouveau personnage.

## Prompt

```
Dark fantasy oil painting portrait. Waist-up or three-quarter view.
Rich warm tones, deep shadows, dramatic chiaroscuro lighting.
Visible painterly brushstrokes, highly detailed realistic rendering.
Medieval fantasy setting, muted earthy background (forest, stone, or dark gradient).
Intricate detail on armor, weapons, clothing, and accessories.
No text, no UI elements, no watermark.

[PERSONNALISATION]
Race: {race}
Class: {classe}
Key equipment: {armes et armure principales}
Physical traits: {traits physiques distinctifs}
Expression/mood: {expression du visage, attitude}
Background setting: {environnement adapte au personnage}
```

## Exemples de personnalisation

### Dareth Brumeval (Demi-elfe Rodeur)
```
Race: Half-elf, pointed ears, angular features
Class: Ranger, leather armor with metal studs, hooded dark cloak
Key equipment: longbow on back, quiver of arrows, short sword at hip
Physical traits: weathered face, sharp green eyes, dark hair under hood
Expression/mood: vigilant, stoic, ready for danger
Background setting: misty dark forest with moss-covered trees, ferns
```

### Skamos Aurum (Tieffelin Ensorceleur)
```
Race: Tiefling, red skin, curved horns, golden glowing eyes
Class: Sorcerer, dark robes under a crimson cloak with buckle clasp
Key equipment: arcane focus pendant, leather satchel, potion vials
Physical traits: sharp angular face, black hair, prominent veins on skin
Expression/mood: intense, calculating, guarded
Background setting: plain dark painterly gradient, warm brown tones
```

### Zanna (Gnome des forets Occultiste)
```
Race: Forest gnome, small stature, childlike proportions, round face
Class: Warlock, ornate embroidered green and burgundy robes
Key equipment: ancient tome held to chest, tiny dragon familiar on shoulder
Physical traits: curly brown hair with flowers and leaves, bright green eyes, freckles
Expression/mood: curious, warm, slightly mischievous
Background setting: enchanted forest, ferns, warm dappled light
```

## Contraintes techniques

- Format : PNG
- Dimensions : environ 600x800 ou ratio similaire (portrait vertical)
- Destination : `public/img/{slug}.png`
- Le nom du fichier doit correspondre au `slug` du personnage
