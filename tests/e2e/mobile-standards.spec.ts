import { test, expect, type Page } from '@playwright/test'

/**
 * Normes smartphone vérifiées sur chaque écran, à 360 px (petit Android) :
 * - aucun défilement horizontal ;
 * - cibles tactiles ≥ 44 × 44 px (Apple HIG, WCAG 2.5.5 AAA) ;
 * - texte ≥ 12 px ; champs de saisie ≥ 16 px (sinon iOS zoome au focus) ;
 * - contraste ≥ 7:1, ou ≥ 4,5:1 pour les grands textes (WCAG 1.4.6 AAA).
 * Exclus : éléments désactivés, masqués, décoratifs (aria-hidden), texte posé sur une image.
 */
test.use({ viewport: { width: 360, height: 740 }, hasTouch: true })

interface Report { overflow: string | null, targets: string[], small: string[], inputs: string[], contrast: string[] }

async function audit(page: Page): Promise<Report> {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const rgba = (color: string) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      return { r: r!, g: g!, b: b!, a: a! / 255 }
    }
    type C = ReturnType<typeof rgba>
    const blend = (top: C, bottom: C): C => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 })
    const lum = ({ r, g, b }: C) => {
      const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const vw = document.documentElement.clientWidth
    const shown = (el: Element) => {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return r.width > 1 && r.height > 1 && r.right > 0 && r.left < vw && s.visibility !== 'hidden'
        && !el.closest('[aria-hidden="true"], .sr-only, [disabled], details:not([open]) > :not(summary)')
    }
    const label = (el: Element) => (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40)

    // Fond réel derrière un texte ; null s'il est posé sur une image ou un dégradé (non mesurable)
    const background = (el: Element): C | null => {
      const layers: C[] = []
      for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
        const s = getComputedStyle(n)
        if (s.backgroundImage !== 'none' || n.tagName === 'IMG') return null
        const c = rgba(s.backgroundColor)
        if (c.a > 0) { layers.push(c); if (c.a >= 1) break }
      }
      let bg = rgba(getComputedStyle(document.body).backgroundColor)
      for (const l of layers.reverse()) bg = blend(l, bg)
      return bg
    }
    const hasPhotoBehind = (el: Element) => Boolean(el.closest('figure, .aspect-\\[3\\/4\\]'))

    const overflow = document.documentElement.scrollWidth > vw ? `${document.documentElement.scrollWidth}px > ${vw}px` : null

    const targets = [...document.querySelectorAll('a, button, summary, select, input, textarea')].filter(shown).flatMap((el) => {
      const input = el as HTMLInputElement
      const box = (input.type === 'checkbox' || input.type === 'radio') && el.closest('label') ? el.closest('label')! : el
      const r = box.getBoundingClientRect()
      return r.width < 44 || r.height < 44 ? [`« ${label(el)} » ${Math.round(r.width)}×${Math.round(r.height)}`] : []
    })

    const textEls = [...document.querySelectorAll('body *')].filter(el => shown(el) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent!.trim()))
    const small = textEls.flatMap((el) => {
      const size = parseFloat(getComputedStyle(el).fontSize)
      return size < 12 ? [`${size}px « ${label(el)} »`] : []
    })
    const inputs = [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]), select, textarea')].filter(shown)
      .flatMap(el => parseFloat(getComputedStyle(el).fontSize) < 16 ? [`${getComputedStyle(el).fontSize} « ${label(el)} »`] : [])

    const contrast = textEls.flatMap((el) => {
      if (hasPhotoBehind(el)) return []
      const s = getComputedStyle(el)
      const bg = background(el)
      if (!bg) return []
      let fg = rgba(s.color)
      // Opacité des ancêtres (ex. 0.9) appliquée à la couleur du texte
      let opacity = 1
      for (let n: Element | null = el; n; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity)
      fg = { ...fg, a: fg.a * opacity }
      const L1 = lum(blend(fg, bg))
      const L2 = lum(bg)
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
      const size = parseFloat(s.fontSize)
      const large = size >= 24 || (size >= 18.66 && Number(s.fontWeight) >= 700)
      const min = large ? 4.5 : 7
      return ratio < min ? [`${ratio.toFixed(2)}:1 < ${min} « ${label(el)} »`] : []
    })
    const unique = (list: string[]) => [...new Set(list)]
    return { overflow, targets: unique(targets), small: unique(small), inputs: unique(inputs), contrast: unique(contrast) }
  })
}

async function openTab(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name, exact: true }).dispatchEvent('click')
  await page.waitForTimeout(300)
}

const screens: { name: string, url: string, prepare?: (page: Page) => Promise<void> }[] = [
  { name: 'accueil', url: '/' },
  { name: 'fiche — profil', url: '/personnages/dareth-brumeval' },
  { name: 'fiche — combat', url: '/personnages/dareth-brumeval', prepare: p => openTab(p, 'Combat') },
  { name: 'fiche — sorts', url: '/personnages/dareth-brumeval', prepare: p => openTab(p, 'Sorts') },
  { name: 'fiche — sac', url: '/personnages/dareth-brumeval', prepare: p => openTab(p, 'Sac') },
  { name: 'fiche — stats', url: '/personnages/dareth-brumeval', prepare: p => openTab(p, 'Stats') },
  { name: 'fiche à 0 PV (jets contre la mort)', url: '/personnages/zanna', prepare: async (p) => {
    await openTab(p, 'Combat')
    const minus = p.getByRole('button', { name: /Diminuer points de vie/i })
    while (await minus.isEnabled()) await minus.click()
  } },
  { name: 'éditeur (tout déplié)', url: '/personnages/zanna/modifier', prepare: p => p.locator('details').evaluateAll((ds) => { ds.forEach((d) => { (d as HTMLDetailsElement).open = true }) }) },
  { name: 'éditeur avec erreurs', url: '/personnages/nouveau', prepare: p => p.getByRole('button', { name: 'Enregistrer' }).click() },
  { name: 'boîte de confirmation', url: '/personnages/dareth-brumeval', prepare: p => p.getByRole('button', { name: 'Supprimer' }).click() },
]

test.describe('Normes smartphone', () => {
  for (const screen of screens) {
    test(screen.name, async ({ page }) => {
      await page.goto(screen.url)
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
      await screen.prepare?.(page)
      // Mesurer après les animations d'apparition (opacité 0 → 1) ; le brouillard tourne en boucle, il est ignoré
      await page.evaluate(() => Promise.all(document.getAnimations()
        .filter(a => a.effect?.getTiming().iterations !== Infinity)
        .map(a => a.finished.catch(() => undefined))))
      const report = await audit(page)
      expect.soft(report.overflow, 'défilement horizontal').toBeNull()
      expect.soft(report.targets, 'cibles tactiles < 44 px').toEqual([])
      expect.soft(report.small, 'texte < 12 px').toEqual([])
      expect.soft(report.inputs, 'champs < 16 px').toEqual([])
      expect.soft(report.contrast, 'contraste insuffisant').toEqual([])
    })
  }
})
