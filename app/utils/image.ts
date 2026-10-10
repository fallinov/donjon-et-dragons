import type { PortraitBytes } from '~/db/seed'

/** Limites des portraits importés (validées par Steve le 10.10.2026). */
export const PORTRAIT_MAX_SIDE = 1024
export const PORTRAIT_QUALITY = 0.85
export const PORTRAIT_MAX_SOURCE_BYTES = 25 * 1024 * 1024

export type ImageErrorCode = 'not-image' | 'too-large' | 'unsupported'

export class ImageError extends Error {
  constructor(readonly code: ImageErrorCode) {
    super(code)
    this.name = 'ImageError'
  }
}

/** Dimensions réduites pour tenir dans `maxSide`, proportions conservées, jamais agrandies. */
export function fitWithin(width: number, height: number, maxSide: number): { width: number, height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

interface Decoded {
  source: CanvasImageSource
  width: number
  height: number
  release: () => void
}

/**
 * Décode l'image en respectant l'orientation EXIF (photo prise en portrait).
 * `createImageBitmap` d'abord ; sinon un élément <img>, qui applique aussi l'EXIF.
 */
async function decode(file: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() }
    }
    catch {
      // Option ou format non géré par ce navigateur : essai avec <img>
    }
  }
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.src = url
  try {
    await img.decode()
  }
  catch {
    URL.revokeObjectURL(url)
    throw new ImageError('unsupported')
  }
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) }
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new ImageError('unsupported')), 'image/jpeg', quality)
  })
}

/**
 * Portrait prêt à stocker : redimensionné (côté long ≤ 1024 px) et réencodé en JPEG.
 * JPEG plutôt que WebP : Safari n'encode pas le WebP via `toBlob`.
 * Fond sombre du codex sous les zones transparentes (PNG), le JPEG n'ayant pas d'alpha.
 */
export async function resizePortrait(file: Blob, options: { maxSide?: number, quality?: number, maxBytes?: number } = {}): Promise<PortraitBytes> {
  const { maxSide = PORTRAIT_MAX_SIDE, quality = PORTRAIT_QUALITY, maxBytes = PORTRAIT_MAX_SOURCE_BYTES } = options
  if (file.type && !file.type.startsWith('image/')) throw new ImageError('not-image')
  if (file.size > maxBytes) throw new ImageError('too-large')

  const decoded = await decode(file)
  try {
    if (!decoded.width || !decoded.height) throw new ImageError('unsupported')
    const size = fitWithin(decoded.width, decoded.height, maxSide)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImageError('unsupported')
    ctx.fillStyle = '#0b0907'
    ctx.fillRect(0, 0, size.width, size.height)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(decoded.source, 0, 0, size.width, size.height)
    const blob = await toJpeg(canvas, quality)
    return { data: await blob.arrayBuffer(), mime: 'image/jpeg' }
  }
  finally {
    decoded.release()
  }
}
