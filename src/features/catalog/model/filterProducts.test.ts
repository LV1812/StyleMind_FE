import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'

import { filterProducts } from './filterProducts'
import type { CatalogFilters } from './types'

const products = createDemoSeed().products

const filters: CatalogFilters = {
  query: 'đi làm',
  categoryIds: ['tops'],
  colors: ['Trắng'],
  sizes: ['M'],
  styles: ['minimal'],
  occasions: ['work'],
  price: { min: 300_000, max: 900_000 },
  sort: 'price-asc',
}

describe('filterProducts', () => {
  it('combines search, filters and sort without mutating products', () => {
    const original = structuredClone(products)
    const result = filterProducts(products, filters)

    expect(result.every(product => product.categoryId === 'tops')).toBe(true)
    expect(result.map(product => product.basePrice)).toEqual([...result.map(product => product.basePrice)].sort((a, b) => a - b))
    expect(products).toEqual(original)
  })
})
