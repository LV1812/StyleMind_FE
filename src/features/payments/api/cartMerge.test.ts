import { expect, it, vi } from 'vitest'
import { createPaymentApi } from './paymentApi'

it('merges the guest cart using the logged-in account token', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response('{"items":[]}', { status: 200 }))
  const api = createPaymentApi({ getAccessToken: () => 'account-token', fetch })
  await api.mergeGuestCart('guest-key')
  expect(fetch).toHaveBeenCalledOnce()
  const [url, options] = fetch.mock.calls[0]
  expect(url).toContain('/commerce/api/v1/cart/merge')
  expect(options.headers.Authorization).toBe('Bearer account-token')
  expect(JSON.parse(options.body)).toEqual({ guest_session_key: 'guest-key' })
})
