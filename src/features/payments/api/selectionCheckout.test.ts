import { expect, it, vi } from 'vitest'
import { createPaymentApi } from './paymentApi'

it('previews selected items and sends buy-now checkout without mutating the cart', async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response('{}', { status: 200 }))
  const api = createPaymentApi({ getAccessToken: () => 'token', fetch })
  await api.previewSelection({ cart_item_ids: ['cart-item'] })
  await api.checkoutBuyNow({ checkout_key: 'key', shipping_address_id: 'address', payment_method: 'COD', variant_id: 'variant', quantity: 2 })
  expect(fetch.mock.calls[0][0]).toContain('/checkout/selected/prices')
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ cart_item_ids: ['cart-item'] })
  expect(fetch.mock.calls[1][0]).toContain('/orders/buy-now')
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({ variant_id: 'variant', quantity: 2 })
})

it('recovers an order by its checkout key using the current account', async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response('{"order_id":"order"}', { status: 200 }))
  const api = createPaymentApi({ getAccessToken: () => 'token', fetch })
  expect(await api.recoverCheckout('checkout-key')).toEqual({ order_id: 'order' })
  expect(fetch.mock.calls[0][0]).toContain('/checkout/recover')
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ checkout_key: 'checkout-key' })
})
