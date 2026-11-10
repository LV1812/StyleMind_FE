import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'

import { getProductSelection } from './productSelection'
import catalogImageColors from '../data/catalogImageColors.json'

const product = createDemoSeed().products.find(item => item.id === 'prd-blouse-01')

if (!product) throw new Error('Expected blouse seed product to exist')

describe('getProductSelection', () => {
  it('selects the explicitly labelled colour photo from a shared imported gallery', () => {
    const entries = Object.entries(catalogImageColors).filter(([url]) => url.includes('/10338383462539/'))
    expect(entries.map(([, color]) => color).sort()).toEqual(['Kaki', 'Trắng', 'Xanh quân đội', 'Đỏ rượu vang'].sort())
    const images = entries.map(([url], order) => ({ id: String(order), url, alt: 'Ảnh sản phẩm', order, isPrimary: order === 0 }))
    const imported = { ...product, variants: entries.map(([, color], index) => ({
      ...product.variants[0], id: String(index), active: true, color, images,
    })) }
    for (const [expectedUrl, color] of entries) {
      const selection = getProductSelection(imported, { color })
      expect(selection.images[0].url, color).toBe(expectedUrl)
      expect(selection.images).toHaveLength(images.length)
    }
  })

  it('switches the visible gallery when color changes', () => {
    const [firstColor, secondColor] = Array.from(new Set(product.variants.map(variant => variant.color)))
    const white = getProductSelection(product, { color: firstColor, size: 'M' })
    const black = getProductSelection(product, { color: secondColor, size: 'M' })

    expect(white.images[0]?.url).not.toBe(black.images[0]?.url)
  })

  it('does not allow a zero-stock active variant to be purchased', () => {
    const zeroStockVariant = product.variants.find(variant => variant.active && variant.stock === 0)

    expect(zeroStockVariant).toBeDefined()

    const result = getProductSelection(product, {
      color: zeroStockVariant!.color,
      size: zeroStockVariant!.size,
    })

    expect(result.canPurchase).toBe(false)
    expect(result.error).toContain('hết hàng')
  })
})
