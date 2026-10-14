/** Version des règles appliquée à une fiche. Une seule pour l'instant. */
export type RulesetId = 'dnd5e-2014'

export type ClassId =
  | 'barbarian' | 'bard' | 'cleric' | 'druid' | 'fighter' | 'monk'
  | 'paladin' | 'ranger' | 'rogue' | 'sorcerer' | 'warlock' | 'wizard'

/** Race et sous-race PHB en un seul identifiant (la sous-race porte les différences de règles). */
export type RaceId =
  | 'hill-dwarf' | 'mountain-dwarf'
  | 'high-elf' | 'wood-elf' | 'drow'
  | 'lightfoot-halfling' | 'stout-halfling'
  | 'human' | 'dragonborn'
  | 'forest-gnome' | 'rock-gnome'
  | 'half-elf' | 'half-orc' | 'tiefling'

export type SkillKey =
  | 'acrobatics' | 'animalHandling' | 'arcana' | 'athletics' | 'deception' | 'history'
  | 'insight' | 'intimidation' | 'investigation' | 'medicine' | 'nature' | 'perception'
  | 'performance' | 'persuasion' | 'religion' | 'sleightOfHand' | 'stealth' | 'survival'

export type ArmorCategory = 'light' | 'medium' | 'heavy'

export type ArmorId =
  | 'padded' | 'leather' | 'studded-leather'
  | 'hide' | 'chain-shirt' | 'scale-mail' | 'breastplate' | 'half-plate'
  | 'ring-mail' | 'chain-mail' | 'splint' | 'plate'

/** Formule de CA sans armure : standard 10 + Dex, défense sans armure du barbare ou du moine, résilience draconique. */
export type UnarmoredFormula = 'standard' | 'barbarian' | 'monk' | 'draconic'

export type WeaponCategory = 'simple' | 'martial'

export type WeaponId =
  | 'club' | 'dagger' | 'greatclub' | 'handaxe' | 'javelin' | 'light-hammer' | 'mace'
  | 'quarterstaff' | 'sickle' | 'spear'
  | 'light-crossbow' | 'dart' | 'shortbow' | 'sling'
  | 'battleaxe' | 'flail' | 'glaive' | 'greataxe' | 'greatsword' | 'halberd' | 'lance'
  | 'longsword' | 'maul' | 'morningstar' | 'pike' | 'rapier' | 'scimitar' | 'shortsword'
  | 'trident' | 'war-pick' | 'warhammer' | 'whip'
  | 'blowgun' | 'hand-crossbow' | 'heavy-crossbow' | 'longbow' | 'net'

/** Progression des emplacements : complète, demi (paladin, rôdeur), magie de pacte, aucune. */
export type CasterProgression = 'full' | 'half' | 'pact' | 'none'
