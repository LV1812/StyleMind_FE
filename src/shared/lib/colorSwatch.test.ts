import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { colorSwatchHex, NEUTRAL_SWATCH, normalizeColorName } from './colorSwatch'

// Every colour name in the BE development seed (development-catalog.json).
const SEED_COLORS = [
  'Đen', 'Xám melange', 'Hồng', 'Trắng', 'Xám', 'Vàng', 'Xanh lá', 'Xanh navy', 'Xanh dương', 'Nâu', 'Kem', 'Trắng ngà', 'Đỏ', 'Be',
  'Vàng mù tạt', 'Cam', 'Tím', 'Xám than', 'Xanh ô liu', 'Kaki', 'Đỏ đô', 'Nâu gỉ', 'Tím oải hương', 'Xanh ngọc lam', 'Hồng đào', 'Xanh ngọc biển',
]

describe('colorSwatchHex', () => {
  it('has a swatch for every colour name in the seed catalog, none of them neutral', () => {
    for (const name of SEED_COLORS) expect(colorSwatchHex(name), name).not.toBe(NEUTRAL_SWATCH)
  })

  it('keeps similar colours distinct', () => {
    const hexes = SEED_COLORS.map(colorSwatchHex)
    expect(new Set(hexes).size).toBe(SEED_COLORS.length)
  })

  it('ignores case, accents and extra spaces', () => {
    expect(colorSwatchHex('XANH  NGỌC lam')).toBe(colorSwatchHex('xanh ngoc lam'))
    expect(colorSwatchHex('den')).toBe(colorSwatchHex('Đen'))
    expect(colorSwatchHex('  Hồng đào ')).toBe(colorSwatchHex('hong dao'))
    expect(normalizeColorName('Đỏ đô')).toBe('do do')
  })

  it('prefers the most specific colour name', () => {
    expect(colorSwatchHex('Xanh navy đậm')).toBe(colorSwatchHex('Xanh navy'))
    expect(colorSwatchHex('Tím oải hương nhạt')).toBe(colorSwatchHex('Tím oải hương'))
    expect(colorSwatchHex('Xám than')).not.toBe(colorSwatchHex('Xám'))
  })

  it('understands the English aliases used by older data', () => {
    expect(colorSwatchHex('Black')).toBe(colorSwatchHex('Đen'))
    expect(colorSwatchHex('navy')).toBe(colorSwatchHex('Xanh navy'))
  })

  it('falls back to a neutral swatch for unknown or empty names', () => {
    for (const name of ['Cầu vồng', 'Zebra', '', '   ', null, undefined]) expect(colorSwatchHex(name)).toBe(NEUTRAL_SWATCH)
  })

  it('covers every colour present in the BE seed file when it is available', () => {
    const seed = resolve(process.cwd(), '../StyleMind_BE/commerce-service/src/main/resources/db/seed/development-catalog.json')
    let json: unknown
    try { json = JSON.parse(readFileSync(seed, 'utf8')) } catch { return }
    const colors = new Set<string>()
    const walk = (node: unknown) => {
      if (Array.isArray(node)) node.forEach(walk)
      else if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) { if (key === 'color' && typeof value === 'string') colors.add(value); else walk(value) }
      }
    }
    walk(json)
    expect(colors.size).toBeGreaterThan(0)
    for (const name of colors) expect(colorSwatchHex(name), name).not.toBe(NEUTRAL_SWATCH)
  })
})
