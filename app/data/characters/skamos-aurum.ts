import type { Character } from '~~/shared/types/character'

export const skamosAurum: Character = {
  slug: 'skamos-aurum',
  firstName: 'Skamos',
  lastName: 'Aurum',
  eyebrow: "Codex de l'ensorceleur",
  race: 'Tieffelin',
  className: 'Ensorceleur',
  level: 4,
  background: 'Sauvageon',
  alignment: 'Loyal bon',

  proficiencyBonus: 2,
  maxHp: 33,
  hitDice: { die: 6, total: 4 },

  portrait: {
    src: '/img/skamos-aurum.png',
    alt: "Portrait peint de Skamos Aurum, tieffelin ensorceleur à la peau rouge, cornes sombres courbées vers l'arrière, yeux dorés luminescents, cape à capuche",
  },

  vitals: [
    { label: 'Points de vie', value: '33', unit: '/ 33' },
    { label: "Classe d'armure", value: '15' },
    { label: 'Initiative', value: '+2' },
    { label: 'Vitesse', value: '9', unit: 'm' },
  ],

  abilities: {
    strength:     { label: 'Force',        score:  8, modifier: -1, saveModifier: -1, proficient: false },
    dexterity:    { label: 'Dextérité',    score: 14, modifier: +2, saveModifier:  2, proficient: false },
    constitution: { label: 'Constitution', score: 14, modifier: +2, saveModifier:  4, proficient: true  },
    intelligence: { label: 'Intelligence', score:  9, modifier: -1, saveModifier: -1, proficient: false },
    wisdom:       { label: 'Sagesse',      score: 11, modifier:  0, saveModifier:  0, proficient: false },
    charisma:     { label: 'Charisme',     score: 15, modifier: +3, saveModifier:  5, proficient: true  },
  },

  skills: [
    { name: 'Persuasion',   ability: 'Cha', modifier: 5, proficient: true  },
    { name: 'Intimidation', ability: 'Cha', modifier: 5, proficient: true  },
    { name: 'Survie',       ability: 'Sag', modifier: 2, proficient: true  },
    { name: 'Athlétisme',   ability: 'For', modifier: 1, proficient: true  },
    { name: 'Arcanes',      ability: 'Int', modifier: 0, proficient: false },
    { name: 'Discrétion',   ability: 'Dex', modifier: 2, proficient: false },
    { name: 'Perception',   ability: 'Sag', modifier: 0, proficient: false },
    { name: 'Nature',       ability: 'Int', modifier: 0, proficient: false },
  ],

  features: [
    {
      title: "Ascendance draconique · Dragon d'or",
      description: "Lit et écrit le draconique. Maîtrise doublée dans les interactions avec les dragons. Résistance au feu. +1 pv max par niveau. Affinité au feu dans ses sorts élémentaires.",
    },
    {
      title: 'Résistance infernale',
      description: 'Résistance aux dégâts de feu, héritage de sa lignée tieffelin.',
    },
    {
      title: 'Vision dans le noir',
      description: 'Voit dans la pénombre jusqu’à 18 mètres comme en pleine lumière, et dans le noir complet en nuances de gris.',
    },
    {
      title: 'Points de sorcellerie (3)',
      description: 'Réserve magique convertible en emplacements de sort, ou utilisable pour la métamagie.',
    },
    {
      title: 'Métamagie — Sort accéléré / Sort jumeau',
      description: 'Peut lancer un sort en action bonus (accéléré) ou cibler deux créatures avec un sort mono-cible (jumeau) contre des points de sorcellerie.',
    },
    {
      title: 'Mémoire des terres',
      description: 'Mémoire cartographique exceptionnelle : retient la configuration des terrains et agglomérations. Trouve nourriture et eau fraîche pour lui et ses compagnons.',
    },
  ],

  personality: {
    trait: "Je n'accorde aucune importance à l'argent ni aux gens pleins de bonnes manières. Ce n'est pas ça qui sauve d'un hibours.",
    ideal: 'Le monde naturel est plus important que les constructions de la civilisation.',
    idealLabel: 'Nature',
    bond: 'Ami de Goudred Trocroch, venu en aide quand j’étais seul et exilé.',
    flaw: 'Difficulté à maîtriser mes émotions — quand la colère monte face à l’injustice, mes yeux luisent et ma magie draconique déferle, incontrôlée.',
  },

  attacks: [
    { name: 'Arbalète légère', note: '24 m / 96 m',          attackBonus: '1d20+4', damage: '1d8+2', damageType: 'perf.'   },
    { name: 'Bâton',           note: 'polyvalente',          attackBonus: '1d20+1', damage: '1d6-1', damageType: 'cont.'   },
    { name: 'Dague',           note: '6 m / 18 m, finesse',  attackBonus: '1d20+4', damage: '1d4+2', damageType: 'perf.'   },
    { name: 'Trait de feu',    note: 'sort mineur, 36 m',    attackBonus: '1d20+5', damage: '1d10',  damageType: 'feu'     },
  ],

  spellcasting: {
    level: 1,
    slots: 3,
    saveDc: 13,
    spells: [
      { title: 'Bouclier', description: 'Réaction, 1 round. +5 CA jusqu’au début de votre prochain tour, annule projectile magique.' },
      { title: 'Projectiles magiques', description: 'Action, 3 projectiles autoguidés infligeant 1d4+1 dégâts de force chacun.' },
      { title: 'Suggestion (niveau 2)', description: "Action, concentration jusqu'à 8 h. Suggère un acte raisonnable à une créature qui rate son jet de Sagesse." },
      { title: 'Pas brumeux (niveau 2)', description: 'Action bonus, téléportation de 9 m dans une brume argentée.' },
      { title: 'Représailles infernales', description: 'Réaction tieffelin (1/repos long). Quand on vous blesse, infligez 2d10 feu à l’attaquant.' },
    ],
  },

  darkvision: 18,

  languages: [
    { name: 'Commun' },
    { name: 'Infernal' },
    { name: 'Draconique', rare: true },
  ],

  rituals: [
    {
      number: 'Rite I',
      title: 'Le trait fulgurant',
      steps: [
        { text: 'Action bonus · ', emphasis: 'Sort accéléré (1 pt sorcellerie)' },
        { text: 'Action · Projectiles magiques (niveau 1)' },
      ],
      formulas: ['3 × (1d4 + 1) force autoguidés'],
      footnote: 'Métamagie : lance deux sorts dans le tour (un accéléré + un standard).',
    },
    {
      number: 'Rite II',
      title: "L'échappée brumeuse",
      steps: [
        { text: "Réaction · Bouclier (+5 CA jusqu'au prochain tour)" },
        { text: 'Action bonus · Pas brumeux (téléport 9 m)' },
      ],
      formulas: ['CA 20 · déplacement brumeux'],
      footnote: 'Rompt un encerclement ou évite une attaque mortelle.',
    },
    {
      number: 'Rite III',
      title: 'La colère du dragon d’or',
      steps: [
        { text: 'Réaction · ', emphasis: 'Représailles infernales' },
        { text: 'Action · Trait de feu' },
      ],
      formulas: ['2d10 feu (réaction)', '1d10 feu (sort mineur, +1 affinité)'],
      footnote: 'Une fois par repos long. Yeux luisants garantis.',
    },
  ],

  colophon: 'Consigné sur cuir fumé — Codex de Skamos Aurum. Ni chaînes ni cours, la flamme et le chemin.',
}
