import { describe, expect, it } from 'vitest'

import { paginateProducts } from './paginateProducts'

describe('paginateProducts', () => {
  const products = Array.from({ length: 25 }, (_, index) => `product-${index + 1}`)

  it('returns only the requested page', () => {
    expect(paginateProducts(products, 2, 12)).toEqual({
      items: products.slice(12, 24),
      page: 2,
      totalPages: 3,
    })
  })

  it('clamps a page that no longer exists after filtering', () => {
    expect(paginateProducts(products.slice(0, 5), 4, 12)).toEqual({
      items: products.slice(0, 5),
      page: 1,
      totalPages: 1,
    })
  })
})
