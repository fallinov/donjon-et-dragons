import type { Character } from '~~/shared/types/character'

export const darethBrumeval: Character = {
  slug: 'dareth-brumeval',
  player: 'Steve',
  firstName: 'Dareth',
  lastName: 'Brumeval',
  eyebrow: 'Codex du Chasseur',
  race: 'Demi-elfe',
  className: 'Rôdeur',
  level: 5,
  background: 'Sauvageon',
  alignment: 'Chaotique neutre',

  proficiencyBonus: 3,
  maxHp: 41,
  hitDice: { die: 10, total: 5 },

  portrait: {
    src: '/img/dareth-brumeval.png',
    alt: 'Portrait peint de Dareth Brumeval, demi-elfe rôdeur encapuchonné, arc dans le dos, dans une forêt brumeuse',
  },

  vitals: [
    { label: 'Points de vie', value: '41', unit: '/ 41' },
    { label: "Classe d'armure", value: '15' },
    { label: 'Initiative', value: '+4' },
    { label: 'Vitesse', value: '9', unit: 'm' },
  ],

  abilities: {
    strength:     { label: 'Force',        score: 10, modifier:  0, saveModifier: 0, proficient: false },
    dexterity:    { label: 'Dextérité',    score: 18, modifier: +4, saveModifier: 7, proficient: true  },
    constitution: { label: 'Constitution', score: 14, modifier: +2, saveModifier: 2, proficient: false },
    intelligence: { label: 'Intelligence', score: 13, modifier: +1, saveModifier: 1, proficient: false },
    wisdom:       { label: 'Sagesse',      score: 15, modifier: +2, saveModifier: 5, proficient: true  },
    charisma:     { label: 'Charisme',     score: 12, modifier: +1, saveModifier: 1, proficient: false },
  },

  skills: [
    { name: 'Discrétion',    ability: 'Dex', modifier: 7, proficient: true  },
    { name: 'Perception',    ability: 'Sag', modifier: 5, proficient: true  },
    { name: 'Survie',        ability: 'Sag', modifier: 5, proficient: true  },
    { name: 'Nature',        ability: 'Int', modifier: 4, proficient: true  },
    { name: 'Athlétisme',    ability: 'For', modifier: 2, proficient: false },
    { name: 'Investigation', ability: 'Int', modifier: 1, proficient: false },
    { name: 'Dressage',      ability: 'Sag', modifier: 2, proficient: false },
    { name: 'Acrobaties',    ability: 'Dex', modifier: 4, proficient: false },
  ],

  features: [
    {
      title: 'Ennemi juré · Dragons',
      description: 'Avantage pour pister, connaître et démasquer les dragons. Draconique parlé comme langue maternelle.',
    },
    {
      title: 'Explorateur né',
      description: "Les terres sauvages ne l'égarent jamais ; il trouve pitance et chemin là où d'autres périssent.",
    },
    {
      title: 'Combat à deux armes',
      description: 'Ajoute son modificateur de Dextérité aux dégâts de la seconde attaque.',
    },
    {
      title: 'Tueur de colosses',
      description: 'Une fois par tour, +1d8 dégâts contre une proie déjà ensanglantée.',
    },
    {
      title: 'Attaque supplémentaire',
      description: "Lorsqu'il utilise l'action Attaquer, il porte deux attaques au lieu d'une.",
    },
  ],

  personality: {
    trait: 'La forêt est sa seule cathédrale.',
    ideal: 'Nul seigneur, nul dieu, nulle chaîne.',
    idealLabel: 'Liberté',
    bond: "Un dragon a réduit son village en cendres. Il n'oublie pas.",
    flaw: 'Méfie-toi de quiconque porte un titre.',
  },

  attacks: [
    { name: 'Arc long',    note: '45 m / 180 m',    attackBonus: '1d20+7', damage: '1d8+4', damageType: 'perf.'   },
    { name: 'Arc court',   note: '24 m / 96 m',     attackBonus: '1d20+7', damage: '1d6+4', damageType: 'perf.'   },
    { name: 'Cimeterre',   note: 'légère, finesse', attackBonus: '1d20+7', damage: '1d6+4', damageType: 'tranch.' },
    { name: 'Épée courte', note: 'légère, finesse', attackBonus: '1d20+7', damage: '1d6+4', damageType: 'perf.'   },
  ],

  spellcasting: {
    saveDc: 13,
    slotLevels: [{ level: 1, slots: 4 }, { level: 2, slots: 2 }],
    spells: [
      { title: 'Marque du chasseur', description: 'Action bonus, concentration. +1d6 sur chaque coup porté à la proie marquée.', level: 1, cost: 'slot' },
      { title: 'Soins',              description: 'Action, contact. Rend 1d8+2 points de souffle.', level: 1, cost: 'slot' },
      { title: 'Passage sans trace', description: "Action, concentration, 1 heure. Les alliés à 9 m gagnent +10 en Discrétion et ne laissent aucune trace.", level: 2, cost: 'slot' },
      { title: "Croissance d'épines", description: "Action, concentration, 10 minutes. Ronces sur 6 m de rayon : terrain difficile, 2d4 perçants par tranche de 1,5 m parcourue.", level: 2, cost: 'slot' },
    ],
  },

  darkvision: 18,

  languages: [
    { name: 'Commun' },
    { name: 'Elfique' },
    { name: 'Gobelin' },
    { name: 'Sylvestre' },
    { name: 'Draconique', rare: true },
  ],

  rituals: [
    {
      number: 'Rite I',
      title: "L'ouverture silencieuse",
      steps: [
        { text: 'Action bonus · ', emphasis: 'Marque du chasseur' },
        { text: "Action Attaquer · deux tirs à l'arc long" },
      ],
      formulas: ['1d20 + 7 ⟶ 1d8 + 4 + 1d6', '1d20 + 7 ⟶ 1d8 + 4 + 1d6'],
    },
    {
      number: 'Rite II',
      title: 'La proie ensanglantée',
      steps: [
        { text: "Cible déjà blessée · deux tirs à l'arc long" },
      ],
      formulas: ['1d20 + 7 ⟶ 1d8 + 4 + 1d6 + 1d8', '1d20 + 7 ⟶ 1d8 + 4 + 1d6'],
      footnote: "Le 1d8 de tueur de colosses ne s'ajoute qu'à un seul tir par tour.",
    },
    {
      number: 'Rite III',
      title: 'La danse des deux armes',
      steps: [
        { text: 'Action Attaquer · deux coups de cimeterre' },
        { text: 'Action bonus · épée courte' },
      ],
      formulas: ['1d20 + 7 ⟶ 1d6 + 4 (+1d6*)', '1d20 + 7 ⟶ 1d6 + 4 (+1d6*)', '1d20 + 7 ⟶ 1d6 + 4 (+1d6*)'],
      footnote: '*si la proie est marquée',
    },
  ],

  colophon: "Consigné sur vélin d'ombre — Codex du chasseur Brumeval. Que nul dragon ne dorme tranquille tant que ses flèches auront des plumes.",
}
