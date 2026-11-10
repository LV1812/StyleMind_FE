import type { CSSProperties } from 'react'

/** Colour used for a swatch when the colour name is not in the table. */
export const NEUTRAL_SWATCH = '#C4C7C7'

/**
 * Solid colours from the development seed and imported catalog.
 * Approximate fabric colours, not a colour measurement of product photos.
 */
const SWATCHES: Record<string, string> = {
  den: '#1F1F1F',
  trang: '#F8F8F6',
  'trang nga': '#F4EFE1',
  kem: '#F3E7C9',
  be: '#D9C3A0',
  xam: '#9A9A9A',
  'xam melange': '#B8B8B8',
  'xam than': '#4A4A4C',
  hong: '#F2A7B8',
  'hong dao': '#F6B3A0',
  do: '#D32F2F',
  'do do': '#7B1E2B',
  'do ruou vang': '#722F37',
  'do vang': '#722F37',
  'do dam': '#8B1A1A',
  'do dau': '#C72C48',
  'do cam': '#E35335',
  cam: '#F28C28',
  vang: '#F2C230',
  'vang mu tat': '#D4A017',
  nau: '#7A5230',
  'nau gi': '#9C4A22',
  kaki: '#C3B091',
  'xanh la': '#3F9B52',
  'xanh quan doi': '#4B5320',
  'xanh reu': '#556B2F',
  'xanh xo thom': '#9CAF88',
  'xanh hai quan': '#1F2A55',
  'xanh hai quan dam': '#151E3D',
  'xanh hoang gia': '#4169E1',
  'xanh co ban': '#0047AB',
  'xanh co vit': '#006D6F',
  'xanh da troi': '#87CEEB',
  'xanh duong nhat': '#9BC4E2',
  'xanh duong dam': '#174A8B',
  'xanh duong tram': '#4A6B82',
  'xanh la nhat': '#A8C686',
  'xanh la dam': '#245B36',
  'xanh hat de cuoi': '#B8C98B',
  'xanh tra': '#A8B88A',
  'xanh chanh': '#B7CE45',
  'xanh o liu': '#6B7A2E',
  'xanh duong': '#2F6FD6',
  'xanh navy': '#1F2A55',
  'xanh ngoc lam': '#30C5C0',
  'xanh ngoc bien': '#1B9AAA',
  tim: '#7E57C2',
  'tim oai huong': '#B39DDB',
  'hong phan': '#F4C2C2',
  'hong canh sen': '#D64B87',
  'hong nhat': '#F7CCD5',
  'hong dam': '#C84B79',
  'nau ca phe': '#6F4E37',
  'nau so co la': '#5C3317',
  'nau caramel': '#AF6E38',
  'nau lac da': '#C19A6B',
  'nau dam': '#4B3025',
  'be xam': '#B8AA98',
  'mau cat': '#D6C3A1',
  'mau mo': '#FBCEB1',
  'mau sam panh': '#F7E7CE',
  bac: '#C0C0C0',
  'bac kieu co dien': '#A8A294',
  'cam san ho': '#F08080',
  'cam san ho tram': '#CB7A70',
  'cham nhat': '#8C9DBA',
  'cham tram': '#4B5D78',
  'hong anh dao': '#F4A6B8',
  'hong dua hau': '#EF6F87',
  'hong keo': '#F6A4CF',
  'hong tram': '#BE8392',
  'hong tim': '#C66BA1',
  'kem trai cay': '#F6E5BC',
  'mau tra xanh': '#A8B88A',
  'nau ca phe mocha': '#967969',
  'nau hat de': '#805038',
  'nau vang': '#B88A44',
  'nau xam': '#8B7D72',
  'nau dat nung': '#B76548',
  'trang albumin': '#F5F1E5',
  'tim hoa voi voi': '#9775B1',
  'tim man': '#673147',
  'tim tu dinh huong': '#C8A2C8',
  'tim violet': '#8F5AB5',
  'tim dam': '#512D6D',
  'tim do': '#953553',
  'vang kim': '#D4AF37',
  'vang nhat': '#F6E7A1',
  'vang phan': '#F5E8B0',
  'vang trang': '#EDE6CC',
  'vang xanh': '#C7CE57',
  'xanh bien': '#287DAD',
  'xanh bo dam': '#274663',
  'xanh da troi nhat': '#B6DCEC',
  'xanh lam luc': '#288C8B',
  'xanh la bach dan': '#769887',
  'xanh nuoc': '#9EDAD2',
  'xanh suong': '#B8CED0',
  'xanh tham': '#173C50',
  'xanh vang': '#9BAF45',
  'xam nhat': '#D3D3D3',
  'xam vua': '#939393',
  'xam dam': '#555555',
  'den rung': '#18352A',
  'den than': '#292929',
  'den anh xam': '#383B3D',
  'do hong': '#D84B68',
  'do tim tram': '#824455',
  'do tuoi': '#E32636',
  // English aliases (older catalog data and demo content)
  black: '#1F1F1F',
  white: '#F8F8F6',
  red: '#D32F2F',
  blue: '#2F6FD6',
  green: '#3F9B52',
  beige: '#D9C3A0',
  brown: '#7A5230',
  gray: '#9A9A9A',
  grey: '#9A9A9A',
  pink: '#F2A7B8',
  navy: '#1F2A55',
}

