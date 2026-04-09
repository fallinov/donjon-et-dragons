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
  maxHp: 23,
  hitDice: { die: 6, total: 4 },

  portrait: {
    src: '/img/thunon.png',
    alt: "Portrait de Thunon, haut-elfe magicien en robes sombres, grimoire à la main, regard perçant et traits elfiques anguleux",
  },

  vitals: [
    { label: 'Points de vie', value: '23', unit: '/ 23' },
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
      title: 'Évocation · Façonnage de sorts',
      description: "Quand un sort d'évocation affecte des alliés, peut choisir 1 + niveau du sort créatures qui réussissent automatiquement leur sauvegarde et ne subissent aucun dégât.",
    },
    {
      title: 'Évocation · Savant',
      description: "Le temps et l'or nécessaires pour copier un sort d'évocation dans le grimoire sont divisés par deux.",
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
    flaw: "Je parle sans vraiment penser mes mots.",
  },

  attacks: [
    { name: 'Trait de feu',      note: 'sort, 36 m',          attackBonus: '1d20+6', damage: '1d10',  damageType: 'feu'   },
    { name: 'Aspersion acide',   note: 'sort, 18 m, DD 14',   attackBonus: 'DD 14',  damage: '1d6',   damageType: 'acide' },
    { name: 'Bâton',             note: 'versatile (1d8)',      attackBonus: '1d20+2', damage: '1d6',   damageType: 'cont.' },
  ],

  spellcasting: {
    level: 2,
    slots: 3,
    saveDc: 14,
    spells: [
      { title: 'Lumière',              description: 'Sort mineur. Illumine un objet pendant 1 heure. Pas de concentration.' },
      { title: 'Trait de feu',         description: "Sort mineur. 1d10 dégâts de feu à 36 m. L'attaque de prédilection du magicien." },
      { title: 'Aspersion acide',      description: 'Sort mineur. 1d6 dégâts acide, DD 14 DEX, peut cibler 2 créatures adjacentes à 18 m.' },
      { title: 'Armure du mage',       description: 'Niv. 1, 8 heures. CA = 13 + DEX (+3) = 16. Pas de concentration.' },
      { title: 'Bouclier',             description: 'Niv. 1, réaction. +5 CA jusqu\'au prochain tour, y compris contre l\'attaque déclencheuse.' },
      { title: 'Projectile magique',   description: 'Niv. 1, évocation. 3 projectiles de 1d4+1 force. Touche automatique, pas de jet.' },
      { title: 'Rayon empoisonné',     description: 'Niv. 1. 1d20+6 au toucher, 2d8 poison. DD 14 CON ou empoisonné jusqu\'à la fin du prochain tour.' },
      { title: 'Vague tonnante',       description: 'Niv. 1, évocation. Créatures dans un cube de 4,5 m : DD 14 CON ou 2d8 tonnerre + repoussées de 3 m.' },
      { title: 'Sphère enflammée',     description: 'Niv. 2, évocation, concentration. Sphère de feu de 1,5 m : 2d6 feu, DD 14 DEX. Déplaçable en action bonus.' },
      { title: 'Flèche acide de Melf', description: 'Niv. 2, évocation. 1d20+6, 4d4 acide immédiat + 2d4 acide à la fin du tour suivant.' },
      { title: 'Immobilisation de personne', description: 'Niv. 2, concentration. DD 14 SAG ou paralysé. La cible retente à chaque tour.' },
      { title: 'Boule de feu',         description: 'Niv. 3, évocation. Rayon de 6 m, DD 14 DEX : 8d6 feu. Disponible au niveau 5.' },
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
      title: "L'embrasement",
      steps: [
        { text: 'Action · ', emphasis: 'Sphère enflammée (niv. 2)' },
        { text: 'Action bonus · déplacer la sphère sur une cible' },
        { text: 'Tours suivants · trait de feu + déplacement sphère' },
      ],
      formulas: ['DD 14 DEX ⟶ 2d6 feu (sphère)', '1d20 + 6 ⟶ 1d10 feu (trait)'],
      footnote: 'Façonnage de sorts protège les alliés dans la zone.',
    },
  ],

  colophon: "Enluminé à l'encre de lune — Codex de l'arcaniste Thunon. Que les grimoires restent ouverts et que le savoir ne connaisse jamais de frontière.",
}
