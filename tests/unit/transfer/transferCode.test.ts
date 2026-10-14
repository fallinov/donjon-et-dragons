import { describe, expect, it } from 'vitest'
import { formatCode, generateCode, isValidCode, normalizeCode, TRANSFER_CODE_LENGTH } from '~/utils/transferCode'

describe('code de transfert', () => {
  it('génère 8 caractères de l\'alphabet de Crockford', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCode()
      expect(code).toHaveLength(TRANSFER_CODE_LENGTH)
      expect(isValidCode(code)).toBe(true)
      expect(code).not.toMatch(/[ILOU]/)
    }
  })

  it('couvre tout l\'alphabet sans biais de position', () => {
    const code = generateCode(bytes => bytes.map((_, i) => i * 32 + 31))
    expect(code).toBe('ZZZZZZZZ')
    expect(generateCode(bytes => bytes.fill(0))).toBe('00000000')
  })

  it('saisie tolérante : casse, espaces, tirets, O→0, I/L→1', () => {
    expect(normalizeCode(' k7p4-qx9m ')).toBe('K7P4QX9M')
    expect(normalizeCode('O1IL-ABCD')).toBe('0111ABCD')
    expect(isValidCode(normalizeCode('k7p4 qx9m'))).toBe(true)
  })

  it('refuse un code de mauvaise longueur ou avec U', () => {
    expect(isValidCode('K7P4QX9')).toBe(false)
    expect(isValidCode('K7P4QX9MM')).toBe(false)
    expect(isValidCode('K7P4QX9U')).toBe(false)
  })

  it('affiche en deux groupes', () => {
    expect(formatCode('K7P4QX9M')).toBe('K7P4-QX9M')
  })
})
