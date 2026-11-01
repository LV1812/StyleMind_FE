import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { demoReducer } from '@/app/store/demoReducer'
import type { DemoDatabase } from '@/app/store/types'
import { recommendOutfit } from '@/features/ai-stylist/model/recommendOutfit'
import { getProductSelection } from '@/features/product-detail/model/productSelection'
import { selectOwnedOutfits } from '@/features/wardrobe/model/outfitSelectors'

describe('customer domain foundation', () => {
  it('stores customer body info without persistent style preferences', () => {
    const next = demoReducer(createDemoSeed(), {
      type: 'user/profileUpdated',
      payload: {
        userId: 'usr-customer-01',
        fullName: 'Nguyen Thien An',
        phone: '0912345678',
        heightCm: 161,
        weightKg: 53,
      },
    } as never)

    const user = next.users.find(item => item.id === 'usr-customer-01')

    expect(user).toMatchObject({ heightCm: 161, weightKg: 53 })
    expect(user).not.toHaveProperty('stylePreference')
    expect(user).not.toHaveProperty('occasionPreference')
    expect(user).not.toHaveProperty('budgetPreference')
  })

  it('keeps outfit items linked to real product variants', () => {
    const database = createDemoSeed()
    const outfits = selectOwnedOutfits(database, 'usr-customer-01')
    const outfit = outfits.find(item => item.items.length > 0)

    expect(outfit).toBeDefined()
    outfit?.items.forEach(item => {
      const product = database.products.find(candidate => candidate.id === item.productId)
      const variant = product?.variants.find(candidate => candidate.id === item.variantId)

      expect(product?.active).toBe(true)
      expect(variant?.active).toBe(true)
    })
  })

  it('recommends only active products and active variants from the catalog', () => {
    const database = createDemoSeed()
    const recommendation = recommendOutfit(database, {
      ownerId: 'usr-customer-01',
      requirement: {
        occasion: 'work',
        style: 'minimal',
        preferredColors: ['Trang', 'Den'],
        budget: 2_500_000,
      },
    })

    expect(recommendation.items.length).toBeGreaterThan(0)
    recommendation.items.forEach(item => {
      const product = database.products.find(candidate => candidate.id === item.productId)
      const variant = product?.variants.find(candidate => candidate.id === item.variantId)

      expect(product?.active).toBe(true)
      expect(variant?.active).toBe(true)
      expect(item.name).toBe(product?.name)
      expect(item.price).toBe(variant?.priceOverride ?? product?.basePrice)
    })
  })

  it('allows cart quantities without capping them by stock', () => {
    const next = demoReducer(createDemoSeed(), {
      type: 'cart/lineAdded',
      payload: { productId: 'prd-blouse-01', variantId: 'var-blouse-white-m', quantity: 999, source: 'shop' },
    })

    expect(next.cartLines[0]?.quantity).toBe(999)
  })

  it('does not expose stock-based purchase errors in product selection', () => {
    const database = createDemoSeed() as DemoDatabase
    const product = database.products.find(item => item.id === 'prd-blouse-01')
    const zeroStockVariant = product?.variants.find(item => item.active && item.stock === 0)

    expect(product).toBeDefined()
    expect(zeroStockVariant).toBeDefined()

    const selection = getProductSelection(product!, {
      color: zeroStockVariant!.color,
      size: zeroStockVariant!.size,
    })

    expect(selection.canPurchase).toBe(true)
    expect(selection.error).toBeUndefined()
  })
})
