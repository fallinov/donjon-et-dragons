import type { Character } from '~~/shared/types/character'

export const viboisThaera: Character = {
  slug: 'vibois-thaera',
  firstName: 'Vibois',
  lastName: 'Thaera',
  eyebrow: 'Codex du Conquérant',
  race: 'Humain',
  className: 'Paladin',
  level: 4,
  background: 'Exilé',
  alignment: 'Loyal neutre',

  proficiencyBonus: 2,
  maxHp: 44,
  hitDice: { die: 10, total: 4 },

  portrait: {
    src: '/img/vibois-thaera.png',
    alt: 'Portrait de Vibois Thaera, paladin humain en cotte de maille, bouclier et marteau de guerre, regard déterminé',
  },

  vitals: [
    { label: 'Points de vie', value: '44', unit: '/ 44' },
    { label: "Classe d'armure", value: '18' },
    { label: 'Initiative', value: '+2' },
    { label: 'Vitesse', value: '9', unit: 'm' },
  ],

  abilities: {
    strength:     { label: 'Force',        score: 15, modifier: +2, saveModifier: 2, proficient: false },
    dexterity:    { label: 'Dextérité',    score: 14, modifier: +2, saveModifier: 2, proficient: false },
    constitution: { label: 'Constitution', score: 16, modifier: +3, saveModifier: 3, proficient: false },
    intelligence: { label: 'Intelligence', score: 12, modifier: +1, saveModifier: 1, proficient: false },
    wisdom:       { label: 'Sagesse',      score: 15, modifier: +2, saveModifier: 4, proficient: true  },
    charisma:     { label: 'Charisme',     score: 16, modifier: +3, saveModifier: 5, proficient: true  },
  },

  skills: [
    { name: 'Athlétisme',    ability: 'For', modifier: 4, proficient: true  },
    { name: 'Intimidation',  ability: 'Cha', modifier: 5, proficient: true  },
    { name: 'Médecine',      ability: 'Sag', modifier: 4, proficient: true  },
    { name: 'Perception',    ability: 'Sag', modifier: 4, proficient: true  },
    { name: 'Persuasion',    ability: 'Cha', modifier: 5, proficient: true  },
    { name: 'Religion',      ability: 'Int', modifier: 3, proficient: true  },
    { name: 'Perspicacité',  ability: 'Sag', modifier: 2, proficient: false },
    { name: 'Survie',        ability: 'Sag', modifier: 2, proficient: false },
  ],

  features: [
    {
      title: 'Sens divin',
      description: "3× par repos. Détecte la présence du mal (fiélons, morts-vivants, lieux consacrés/profanés) dans un rayon de 18 m.",
    },
    {
      title: 'Imposition des mains',
      description: 'Réserve de 20 PV (5 × niveau). Peut guérir des points de vie ou neutraliser une maladie/un poison (5 PV par effet).',
    },
    {
      title: 'Style de combat · Protection',
      description: "Réaction si une créature à 1,5 m attaque un allié : impose un désavantage au jet d'attaque. Nécessite un bouclier.",
    },
    {
      title: 'Châtiment divin',
      description: 'Sur une attaque corps à corps réussie, dépense un emplacement de sort pour infliger 2d8 dégâts radiants (+1d8 par niveau au-dessus du 1er, +1d8 contre mort-vivant ou fiélon).',
    },
    {
      title: 'Santé divine',
      description: 'Immunisé contre les maladies.',
    },
    {
      title: 'Canalisation · Présence conquérante',
      description: "Chaque créature au choix dans un rayon de 9 m doit réussir un jet de Sagesse (DD 13) ou être effrayée pendant 1 minute.",
    },
  ],

  personality: {
    trait: "J'accomplis des rites religieux qui sont étrangers à ce pays.",
    ideal: "Je dois reconquérir un pays qui a été corrompu par les forces du mal.",
    idealLabel: 'Conquête',
    bond: "Tant que je conserve le souvenir de ma patrie, je peux surmonter n'importe quel obstacle.",
    flaw: "Je considère que la plupart des autres dieux — de soi-disant lumières — sont naïfs ou simplement des imbéciles ignorants.",
  },

  attacks: [
    { name: 'Marteau de guerre', note: 'versatile (1d10)',    attackBonus: '1d20+4', damage: '1d8+2',  damageType: 'cont.' },
    { name: 'Arc long',          note: '45 m / 180 m',       attackBonus: '1d20+4', damage: '1d8+2',  damageType: 'perf.' },
    { name: 'Arc court',         note: '24 m / 96 m',        attackBonus: '1d20+4', damage: '1d6+2',  damageType: 'perf.' },
    { name: 'Dague',             note: 'légère, finesse, lancer', attackBonus: '1d20+4', damage: '1d4+2',  damageType: 'perf.' },
  ],

  spellcasting: {
    level: 1,
    slots: 3,
    saveDc: 13,
    spells: [
      { title: "Armure d'Agathys",  description: 'Serment. Gagne 5 PV temporaires ; inflige 5 dégâts de froid à quiconque touche le paladin au corps à corps.' },
      { title: 'Injonction',        description: "Serment. Une créature doit réussir un jet de Sagesse ou obéir à un ordre d'un mot (Fuis, Approche, Tombe…)." },
      { title: 'Soins',             description: 'Action, contact. Rend 1d8 + 3 points de vie.' },
      { title: 'Bouclier de la foi', description: 'Action bonus, concentration, 10 min. +2 à la CA de la cible.' },
    ],
  },

  languages: [
    { name: 'Commun' },
    { name: 'Elfique' },
    { name: 'Gnome' },
  ],

  rituals: [
    {
      number: 'Rite I',
      title: 'Le châtiment du conquérant',
      steps: [
        { text: 'Action · attaque au marteau de guerre' },
        { text: 'Si touché · ', emphasis: 'Châtiment divin (1 emplacement)' },
      ],
      formulas: ['1d20 + 4 ⟶ 1d8 + 2 + 2d8 radiant'],
    },
    {
      number: 'Rite II',
      title: "L'assaut à deux mains",
      steps: [
        { text: 'Action · marteau de guerre (prise à deux mains)' },
        { text: 'Si touché · ', emphasis: 'Châtiment divin (1 emplacement)' },
      ],
      formulas: ['1d20 + 4 ⟶ 1d10 + 2 + 2d8 radiant'],
    },
    {
      number: 'Rite III',
      title: "L'aura du conquérant",
      steps: [
        { text: 'Action · ', emphasis: 'Présence conquérante (canalisation)' },
        { text: 'Tour suivant · attaque + châtiment sur cible effrayée' },
      ],
      formulas: ['DD 13 Sag ⟶ effrayée 1 min', '1d20 + 4 ⟶ 1d8 + 2 + 2d8 radiant'],
    },
  ],

  colophon: "Gravé au fer blanc — Codex du conquérant Thaera. Tant que son marteau portera le poids de la justice, aucune terre ne restera aux mains du mal.",
}
