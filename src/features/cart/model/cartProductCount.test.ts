import { expect, it } from 'vitest'
import { countCartProducts } from './cartProductCount'
import type { GuestCartItem } from '../data/guestCartApi'
import type { Product } from '@/entities/product/model/types'

it('counts a product once for multiple variants and quantities', () => {
  const products = [{ id: 'p1', variants: [{ id: 'v1' }, { id: 'v2' }] }, { id: 'p2', variants: [{ id: 'v3' }] }] as Product[]
  const items = [{ variant_id: 'v1', quantity: 3 }, { variant_id: 'v2', quantity: 1 }, { variant_id: 'v3', quantity: 2 }] as GuestCartItem[]
  expect(countCartProducts(items, products)).toBe(2)
})
