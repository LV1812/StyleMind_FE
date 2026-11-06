import { describe, expect, it, vi } from 'vitest'
import { createPaymentApi, PaymentApiError } from './paymentApi'

function setup() {
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () =>
    new Response(JSON.stringify({ status: 'PENDING' }), { status: 200 }),
  )
  const getAccessToken = vi.fn(() => 'test-access-token')
  return { fetch, getAccessToken, api: createPaymentApi({ gatewayUrl: 'http://localhost:8080/', getAccessToken, fetch }) }
}

describe('Payment backend API integration', () => {
  it('refreshes an expired JWT once and resends the exact checkout body', async () => {
    let token = 'expired-token'
    const fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(new Response('{"order_id":"order-id"}', { status: 201 }))
    const refreshAccessToken = vi.fn(async () => { token = 'fresh-token'; return token })
    const api = createPaymentApi({ gatewayUrl: '', getAccessToken: () => token, refreshAccessToken, fetch })
    const body = { checkout_key: 'same-checkout-key', shipping_address_id: 'same-address', payment_method: 'COD' as const }
    await api.checkout(body)
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls[0][1]?.body).toBe(fetch.mock.calls[1][1]?.body)
    expect(new Headers(fetch.mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer fresh-token')
  })

  it('does not replay a write with a different token after the session changes', async () => {
    let token = 'first-owner'
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => { token = 'second-owner'; return new Response('{}', { status: 401 }) })
    const refreshAccessToken = vi.fn(async () => token)
    const api = createPaymentApi({ getAccessToken: () => token, refreshAccessToken, fetch })
    await expect(api.checkout({ checkout_key: 'same-key', shipping_address_id: 'address', payment_method: 'COD' })).rejects.toMatchObject({ status: 401 })
    expect(refreshAccessToken).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('uses Commerce recovery without a body and reads the current token per request', async () => {
    const { api, fetch, getAccessToken } = setup()
    await api.getOrderPaymentAttempt('order/id')
    expect(fetch).toHaveBeenLastCalledWith(
      'http://localhost:8080/commerce/api/v1/orders/order%2Fid/payment-attempt',
      expect.objectContaining({ method: 'POST', headers: { Accept: 'application/json', Authorization: 'Bearer test-access-token' } }),
    )
    expect(fetch.mock.calls[0][1]).not.toHaveProperty('body')
    getAccessToken.mockReturnValue('rotated-access-token')
    await api.getOrder('order-id')
    expect(fetch).toHaveBeenLastCalledWith(
      'http://localhost:8080/commerce/api/v1/orders/order-id',
      expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ Authorization: 'Bearer rotated-access-token' }) }),
    )
  })

  it('sends checkout fields unchanged to Commerce', async () => {
    const { api, fetch } = setup()
    const body = { checkout_key: 'checkout-key', shipping_address_id: 'address-id', payment_method: 'SEPAY_VIETQR' as const }
    await api.checkout(body)
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/commerce/api/v1/orders',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(body) }))
  })

  it('sends COD collection once and exposes a duplicate error without retrying', async () => {
    const { api, fetch } = setup()
    fetch.mockResolvedValue(new Response(JSON.stringify({ code: 'PAYMENT_ATTEMPT_NOT_PENDING', detail: 'Already collected' }), { status: 409 }))
    await expect(api.confirmCodCollection({ payment_attempt_id: 'attempt-id', collected_amount_vnd: 125000 }))
      .rejects.toMatchObject({ status: 409, code: 'PAYMENT_ATTEMPT_NOT_PENDING' })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/payment/api/v1/admin/cod-collections',
      expect.objectContaining({ body: JSON.stringify({ payment_attempt_id: 'attempt-id', collected_amount_vnd: 125000 }) }))
  })

  it.each([0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])('rejects unsafe COD amount %s before sending', amount => {
    const { api, fetch } = setup()
    expect(() => api.confirmCodCollection({ payment_attempt_id: 'attempt-id', collected_amount_vnd: amount }))
      .toThrow(PaymentApiError)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('encodes the exception filter and uses bounded pagination', async () => {
    const { api, fetch } = setup()
    await api.listPaymentExceptions({ status: 'OPEN & REVIEW', limit: 10, offset: 20 })
    expect(fetch.mock.calls[0][0]).toBe('http://localhost:8080/payment/api/v1/admin/payment-exceptions?limit=10&offset=20&status=OPEN+%26+REVIEW')
    expect(() => api.listPaymentExceptions({ limit: 101 })).toThrow(PaymentApiError)
    expect(() => api.listPaymentExceptions({ offset: -1 })).toThrow(PaymentApiError)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not issue a request without a JWT', async () => {
    const { api, fetch, getAccessToken } = setup()
    getAccessToken.mockReturnValue('')
    await expect(api.getOrder('order-id')).rejects.toMatchObject({ status: 401, code: 'AUTHENTICATION_REQUIRED' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each([401, 403, 404, 409, 503])('preserves backend error metadata for HTTP %s', async status => {
    const { api, fetch } = setup()
    fetch.mockResolvedValue(new Response(JSON.stringify({ code: 'BACKEND_CODE', detail: 'Backend detail', correlationId: 'trace-id' }), { status }))
    await expect(api.getOrder('order-id')).rejects.toMatchObject({ status, code: 'BACKEND_CODE', correlationId: 'trace-id', message: 'Backend detail' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('handles non-JSON upstream failures', async () => {
    const { api, fetch } = setup()
    fetch.mockResolvedValue(new Response('Bad gateway', { status: 502 }))
    await expect(api.getOrder('order-id')).rejects.toMatchObject({ status: 502, code: 'HTTP_ERROR' })
  })

  it('passes cancellation through and does not retry network failures', async () => {
    const { api, fetch } = setup()
    const controller = new AbortController()
    fetch.mockRejectedValue(new DOMException('Aborted', 'AbortError'))
    await expect(api.getOrder('order-id', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    expect(fetch.mock.calls[0][1]?.signal?.aborted).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
