import { describe, expect, it } from 'vitest'
import { hasMessage, t, tCount } from '~/composables/useT'
import { fr } from '~/i18n/fr'

describe('t', () => {
  it('renvoie le texte de la clé', () => {
    expect(t('rest.short')).toBe('Repos court')
  })

  it('remplace les paramètres', () => {
    expect(t('rest.longDone', { hp: 49 })).toBe('Repos long effectué — HP restaurés à 49')
  })

  it('remplace plusieurs paramètres', () => {
    expect(t('status.hpProgress', { current: 12, max: 49 })).toBe('12 sur 49 points de vie')
  })

  it('laisse un jeton sans paramètre correspondant intact', () => {
    expect(t('rest.longDone', { autre: 1 })).toBe('Repos long effectué — HP restaurés à {hp}')
  })

  it('ne remplace pas les clés héritées du prototype', () => {
    expect(t('rest.longDone', {})).toBe('Repos long effectué — HP restaurés à {hp}')
  })
})

describe('tCount', () => {
  it('singulier pour 0 et 1 (règle française)', () => {
    expect(tCount('home.count', 0)).toBe('0 personnage consigné')
    expect(tCount('home.count', 1)).toBe('1 personnage consigné')
  })

  it('pluriel à partir de 2', () => {
    expect(tCount('home.count', 6)).toBe('6 personnages consignés')
  })

  it('accepte des paramètres supplémentaires', () => {
    expect(tCount('rituals.subtitle', 3, { word: 'trois' })).toBe('— trois séquences à graver dans la mémoire du bras —')
  })
})

describe('hasMessage', () => {
  it('reconnaît une clé construite dynamiquement', () => {
    expect(hasMessage('common.countWord.3')).toBe(true)
    expect(hasMessage('common.countWord.42')).toBe(false)
    expect(hasMessage('toString')).toBe(false)
  })
})

describe('catalogue fr', () => {
  it('ne contient aucun texte vide', () => {
    const empty = Object.entries(fr).filter(([, value]) => !value.trim())
    expect(empty).toEqual([])
  })

  it('chaque pluriel a ses deux formes', () => {
    const keys = Object.keys(fr)
    const bases = keys.filter(k => k.endsWith('.one')).map(k => k.slice(0, -4))
    for (const base of bases) expect(keys).toContain(`${base}.other`)
  })
})