/** Lower-case, strip accents (including đ) and collapse whitespace so "Xanh Ngọc  lam" and "xanh ngoc lam" match. */
export function normalizeColorName(name: string | null | undefined): string {
  return (name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const KEYS_LONGEST_FIRST = Object.keys(SWATCHES).sort((a, b) => b.length - a.length)

/** Exact match first, then the longest known prefix (e.g. "Xanh navy đậm" -> "xanh navy"). */
export function colorSwatchHex(name: string | null | undefined): string {
  const normalized = normalizeColorName(name)
  if (!normalized) return NEUTRAL_SWATCH
  const exact = SWATCHES[normalized]
  if (exact) return exact
  // Match a colour at the start (or after "mau"), never a trailing word:
  // "vang" in an unknown wine-red name must not become a yellow swatch.
  const colorName = normalized.replace(/^mau /, '')
  const partial = KEYS_LONGEST_FIRST.find(key => colorName === key || colorName.startsWith(`${key} `))
  return partial ? SWATCHES[partial] : NEUTRAL_SWATCH
}

const PATTERNS: Record<string, string> = {
  'hoa nau': '#7A5230',
  'hoa tim': '#9775B1',
  'hoa xanh duong': '#2F6FD6',
  'hoa xanh la': '#3F9B52',
  'hoa xanh trang': '#588EAC',
  'nen trang hoa tiet hoa hong hoa': '#D58A9A',
  'long vu xanh trang': '#5E9BAB',
}

/** CSS backgrounds let combined colours and prints remain visible in a small swatch. */
export function colorSwatchStyle(name: string | null | undefined, fallbackHex?: string): CSSProperties {
  const normalized = normalizeColorName(name)
  const backgroundColor = colorSwatchHex(name)
  const base = { backgroundColor: backgroundColor === NEUTRAL_SWATCH ? fallbackHex ?? backgroundColor : backgroundColor }
  if (normalized.includes('/')) {
    const parts = normalized.split('/').map(part => colorSwatchHex(part.trim()))
    const stops = parts.flatMap((color, index) => [`${color} ${index * 100 / parts.length}%`, `${color} ${(index + 1) * 100 / parts.length}%`])
    return { ...base, backgroundImage: `linear-gradient(135deg, ${stops.join(', ')})` }
  }
  if (normalized.includes('nhieu mau')) {
    return { ...base, backgroundImage: 'conic-gradient(#D84B68, #E8B84E, #6EAD80, #588ECA, #A477B6, #D84B68)' }
  }
  if (PATTERNS[normalized]) {
    return { ...base, backgroundColor: '#F8F5EE', backgroundImage: `radial-gradient(${PATTERNS[normalized]} 35%, transparent 40%)`, backgroundSize: '6px 6px' }
  }
  if (normalized === 'ke o') {
    return { ...base, backgroundColor: '#F8F5EE', backgroundImage: 'repeating-conic-gradient(#777 0% 25%, transparent 0% 50%)', backgroundSize: '8px 8px' }
  }
  if (normalized === 'hoa tiet da bao') {
    return { ...base, backgroundColor: '#C69C6D', backgroundImage: 'radial-gradient(#4B3025 30%, transparent 40%)', backgroundSize: '7px 5px' }
  }
  if (normalized === 'hoa tiet la lon') {
    return { ...base, backgroundColor: '#E9E7CC', backgroundImage: 'repeating-linear-gradient(50deg, #427358 0 3px, transparent 3px 7px)' }
  }
  // Labels such as "Màu Milan", "Họa tiết A/B" and "Nhạt/Đậm" do not
  // identify a hue. Keep an explicit neutral marker rather than inventing one.
  if (backgroundColor === NEUTRAL_SWATCH && (!fallbackHex || fallbackHex === NEUTRAL_SWATCH)) {
    return { ...base, backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 3px, #FFFFFF80 3px 5px)' }
  }
  return base
}
