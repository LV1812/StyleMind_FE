import { describe, expect, it } from 'vitest'

import { createDemoSeed } from './demoSeed'

describe('createDemoSeed product catalog', () => {
  it('seeds only supported womenswear categories', () => {
    const allowed = new Set(['tops', 'pants', 'skirts', 'dresses', 'outerwear'])
    const seed = createDemoSeed()

    expect(seed.products.length).toBeGreaterThanOrEqual(12)
    expect(seed.products.every(product => allowed.has(product.categoryId))).toBe(true)
  })

  it('provides a separate primary gallery for every active product color', () => {
    for (const product of createDemoSeed().products) {
      for (const color of new Set(product.variants.filter(variant => variant.active).map(variant => variant.color))) {
        const images = product.variants.filter(variant => variant.color === color).flatMap(variant => variant.images)

        expect(images.some(image => image.isPrimary)).toBe(true)
      }
    }
  })
})
