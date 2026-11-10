import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { colorSwatchHex, colorSwatchStyle, NEUTRAL_SWATCH, normalizeColorName } from './colorSwatch'

// Every colour name in the BE development seed (development-catalog.json).
const SEED_COLORS = [
  'Đen', 'Xám melange', 'Hồng', 'Trắng', 'Xám', 'Vàng', 'Xanh lá', 'Xanh navy', 'Xanh dương', 'Nâu', 'Kem', 'Trắng ngà', 'Đỏ', 'Be',
  'Vàng mù tạt', 'Cam', 'Tím', 'Xám than', 'Xanh ô liu', 'Kaki', 'Đỏ đô', 'Nâu gỉ', 'Tím oải hương', 'Xanh ngọc lam', 'Hồng đào', 'Xanh ngọc biển',
]

describe('colorSwatchHex', () => {
  it('distinguishes the imported light, dark and muted shades', () => {
    for (const colors of [
      ['Xanh dương nhạt', 'Xanh dương', 'Xanh dương trầm', 'Xanh dương đậm'],
      ['Hồng nhạt', 'Hồng', 'Hồng trầm', 'Hồng đậm'],
      ['Xám nhạt', 'Xám vừa', 'Xám đậm'],
      ['Tím oải hương', 'Tím mận', 'Tím tử đinh hương', 'Tím đậm'],
      ['Nâu cà phê', 'Nâu cà phê mocha', 'Nâu caramel', 'Nâu hạt dẻ'],
    ]) {
      const hexes = colors.map(colorSwatchHex)
      expect(hexes).not.toContain(NEUTRAL_SWATCH)
      expect(new Set(hexes).size).toBe(colors.length)
    }
    expect(colorSwatchHex('Màu bạc kiểu cổ điển')).toBe('#A8A294')
    expect(colorSwatchHex('Xanh dương trầm - tay dài')).toBe('#4A6B82')
  })

  it('shows both colours in split swatches and several colours for multicolour fabrics', () => {
    const split = colorSwatchStyle('Trắng/đen')
    expect(split.backgroundImage).toContain(colorSwatchHex('Trắng'))
    expect(split.backgroundImage).toContain(colorSwatchHex('Đen'))
    expect(colorSwatchStyle('Cam san hô/hồng phấn').backgroundImage).toContain('#F4C2C2')
    expect(colorSwatchStyle('Nhiều màu').backgroundImage).toContain('conic-gradient')
    expect(colorSwatchStyle('Tím oải hương phối nhiều màu').backgroundImage).toContain('conic-gradient')
  })

  it('represents floral and checked fabrics with a pattern instead of a solid base colour', () => {
    expect(colorSwatchStyle('Hoa xanh dương').backgroundImage).toContain('#2F6FD6')
    expect(colorSwatchStyle('Kẻ ô').backgroundImage).toContain('repeating-conic-gradient')
    expect(colorSwatchStyle('Họa tiết da báo').backgroundImage).toContain('radial-gradient')
    expect(colorSwatchStyle('Tím hoa vòi voi').backgroundImage).toBeUndefined()
  })

  it('does not invent a hue for ambiguous catalog labels', () => {
    for (const name of ['Màu Milan', 'Nhạt', 'Trung bình', 'Đậm (DK)', 'Họa tiết A', 'Họa tiết B']) {
      expect(colorSwatchHex(name)).toBe(NEUTRAL_SWATCH)
      expect(colorSwatchStyle(name).backgroundImage).toContain('repeating-linear-gradient')
    }
    expect(colorSwatchStyle('Custom', '#123456').backgroundColor).toBe('#123456')
  })

  it('renders the imported catalog army green, khaki and wine red accurately', () => {
    expect(colorSwatchHex('Xanh quân đội')).toBe('#4B5320')
    expect(colorSwatchHex('Kaki')).toBe('#C3B091')
    expect(colorSwatchHex('Màu kaki')).toBe('#C3B091')
    expect(colorSwatchHex('Đỏ rượu vang')).toBe('#722F37')
    expect(colorSwatchHex('Đỏ rượu vang')).not.toBe(colorSwatchHex('Vàng'))
    expect(colorSwatchHex('Đỏ rượu vang đậm')).toBe('#722F37')
  })

  it('does not mistake a trailing word for the base colour', () => {
    expect(colorSwatchHex('Rượu vang')).toBe(NEUTRAL_SWATCH)
    expect(colorSwatchHex('Hoa xanh dương')).toBe(NEUTRAL_SWATCH)
  })

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
