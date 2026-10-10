/**
 * Textes de l'interface (français). Clés plates « zone.element », interpolation `{nom}`.
 * Pluriels : paires `cle.one` / `cle.other`, lues via `tCount`.
 */
export const fr = {
  // Commun
  'common.skipLink': 'Aller au contenu',
  'common.back': 'Retour aux codex',
  'common.breadcrumb': "Fil d'Ariane",
  'common.print': 'Imprimer',
  'common.printLabel': 'Imprimer la fiche',
  'common.mastery': 'Maîtrise',
  'common.masteryShort': 'M',
  'common.meters': 'm',
  'common.countWord.1': 'une',
  'common.countWord.2': 'deux',
  'common.countWord.3': 'trois',
  'common.countWord.4': 'quatre',
  'common.countWord.5': 'cinq',
  'common.countWord.6': 'six',

  // Accueil
  'home.seo.title': 'Donjon et Dragons — Codex des personnages',
  'home.seo.description': 'Bibliothèque de personnages D&D 5e en codex médiévaux.',
  'home.eyebrow': 'Bibliothèque de codex',
  'home.title': 'Donjon & Dragons',
  'home.count.one': '{count} personnage consigné',
  'home.count.other': '{count} personnages consignés',
  'home.loadError': 'Impossible de lire les fiches enregistrées sur cet appareil.',

  // Fiche
  'character.notFound': 'Personnage introuvable',
  'character.loadError': 'Impossible de lire cette fiche sur cet appareil.',
  'character.seo.title': 'Codex — {name}',
  'character.seo.description': 'Fiche de personnage D&D 5e : {name}, {race} {className} niveau {level}.',
  'character.levelShort': '{className} niv. {level}',
  'character.levelLong': '{className} niveau {level}',
  'character.section.features': 'Capacités et traits',
  'character.section.languages': 'Langues',
  'character.section.senses': 'Sens passifs',
  'character.section.personality': 'Personnalité',
  'character.section.attacks': 'Attaques et incantations',
  'character.section.spells': 'Sorts',
  'character.section.bag': 'Sac',
  'character.section.skills': 'Compétences',
  'character.noSpells': 'Aucun sort connu.',

  // Sens
  'senses.title': 'Sens',
  'senses.perception': 'Perception',
  'senses.investigation': 'Investigation',
  'senses.darkvision': 'Vision nocturne',

  // En-tête (vitals)
  'hero.armor': 'Armure',
  'hero.initiative': 'Init.',
  'hero.mastery': 'Maîtr.',
  'hero.speed': 'Vitesse',
  'miniHeader.armor': 'CA',
  'miniHeader.initiative': 'Init',
  'miniHeader.mastery': 'Maîtr',

  // Caractéristiques
  'abilities.title': 'Caractéristiques',
  'abilities.save': 'sauv · {value}',

  // Attaques
  'attacks.caption': "Armes équipées avec bonus d'attaque et dégâts",
  'attacks.weapon': 'Arme',
  'attacks.bonus': "Bonus d'att.",
  'attacks.damage': 'Dégâts',

  // Personnalité
  'personality.trait': 'Trait de personnalité',
  'personality.ideal': 'Idéal',
  'personality.bond': 'Lien',
  'personality.flaw': 'Défaut',

  // Rites
  'rituals.title': 'Rites de combat',
  'rituals.subtitle.one': '— {word} séquence à graver dans la mémoire du bras —',
  'rituals.subtitle.other': '— {word} séquences à graver dans la mémoire du bras —',
  'rituals.noteLabel': 'Attention',

  // Sorts
  'spells.saveDc': 'Difficulté de sauvegarde',
  'spells.attackBonus': '+{value} att.',
  'spells.slotLevel': 'Niv. {level}',
  'spells.slotsGroup': 'Emplacements niveau {level}',
  'spells.cantrips': 'Sorts mineurs',
  'spells.levelTitle': 'Sorts de niveau {level}',
  'spells.special': 'Sorts spéciaux',
  'spells.cast': 'Lancer',
  'spells.used': 'Utilisé',
  'spells.cost.cantrip': 'Sort mineur',
  'spells.cost.daily': '1 / repos long',
  'spells.cost.slot': 'Niveau {level}',
  'spells.concentration': 'Concentration',
  'spells.longRestConfirm': 'Repos long : restaure emplacements et sorts quotidiens. Confirmer ?',

  // Repos
  'rest.short': 'Repos court',
  'rest.long': 'Repos long',
  'rest.title': 'Repos',
  'rest.shortCompact': 'Court',
  'rest.longCompact': 'Long',
  'rest.shortDone': 'Repos court effectué',
  'rest.longDone': 'Repos long effectué — HP restaurés à {hp}',
  'rest.longConfirm': 'Repos long : restaure HP, emplacements et dés de vie. Confirmer ?',

  // Tableau de bord
  'status.label': 'Tableau de bord du personnage',
  'status.hp': 'Points de vie',
  'status.hpTemp': '+{value} temp',
  'status.hpProgress': '{current} sur {max} points de vie',
  'status.inspiration': 'Inspiration',
  'status.hitDice': 'Dés de vie',
  'status.combat': 'Combat',
  'status.deathSaves': '⚠ Sauvegardes contre la mort',
  'status.successes': 'Succès',
  'status.failures': 'Échecs',
  'status.successesGroup': 'Succès contre la mort',
  'status.failuresGroup': 'Échecs contre la mort',
  'status.success': 'Succès {index}',
  'status.failure': 'Échec {index}',

  // Compteur
  'counter.decrease': 'Diminuer {label}',
  'counter.increase': 'Augmenter {label}',

  // Sac
  'inventory.coins': 'Argent',
  'inventory.coin.cp.short': 'PC',
  'inventory.coin.cp.long': 'Pièces de cuivre',
  'inventory.coin.sp.short': 'PA',
  'inventory.coin.sp.long': "Pièces d'argent",
  'inventory.coin.ep.short': 'PE',
  'inventory.coin.ep.long': "Pièces d'électrum",
  'inventory.coin.gp.short': 'PO',
  'inventory.coin.gp.long': "Pièces d'or",
  'inventory.coin.pp.short': 'PP',
  'inventory.coin.pp.long': 'Pièces de platine',
  'inventory.equipment': 'Équipement',
  'inventory.empty': 'Le sac est vide.',
  'inventory.quantityOf': 'Quantité de {name}',
  'inventory.decrease': 'Diminuer la quantité : {name}',
  'inventory.increase': 'Augmenter la quantité : {name}',
  'inventory.remove': 'Supprimer {name} du sac',
  'inventory.itemName': "Nom de l'objet",
  'inventory.itemPlaceholder': 'Nouvel objet',
  'inventory.quantity': 'Quantité',
  'inventory.add': 'Ajouter',
  'inventory.notes': 'Notes',
  'inventory.notesPlaceholder': 'Quêtes, PNJ, indices…',
  'inventory.localOnly': 'Enregistré sur cet appareil uniquement.',

  // Navigation mobile
  'tabs.nav': 'Navigation mobile',
  'tabs.profil': 'Profil',
  'tabs.combat': 'Combat',
  'tabs.sorts': 'Sorts',
  'tabs.sac': 'Sac',
  'tabs.stats': 'Stats',
} as const

export type MessageKey = keyof typeof fr
