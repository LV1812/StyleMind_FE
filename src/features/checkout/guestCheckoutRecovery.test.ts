import { afterEach, expect, it, vi } from 'vitest'
import { guestCheckoutApi } from './data/guestCheckoutApi'

afterEach(() => vi.unstubAllGlobals())
it('looks up a submitted guest order using the guest key in a header', async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response('{"order_id":"order"}', { status: 200 }))
  vi.stubGlobal('fetch', fetch)
  await expect(guestCheckoutApi.recoverCheckout('guest-key', 'checkout-key')).resolves.toEqual({ order_id: 'order' })
  expect(fetch.mock.calls[0][0]).toContain('/guest/checkout/recover')
  expect(fetch.mock.calls[0][0]).not.toContain('guest-key')
  expect(fetch.mock.calls[0][1].headers['X-Guest-Session-Key']).toBe('guest-key')
})
