import type { Character } from '~~/shared/types/character'

export const thunon: Character = {
  slug: 'thunon',
  firstName: 'Thunon',
  eyebrow: "Codex de l'Arcaniste",
  race: 'Haut-elfe',
  className: 'Magicien',
  level: 4,
  background: 'Sage',
  alignment: 'Chaotique bon',

  proficiencyBonus: 2,
  maxHp: 26,
  hitDice: { die: 6, total: 4 },

  portrait: {
    src: '/img/thunon.png',
    alt: "Portrait de Thunon, haut-elfe magicien en robes sombres, grimoire à la main, regard perçant et traits elfiques anguleux",
  },

  vitals: [
    { label: 'Points de vie', value: '26', unit: '/ 26' },
    { label: "Classe d'armure", value: '13' },
    { label: 'Initiative', value: '+3' },
    { label: 'Vitesse', value: '9', unit: 'm' },
  ],

  abilities: {
    strength:     { label: 'Force',        score: 10, modifier:  0, saveModifier: 0, proficient: false },
    dexterity:    { label: 'Dextérité',    score: 16, modifier: +3, saveModifier: 3, proficient: false },
    constitution: { label: 'Constitution', score: 14, modifier: +2, saveModifier: 2, proficient: false },
    intelligence: { label: 'Intelligence', score: 18, modifier: +4, saveModifier: 6, proficient: true  },
    wisdom:       { label: 'Sagesse',      score: 10, modifier:  0, saveModifier: 2, proficient: true  },
    charisma:     { label: 'Charisme',     score:  8, modifier: -1, saveModifier: -1, proficient: false },
  },

  skills: [
    { name: 'Arcanes',       ability: 'Int', modifier: 6, proficient: true  },
    { name: 'Histoire',      ability: 'Int', modifier: 6, proficient: true  },
    { name: 'Investigation', ability: 'Int', modifier: 6, proficient: true  },
    { name: 'Perception',    ability: 'Sag', modifier: 2, proficient: true  },
    { name: 'Discrétion',    ability: 'Dex', modifier: 3, proficient: false },
    { name: 'Acrobaties',    ability: 'Dex', modifier: 3, proficient: false },
    { name: 'Nature',        ability: 'Int', modifier: 4, proficient: false },
    { name: 'Perspicacité',  ability: 'Sag', modifier: 0, proficient: false },
  ],

  features: [
    {
      title: 'Ascendance féerique',
      description: "Avantage aux jets de sauvegarde contre les effets de charme. Immunité au sommeil magique.",
    },
    {
      title: 'Transe',
      description: "4 heures de méditation remplacent 8 heures de sommeil. Reste semi-conscient pendant la transe.",
    },
    {
      title: 'Restauration arcanique',
      description: "Lors d'un repos court, récupère des emplacements de sorts dont le total ne dépasse pas la moitié du niveau (2 niveaux max).",
    },
    {
      title: 'Maîtrise · Alchimie',
      description: "Maîtrise du matériel d'alchimiste. Peut identifier des potions et créer des substances alchimiques.",
    },
  ],

  personality: {
    trait: "J'ai lu tous les livres que j'ai pu trouver.",
    ideal: "La beauté se cache dans tout ce qui existe.",
    idealLabel: 'Beauté',
    bond: "Je préserve une bibliothèque à laquelle je tiens plus qu'à ma vie.",
    flaw: "Je colore sans cesse mes propos — le goût des tons vermeils teinte chacun de mes mots.",
  },

  attacks: [
    { name: 'Trait de feu',      note: 'sort, 36 m',          attackBonus: '1d20+6', damage: '1d10',  damageType: 'feu'   },
    { name: 'Bâton',             note: 'versatile (1d8)',      attackBonus: '1d20+2', damage: '1d6',   damageType: 'cont.' },
    { name: 'Arbalète légère',   note: '24 m / 96 m',         attackBonus: '1d20+5', damage: '1d8+3', damageType: 'perf.' },
  ],

  spellcasting: {
    level: 2,
    slots: 3,
    saveDc: 14,
    spells: [
      { title: 'Trait de feu',        description: "Sort mineur. 1d10 dégâts de feu à 36 m. L'attaque de prédilection du magicien." },
      { title: 'Lumière',             description: 'Sort mineur. Illumine un objet pendant 1 heure. Pas de concentration.' },
      { title: 'Main du mage',        description: 'Sort mineur. Crée une main spectrale capable de manipuler des objets à 9 m.' },
      { title: 'Prestidigitation',    description: 'Sort mineur. Effets magiques mineurs : allumer une flamme, nettoyer, colorer, etc.' },
      { title: 'Projectile magique',  description: 'Niv. 1. 3 projectiles de 1d4+1 force. Touche automatique, pas de jet.' },
      { title: 'Bouclier',            description: 'Niv. 1, réaction. +5 CA jusqu\'au prochain tour, y compris contre l\'attaque déclencheuse.' },
      { title: 'Armure du mage',      description: 'Niv. 1, 8 heures. CA = 13 + DEX (+3) = 16. Pas de concentration.' },
      { title: 'Détection de la magie', description: 'Niv. 1, rituel, concentration. Détecte la magie dans un rayon de 9 m pendant 10 min.' },
      { title: "Toile d'araignée",    description: 'Niv. 2, concentration. Zone de 6 m de toiles. DD 14 DEX ou entravé. Inflammable.' },
      { title: 'Invisibilité',        description: 'Niv. 2, concentration. La cible touchée devient invisible jusqu\'à ce qu\'elle attaque ou lance un sort.' },
    ],
  },

  darkvision: 18,

  languages: [
    { name: 'Commun' },
    { name: 'Elfique' },
    { name: 'Orque' },
  ],

  rituals: [
    {
      number: 'Rite I',
      title: 'Le trait arcanique',
      steps: [
        { text: 'Action · ', emphasis: 'Trait de feu (sort mineur)' },
      ],
      formulas: ['1d20 + 6 ⟶ 1d10 feu'],
    },
    {
      number: 'Rite II',
      title: 'Les projectiles infaillibles',
      steps: [
        { text: 'Action · ', emphasis: 'Projectile magique (niv. 1)' },
      ],
      formulas: ['3 × (1d4 + 1) force — touche automatique'],
    },
    {
      number: 'Rite III',
      title: 'La toile et la flamme',
      steps: [
        { text: 'Tour 1 · ', emphasis: "Toile d'araignée (niv. 2)" },
        { text: 'Tour 2 · ', emphasis: 'Trait de feu (avantage sur cible entravée)' },
      ],
      formulas: ['DD 14 DEX ⟶ entravé', '1d20 + 6 (avantage) ⟶ 1d10 feu'],
      footnote: "La toile est inflammable — le feu s'y propage.",
    },
  ],

  colophon: "Enluminé à l'encre de lune — Codex de l'arcaniste Thunon. Que les grimoires restent ouverts et que le savoir ne connaisse jamais de frontière.",
}
