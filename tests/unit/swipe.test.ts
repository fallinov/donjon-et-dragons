import { describe, expect, it } from 'vitest'
import { detectAxis, resolveSwipe } from '~/utils/swipe'

describe('detectAxis', () => {
  it('ne tranche pas tant que le mouvement est trop court', () => {
    expect(detectAxis(5, 3)).toBeNull()
  })

  it('verrouille sur l\'axe vertical quand le doigt descend', () => {
    expect(detectAxis(4, 20)).toBe('y')
  })

  it('verrouille sur l\'axe horizontal quand le doigt glisse latéralement', () => {
    expect(detectAxis(-20, 4)).toBe('x')
  })
})

describe('resolveSwipe', () => {
  it('ignore un scroll vertical même avec une forte dérive horizontale', () => {
    // Scénario du bug : scroll en diagonale sur l'onglet Combat
    expect(resolveSwipe('y', 80, 300)).toBeNull()
  })

  it('ignore un geste horizontal sous le seuil', () => {
    expect(resolveSwipe('x', 40, 0)).toBeNull()
  })

  it('ignore un geste dont le déplacement final est plus vertical qu\'horizontal', () => {
    expect(resolveSwipe('x', 60, 120)).toBeNull()
  })

  it('détecte un swipe vers la droite', () => {
    expect(resolveSwipe('x', 80, 10)).toBe('right')
  })

  it('détecte un swipe vers la gauche', () => {
    expect(resolveSwipe('x', -80, 10)).toBe('left')
  })
})
