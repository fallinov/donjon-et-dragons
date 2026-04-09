import type { Character } from '~~/shared/types/character'

export const kaelDraven: Character = {
  slug: 'kael-draven',
  player: 'Jérôme',
  firstName: 'Kael',
  lastName: 'Draven',
  eyebrow: "Codex de l'Ombre",
  race: 'Humain',
  className: 'Roublard',
  level: 4,
  background: 'Criminel (espion)',
  alignment: 'Neutre bon',

  proficiencyBonus: 2,
  maxHp: 27,
  hitDice: { die: 8, total: 4 },

  portrait: {
    src: '/img/kael-draven.png',
    alt: "Portrait de Kael Draven, humain roublard en armure de cuir sombre, capuche relevée, rapière au côté, regard furtif",
  },

  vitals: [
    { label: 'Points de vie', value: '27', unit: '/ 27' },
    { label: "Classe d'armure", value: '15' },
    { label: 'Initiative', value: '+4' },
    { label: 'Vitesse', value: '9', unit: 'm' },
  ],

  abilities: {
    strength:     { label: 'Force',        score:  9, modifier: -1, saveModifier: -1, proficient: false },
    dexterity:    { label: 'Dextérité',    score: 18, modifier: +4, saveModifier:  6, proficient: true  },
    constitution: { label: 'Constitution', score: 13, modifier: +1, saveModifier:  1, proficient: false },
    intelligence: { label: 'Intelligence', score: 15, modifier: +2, saveModifier:  4, proficient: true  },
    wisdom:       { label: 'Sagesse',      score: 13, modifier: +1, saveModifier:  1, proficient: false },
    charisma:     { label: 'Charisme',     score: 12, modifier: +1, saveModifier:  1, proficient: false },
  },

  skills: [
    { name: 'Discrétion',    ability: 'Dex', modifier: 8, proficient: true  },
    { name: 'Perspicacité',  ability: 'Sag', modifier: 5, proficient: true  },
    { name: 'Acrobaties',    ability: 'Dex', modifier: 6, proficient: true  },
    { name: 'Escamotage',    ability: 'Dex', modifier: 6, proficient: true  },
    { name: 'Perception',    ability: 'Sag', modifier: 3, proficient: true  },
    { name: 'Supercherie',   ability: 'Cha', modifier: 3, proficient: true  },
    { name: 'Investigation', ability: 'Int', modifier: 2, proficient: false },
    { name: 'Persuasion',    ability: 'Cha', modifier: 1, proficient: false },
  ],

  features: [
    {
      title: 'Expertise · Discrétion, Perspicacité',
      description: "Le bonus de maîtrise est doublé pour ces deux compétences (déjà inclus dans les modificateurs).",
    },
    {
      title: 'Attaque sournoise · 2d6',
      description: "Une fois par tour, +2d6 dégâts sur une attaque de finesse ou à distance si l'attaquant a l'avantage ou qu'un allié est adjacent à la cible.",
    },
    {
      title: 'Ruse',
      description: "Action bonus à chaque tour : Foncer, Se désengager ou Se cacher.",
    },
    {
      title: 'Mains lestes',
      description: "La Ruse permet aussi d'utiliser l'Escamotage, les outils de voleur ou l'action Utiliser un objet en action bonus.",
    },
    {
      title: 'Monte-en-l\'air',
      description: "L'escalade ne coûte pas de mouvement supplémentaire. L'élan du saut augmente de 1,2 m (DEX +4 × 0,3 m).",
    },
    {
      title: 'Jargon des voleurs',
      description: "Langage secret des criminels : messages codés dissimulés dans une conversation ordinaire.",
    },
    {
      title: 'Spécialité · Maître-chanteur',
      description: "Contacts dans le milieu criminel. Spécialiste de l'extorsion et de la collecte de secrets compromettants.",
    },
  ],

  personality: {
    trait: "J'ai toujours un plan pour savoir quoi faire.",
    ideal: "Je cherche à racheter les erreurs de mon passé.",
    idealLabel: 'Rédemption',
    bond: "Quelqu'un que j'aimais est mort à cause d'une erreur que j'ai commise.",
    flaw: "Quelque chose me trahit quand je mens.",
  },

  attacks: [
    { name: 'Rapière',   note: 'finesse',              attackBonus: '1d20+6', damage: '1d8+4', damageType: 'perf.' },
    { name: 'Arc court',  note: '24 m / 96 m',          attackBonus: '1d20+6', damage: '1d6+4', damageType: 'perf.' },
    { name: 'Dague',      note: 'finesse, lancer 6/18 m', attackBonus: '1d20+6', damage: '1d4+4', damageType: 'perf.' },
  ],

  languages: [
    { name: 'Commun' },
    { name: 'Infernal (écrit)' },
  ],

  rituals: [
    {
      number: 'Rite I',
      title: "L'estocade sournoise",
      steps: [
        { text: 'Condition : avantage ou allié adjacent à la cible' },
        { text: 'Action · rapière + ', emphasis: 'Attaque sournoise' },
      ],
      formulas: ['1d20 + 6 ⟶ 1d8 + 4 + 2d6'],
    },
    {
      number: 'Rite II',
      title: 'Frappe et disparition',
      steps: [
        { text: 'Action · rapière + attaque sournoise' },
        { text: 'Action bonus (Ruse) · ', emphasis: 'Se cacher' },
      ],
      formulas: ['1d20 + 6 ⟶ 1d8 + 4 + 2d6', 'Discrétion : 1d20 + 8'],
      footnote: 'Caché = avantage garanti au tour suivant.',
    },
    {
      number: 'Rite III',
      title: "Le tir embusqué",
      steps: [
        { text: 'Pré-combat · se cacher (avantage garanti)' },
        { text: 'Action · arc court + ', emphasis: 'Attaque sournoise' },
      ],
      formulas: ['1d20 + 6 (avantage) ⟶ 1d6 + 4 + 2d6'],
    },
  ],

  colophon: "Griffonné à l'encre invisible — Codex de l'ombre Draven. Ce que l'on ne voit pas ne fait pas de bruit, mais laisse des cicatrices.",
}
