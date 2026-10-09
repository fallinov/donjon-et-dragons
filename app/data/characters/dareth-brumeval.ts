import type { Character } from '~~/shared/types/character'

export const darethBrumeval: Character = {
  slug: 'dareth-brumeval',
  player: 'Steve',
  firstName: 'Dareth',
  lastName: 'Brumeval',
  eyebrow: 'Codex du Chasseur',
  race: 'Demi-elfe',
  className: 'Rôdeur',
  level: 6,
  background: 'Sauvageon',
  alignment: 'Chaotique neutre',

  proficiencyBonus: 3,
  maxHp: 49,
  hitDice: { die: 10, total: 6 },

  portrait: {
    src: '/img/dareth-brumeval.png',
    alt: 'Portrait peint de Dareth Brumeval, demi-elfe rôdeur encapuchonné, arc dans le dos, dans une forêt brumeuse',
  },

  vitals: [
    { label: 'Points de vie', value: '49', unit: '/ 49' },
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
      title: 'Ennemis jurés · Dragons, morts-vivants',
      description: 'Avantage pour pister, connaître et démasquer les dragons et les morts-vivants. Draconique parlé comme langue maternelle, Infernal appris.',
    },
    {
      title: 'Explorateur né · Forêt, Outreterre',
      description: "Sous les frondaisons comme dans les profondeurs, rien ne l'égare : maîtrise doublée en Intelligence et Sagesse liées au terrain, et le groupe n'est pas ralenti par le terrain difficile.",
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
      {
        title: 'Marque du chasseur',
        description: "+1d6 dégâts à chaque attaque d'arme qui touche la cible. Avantage en Perception et Survie pour la trouver. Si elle tombe à 0 PV, la marque passe à une autre cible par une action bonus.",
        level: 1,
        cost: 'slot',
        castingTime: 'Action bonus',
        range: '27 m',
        duration: '1 heure',
        concentration: true,
        effect: '+1d6 par coup',
      },
      {
        title: 'Soins',
        description: 'Rend des points de vie à une créature touchée. Sans effet sur les morts-vivants et les créatures artificielles.',
        level: 1,
        cost: 'slot',
        castingTime: 'Action',
        range: 'Contact',
        duration: 'Instantanée',
        effect: '1d8 + 2 PV',
      },
      {
        title: 'Passage sans trace',
        description: 'Dareth et ses alliés à 9 m gagnent +10 en Discrétion et ne laissent aucune trace. Seule la magie permet de les pister.',
        level: 2,
        cost: 'slot',
        castingTime: 'Action',
        range: 'Soi · rayon 9 m',
        duration: '1 heure',
        concentration: true,
        effect: '+10 Discrétion',
      },
      {
        title: "Croissance d'épines",
        description: "Le sol se couvre de ronces camouflées : terrain difficile. Une créature qui s'y déplace subit les dégâts pour chaque 1,5 m parcouru.",
        level: 2,
        cost: 'slot',
        castingTime: 'Action',
        range: '45 m · rayon 6 m',
        duration: '10 minutes',
        concentration: true,
        check: 'Perception DD 13 pour repérer la zone',
        effect: '2d4 perçants par 1,5 m',
      },
    ],
  },

  darkvision: 18,

  languages: [
    { name: 'Commun' },
    { name: 'Elfique' },
    { name: 'Gobelin' },
    { name: 'Sylvestre' },
    { name: 'Draconique', rare: true },
    { name: 'Infernal', rare: true },
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
    {
      number: 'Rite IV',
      title: 'Le champ de ronces',
      steps: [
        { text: 'Tour 1 · Action · ', emphasis: "Croissance d'épines" },
        { text: "Tours suivants · deux tirs à l'arc long" },
      ],
      formulas: ['Ronces · 2d4 perçants par 1,5 m parcouru', '1d20 + 7 ⟶ 1d8 + 4 (+1d8*)', '1d20 + 7 ⟶ 1d8 + 4'],
      footnote: '*tueur de colosses, une fois par tour. Pas de Marque du chasseur : la concentration tient les ronces.',
    },
    {
      number: 'Rite V',
      title: "L'approche invisible",
      steps: [
        { text: 'Avant le combat · ', emphasis: 'Passage sans trace' },
        { text: 'Le groupe approche sans bruit, puis Rite I ou II' },
      ],
      formulas: ['Discrétion · 1d20 + 17'],
      footnote: 'Lancer Marque du chasseur met fin à Passage sans trace.',
    },
  ],

  ritualsNote: "Marque du chasseur, Passage sans trace et Croissance d'épines demandent tous de la concentration. Dareth ne peut en maintenir qu'un seul à la fois.",

  colophon: "Consigné sur vélin d'ombre — Codex du chasseur Brumeval. Que nul dragon ne dorme tranquille tant que ses flèches auront des plumes.",
}
