import { afterEach, describe, expect, it, vi } from 'vitest'
import { shareOrDownload } from '~/utils/share'

const file = new File(['{}'], 'dareth.codex.json', { type: 'application/json' })

function stubNavigator(share: ((data: ShareData) => Promise<void>) | undefined): void {
  Object.defineProperty(navigator, 'canShare', { value: share ? () => true : undefined, configurable: true })
  Object.defineProperty(navigator, 'share', { value: share, configurable: true })
}

describe('shareOrDownload', () => {
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x')
  afterEach(() => click.mockClear())

  it('télécharge quand le partage de fichiers n\'existe pas', async () => {
    stubNavigator(undefined)
    expect(await shareOrDownload(file, 'Dareth')).toBe('downloaded')
    expect(click).toHaveBeenCalled()
  })

  it('ouvre le menu de partage natif', async () => {
    const share = vi.fn(async () => {})
    stubNavigator(share)
    expect(await shareOrDownload(file, 'Dareth')).toBe('shared')
    expect(share).toHaveBeenCalledWith({ files: [file], title: 'Dareth' })
    expect(click).not.toHaveBeenCalled()
  })

  it('partage annulé par l\'utilisateur : rien d\'autre', async () => {
    stubNavigator(async () => { throw new DOMException('annulé', 'AbortError') })
    expect(await shareOrDownload(file, 'Dareth')).toBe('cancelled')
    expect(click).not.toHaveBeenCalled()
  })

  it('partage refusé pour une autre raison : téléchargement', async () => {
    stubNavigator(async () => { throw new DOMException('refusé', 'NotAllowedError') })
    expect(await shareOrDownload(file, 'Dareth')).toBe('downloaded')
  })
})
