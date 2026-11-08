import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { commerceApi } from '@/api/commerce'
import type { CheckoutInput, OrderResponse } from '@/api/commerce.types'
import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'
import { getIdentityMockCalls, installIdentityMockBackend, expireNextIdentityRequest } from '@/test/identityMockBackend'
import { accountDraftKey } from './model/accountCheckout'
import { readOrderReferences } from '@/features/payments/model/orderReferences'

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); installIdentityMockBackend() })
function mount(path = '/checkout', empty = false) {
  const seed = createDemoSeed()
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ ...seed, session: { userId: 'usr-customer-01', persistent: true }, cartLines: empty ? [] : [{ id: 'cart-1', productId: 'prd-blouse-01', variantId: 'var-blouse-white-m', quantity: 1, source: 'shop' }] }))
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  const view = render(<AppProviders><RouterProvider router={router} /></AppProviders>)
  return { ...view, router }
}
const writes = () => getIdentityMockCalls().filter(call => call.path === '/commerce/api/v1/orders' && call.method === 'POST')
async function ready() { await waitFor(() => expect(screen.getByRole('button', { name: 'Đặt hàng' })).toBeEnabled()) }

describe('Account checkout using backend contracts', () => {
  it('uses server prices, saved Identity address, exact body and refreshes the server cart', async () => {
    const { router } = mount(); await ready()
    fireEvent.click(screen.getByRole('button', { name: 'Đặt hàng' }))
    expect(await screen.findByText(/Đặt hàng thành công/)).toBeInTheDocument()
    expect(writes()).toHaveLength(1)
    expect(writes()[0].body).toEqual({ checkout_key: expect.any(String), shipping_address_id: 'adr-customer-home', payment_method: 'COD' })
    expect(writes()[0].headers.has('Authorization')).toBe(true)
    expect(writes()[0].headers.has('X-Guest-Session-Key')).toBe(false)
    const saved = readOrderReferences()[0]
    expect(saved).toMatchObject({ owner: 'account', accountId: 'usr-customer-01' })
    expect(router.state.location.pathname).toBe('/payments/' + saved.orderId)
    expect(getIdentityMockCalls().filter(call => call.path === '/commerce/api/v1/cart')).toHaveLength(2)
    expect(localStorage.getItem(accountDraftKey('usr-customer-01'))).toBeNull()
  })

  it('creates SePay once, uses bodyless recovery and GET status, and restores on refresh', async () => {
    const { router, unmount } = mount(); await ready()
    fireEvent.click(screen.getByLabelText('VietQR'))
    fireEvent.click(screen.getByRole('button', { name: 'Đặt hàng' }))
    await screen.findByRole('img', { name: 'Mã QR chuyển khoản ngân hàng' })
    const path = router.state.location.pathname
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra trạng thái đơn' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tải lại thông tin thanh toán' })).toBeEnabled())
    expect(getIdentityMockCalls().filter(call => call.path.endsWith('/payment-attempt'))).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại thông tin thanh toán' }))
    await waitFor(() => expect(getIdentityMockCalls().filter(call => call.path.endsWith('/payment-attempt'))).toHaveLength(2))
    unmount()
    const router2 = createMemoryRouter(appRoutes, { initialEntries: [path] })
    render(<AppProviders><RouterProvider router={router2} /></AppProviders>)
    await screen.findByRole('img', { name: 'Mã QR chuyển khoản ngân hàng' })
    const attempts = getIdentityMockCalls().filter(call => call.path.endsWith('/payment-attempt'))
    expect(attempts.every(call => call.method === 'POST' && call.body === undefined)).toBe(true)
    expect(writes()).toHaveLength(1)
    expect(screen.queryByText('Máy chủ đã xác nhận thanh toán.')).not.toBeInTheDocument()
  })

  it('keeps exact checkout after unknown network delivery and blocks concurrent submits', async () => {
    const backend = globalThis.fetch
    let finish!: () => void
    let count = 0
    const bodies: string[] = []
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/commerce/api/v1/orders') && init?.method === 'POST') {
        bodies.push(String(init.body)); count++
        if (count === 1) { await new Promise<void>(resolve => { finish = resolve }); throw new TypeError('network') }
      }
      return backend(input, init)
    })
    mount(); await ready()
    const button = screen.getByRole('button', { name: 'Đặt hàng' })
    fireEvent.click(button); fireEvent.click(button)
    expect(count).toBe(1)
    await act(async () => finish())
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa xác định')
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại đặt hàng' }))
    await screen.findByText(/Đặt hàng thành công/)
    expect(bodies[0]).toBe(bodies[1])
  })

  it('refreshes JWT once after 401 on prices', async () => {
    mount(); await ready()
    expireNextIdentityRequest('GET', '/commerce/api/v1/checkout/prices')
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại giá và địa chỉ' }))
    await ready()
    expect(getIdentityMockCalls().filter(call => call.path === '/api/v1/auth/refresh')).toHaveLength(1)
    expect(getIdentityMockCalls().filter(call => call.path === '/commerce/api/v1/checkout/prices')).toHaveLength(3)
  })

  it('does not submit an empty backend cart', async () => {
    mount('/checkout', true)
    expect(await screen.findByRole('alert')).toHaveTextContent('trống')
    expect(screen.getByRole('button', { name: 'Đặt hàng' })).toBeDisabled()
    expect(writes()).toHaveLength(0)
  })

  it('legacy QR route cannot mark an order paid locally', async () => {
    mount('/checkout/qr')
    await screen.findByLabelText('Mã đơn hàng')
    expect(screen.queryByRole('button', { name: 'Tôi đã thanh toán' })).not.toBeInTheDocument()
    expect(writes()).toHaveLength(0)
  })
})
