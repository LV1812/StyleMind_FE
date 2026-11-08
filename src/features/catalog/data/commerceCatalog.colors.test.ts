import { describe, expect, it } from 'vitest'

import { colorSwatchHex, NEUTRAL_SWATCH } from '@/shared/lib/colorSwatch'
import { catalogProduct, type CatalogProductResponse } from './commerceCatalog'

const variant = (id: string, color: string) => ({
  variant_id: id, size: 'M', color, material: null, unit_price_vnd: 100000, variant_status: 'ACTIVE', available_quantity: 5, images: [],
})
const raw = (colors: string[]): CatalogProductResponse => ({
  product_id: 'p1', category_id: 'c1', category_name: 'Áo', brand_name: 'Brand', name: 'Áo thun', description: null, product_status: 'ACTIVE',
  variants: colors.map((color, index) => variant(`v${index}`, color)),
})

describe('catalogProduct colour swatches', () => {
  it('gives each variant the swatch of its own colour name instead of one fixed colour', () => {
    const product = catalogProduct(raw(['Đen', 'Trắng', 'Xanh navy']))
    expect(product.variants.map(item => item.colorHex)).toEqual(['Đen', 'Trắng', 'Xanh navy'].map(colorSwatchHex))
    expect(new Set(product.variants.map(item => item.colorHex)).size).toBe(3)
  })

  it('uses a neutral swatch for an unknown colour name', () => {
    expect(catalogProduct(raw(['Cầu vồng'])).variants[0].colorHex).toBe(NEUTRAL_SWATCH)
  })
})
