import { afterEach, describe, expect, it, vi } from 'vitest'
import { isIos, isStandalone } from '~/utils/platform'

const setUserAgent = (ua: string, touchPoints = 0) => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua)
  vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(touchPoints)
}

describe('platform', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reconnaît l\'iPhone et l\'iPad (iPadOS se présente comme un Mac tactile)', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)')
    expect(isIos()).toBe(true)
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)
    expect(isIos()).toBe(true)
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)
    expect(isIos()).toBe(false)
    setUserAgent('Mozilla/5.0 (Linux; Android 16; Pixel 7)', 5)
    expect(isIos()).toBe(false)
  })

  it('mode installé : display-mode standalone', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
    expect(isStandalone()).toBe(true)
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
    expect(isStandalone()).toBe(false)
  })
})
