import type { Character } from '~~/shared/types/character'

export const zanna: Character = {
  slug: 'zanna',
  firstName: 'Zanna',
  lastName: '',
  eyebrow: 'Codex de la sage',
  race: 'Gnome des forêts',
  className: 'Occultiste',
  level: 3,
  background: 'Sage',
  alignment: 'Neutre bon',

  proficiencyBonus: 2,
  maxHp: 19,
  hitDice: { die: 8, total: 3 },

  portrait: {
    src: '/img/zanna.png',
    alt: "Portrait peint de Zanna, jolie gnome des forêts occultiste, cheveux châtain ornés de feuilles, yeux lumineux, robe de sage brodée, grimoire et familier",
  },

  vitals: [
    { label: 'Points de vie', value: '19', unit: '/ 19' },
    { label: "Classe d'armure", value: '12' },
    { label: 'Initiative', value: '+1' },
    { label: 'Vitesse', value: '7,5', unit: 'm' },
  ],

  abilities: {
    strength:     { label: 'Force',        score:  7, modifier: -2, saveModifier: -2, proficient: false },
    dexterity:    { label: 'Dextérité',    score: 13, modifier: +1, saveModifier:  1, proficient: false },
    constitution: { label: 'Constitution', score: 11, modifier:  0, saveModifier:  0, proficient: false },
    intelligence: { label: 'Intelligence', score: 14, modifier: +2, saveModifier:  2, proficient: false },
    wisdom:       { label: 'Sagesse',      score: 11, modifier:  0, saveModifier:  2, proficient: true  },
    charisma:     { label: 'Charisme',     score: 15, modifier: +2, saveModifier:  4, proficient: true  },
  },

  skills: [
    { name: 'Arcanes',       ability: 'Int', modifier: 4, proficient: true  },
    { name: 'Histoire',      ability: 'Int', modifier: 4, proficient: true  },
    { name: 'Investigation', ability: 'Int', modifier: 4, proficient: true  },
    { name: 'Religion',      ability: 'Int', modifier: 4, proficient: true  },
    { name: 'Nature',        ability: 'Int', modifier: 2, proficient: false },
    { name: 'Perception',    ability: 'Sag', modifier: 0, proficient: false },
    { name: 'Persuasion',    ability: 'Cha', modifier: 2, proficient: false },
    { name: 'Discrétion',    ability: 'Dex', modifier: 1, proficient: false },
  ],

  features: [
    {
      title: 'Héritage gnome des forêts',
      description: "Vision dans le noir 18 m. Ruse gnome (avantage aux jets de sauvegarde Int/Sag/Cha contre la magie). Peut communiquer des concepts simples à de petits animaux grâce à un enchantement mineur inné.",
    },
    {
      title: "Magie occulte · Patron d'un autre monde",
      description: "Zanna a scellé un pacte avec une entité d'outre-monde qui lui confère ses sorts et ses invocations occultes. DD de sauvegarde 12, bonus d'attaque avec un sort +4.",
    },
    {
      title: 'Pacte de la Chaîne',
      description: "Appelle un familier amélioré (imp, pseudo-dragon, quasit, sprite) qui sert de messager, espion et canal pour ses sorts de contact.",
    },
    {
      title: 'Invocation · Vision d\'un autre monde',
      description: "Voit à travers les ténèbres magiques et non magiques jusqu'à 36 m, comme si elles n'existaient pas.",
    },
    {
      title: 'Sage — Recherches archivistiques',
      description: "Elle sait où trouver la réponse à presque toutes les questions, si ce n'est dans ses propres souvenirs, alors dans une bibliothèque, un sanctuaire ou auprès d'un érudit.",
    },
  ],

  personality: {
    trait: "Je lis tous les livres qui me passent entre les mains, même s'il faut dormir moins pour cela.",
    ideal: "La connaissance est un chemin sacré : la partager, c'est honorer la Déesse du Savoir.",
    idealLabel: 'Savoir',
    bond: "L'œuvre de ma vie est une œuvre d'amour — préserver la mémoire du monde avant qu'elle ne se perde.",
    flaw: "Je disparais dès qu'une parcelle d'information inédite apparaît à l'horizon, quitte à abandonner mes compagnons au pire moment.",
  },

  attacks: [
    { name: 'Dagues',          note: '4 m / 12 m, finesse, jet',     attackBonus: '1d20+1', damage: '1d4+1',  damageType: 'perf.' },
    { name: 'Serpe',           note: 'légère',                        attackBonus: '1d20-1', damage: '1d4-2',  damageType: 'tranch.' },
    { name: 'Masse',           note: 'à une main',                    attackBonus: '1d20-1', damage: '1d8-2',  damageType: 'cont.'  },
    { name: 'Explosion occulte', note: 'sort mineur, 36 m',           attackBonus: '1d20+4', damage: '1d10',   damageType: 'force'  },
  ],

  spellcasting: {
    level: 2,
    slots: 2,
    saveDc: 12,
    shortRestRefresh: true,
    spells: [
      { title: 'Illusion mineure', description: "Sort mineur. Crée un son ou une image immobile dans un cube de 1,50 m, durée 1 minute." },
      { title: 'Explosion occulte', description: 'Sort mineur. Trait de force à 36 m, 1d10 dégâts (2 traits au niveau 5).' },
      { title: 'Protection contre les armes', description: 'Sort mineur de défense — réduit les dégâts d\'arme lors d\'une attaque ciblée.' },
      { title: 'Lueurs féeriques', description: 'Niveau 1, concentration. Révèle les créatures invisibles et leur inflige désavantage aux attaques contre elles.' },
      { title: 'Sommeil', description: "Niveau 1. Endort 5d8 pv de créatures dans une sphère de 6 m." },
      { title: 'Armure du mage', description: 'Niveau 1. CA = 13 + mod Dex pour 8 h tant que la cible ne porte pas d\'armure.' },
      { title: 'Appel d\'un familier', description: 'Rituel. Invoque son familier du pacte de la chaîne.' },
      { title: "Onde de choc", description: "Niveau 2. Explosion de force qui repousse et assourdit." },
      { title: "Détection de l'invisibilité", description: "Niveau 2. Permet de voir les créatures invisibles dans un rayon de 9 m pendant 1 heure." },
    ],
  },

  languages: [
    { name: 'Commun' },
    { name: 'Gnome' },
    { name: 'Nain' },
    { name: 'Céleste' },
    { name: 'Draconique', rare: true },
  ],

  rituals: [
    {
      number: 'Rite I',
      title: 'Le trait occulte répété',
      steps: [
        { text: "Action · ", emphasis: 'Explosion occulte' },
        { text: 'À niveau 5, deux traits par incantation.' },
      ],
      formulas: ['1d20 + 4 ⟶ 1d10 force (par trait)'],
      footnote: 'Sort mineur, portée 36 m — sa principale arme.',
    },
    {
      number: 'Rite II',
      title: 'Le sommeil des sentinelles',
      steps: [
        { text: 'Action · ', emphasis: 'Sommeil (niveau 1)' },
        { text: 'Zone sphérique de 6 m de rayon à 27 m.' },
      ],
      formulas: ['5d8 pv endormis (les plus faibles en premier)'],
      footnote: 'Neutralise les gardes sans effusion de sang.',
    },
    {
      number: 'Rite III',
      title: 'La lueur qui démasque',
      steps: [
        { text: 'Action · ', emphasis: 'Lueurs féeriques' },
        { text: 'Zone cube de 6 m, concentration jusqu\'à 1 min.' },
      ],
      formulas: ['Cibles contourées · invisibilité annulée · désavantage briseur'],
      footnote: 'Combo préféré avec un allié en mêlée.',
    },
  ],

  colophon: 'Consigné sur vélin enluminé — Codex de Zanna la sage. Que chaque page soit une porte, chaque porte un savoir.',
}
