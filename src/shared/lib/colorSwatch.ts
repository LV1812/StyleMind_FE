/** Colour used for a swatch when the colour name is not in the table. */
export const NEUTRAL_SWATCH = '#C4C7C7'

/**
 * Colour names used by the catalog (all 26 names in the BE development seed, plus a few English aliases)
 * mapped to a swatch colour. Keys are written in their normalised form (see normalizeColorName).
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
  cam: '#F28C28',
  vang: '#F2C230',
  'vang mu tat': '#D4A017',
  nau: '#7A5230',
  'nau gi': '#9C4A22',
  kaki: '#BDB76B',
  'xanh la': '#3F9B52',
  'xanh o liu': '#6B7A2E',
  'xanh duong': '#2F6FD6',
  'xanh navy': '#1F2A55',
  'xanh ngoc lam': '#30C5C0',
  'xanh ngoc bien': '#1B9AAA',
  tim: '#7E57C2',
  'tim oai huong': '#B39DDB',
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

/** Exact match first, then the longest known colour name contained in the text (e.g. "Xanh navy đậm" -> "xanh navy"). */
export function colorSwatchHex(name: string | null | undefined): string {
  const normalized = normalizeColorName(name)
  if (!normalized) return NEUTRAL_SWATCH
  const exact = SWATCHES[normalized]
  if (exact) return exact
  const partial = KEYS_LONGEST_FIRST.find(key => new RegExp(`(^| )${key}( |$)`).test(normalized))
  return partial ? SWATCHES[partial] : NEUTRAL_SWATCH
}
