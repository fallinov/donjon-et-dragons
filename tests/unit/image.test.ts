import { describe, expect, it } from 'vitest'
import { fitWithin, ImageError, PORTRAIT_MAX_SOURCE_BYTES, resizePortrait } from '~/utils/image'

describe('fitWithin', () => {
  it('réduit le côté long à la limite en gardant les proportions', () => {
    expect(fitWithin(2000, 2667, 1024)).toEqual({ width: 768, height: 1024 })
    expect(fitWithin(4032, 3024, 1024)).toEqual({ width: 1024, height: 768 })
  })

  it('n\'agrandit jamais une petite image', () => {
    expect(fitWithin(600, 800, 1024)).toEqual({ width: 600, height: 800 })
  })

  it('garde au moins 1 px de côté', () => {
    expect(fitWithin(10000, 1, 1024)).toEqual({ width: 1024, height: 1 })
  })
})

describe('resizePortrait — refus avant décodage', () => {
  it('refuse un fichier qui n\'est pas une image', async () => {
    const file = new Blob(['texte'], { type: 'text/plain' })
    await expect(resizePortrait(file)).rejects.toMatchObject({ code: 'not-image' })
  })

  it('refuse une image de plus de 25 Mo', async () => {
    const file = new Blob([new Uint8Array(16)], { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: PORTRAIT_MAX_SOURCE_BYTES + 1 })
    const error = await resizePortrait(file).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ImageError)
    expect(error).toMatchObject({ code: 'too-large' })
  })
})
