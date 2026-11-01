import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import type { DemoDatabase } from '@/app/store/types'

import { selectCartDetails, selectCartTotals } from './cartSelectors'

function databaseWithCart(quantity = 2): DemoDatabase {
  const database = createDemoSeed()

  return {
    ...database,
    cartLines: [
      {
        id: 'cart-test-line',
        productId: 'prd-blouse-01',
        variantId: 'var-blouse-white-m',
        quantity,
        source: 'shop',
      },
    ],
  }
}

describe('cart selectors', () => {
  it('calculates subtotal, discount, shipping and total in VND integers', () => {
    const totals = selectCartTotals(databaseWithCart(), { discountCode: 'STYLE10' })

    expect(Number.isInteger(totals.total)).toBe(true)
    expect(totals.discount).toBe(Math.min(Math.round(totals.subtotal * 0.1), 200_000))
    expect(totals.shipping).toBe(totals.subtotal >= 1_500_000 ? 0 : 30_000)
    expect(totals.total).toBe(totals.subtotal - totals.discount + totals.shipping)
  })

  it('keeps requested quantities for active variants without stock caps', () => {
    const detail = selectCartDetails(databaseWithCart(99)).find(line => line.variant.id === 'var-blouse-white-m')

    expect(detail?.quantity).toBe(99)
  })
})
