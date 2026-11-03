import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'
import { paymentApi } from '@/features/payments/api/paymentClient'
import { rememberOrder } from '@/features/payments/model/orderReferences'
import { getIdentityMockCalls } from '@/test/identityMockBackend'

beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
function seed() {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ ...createDemoSeed(), session: { userId: 'usr-customer-01', persistent: true }, cartLines: [{ id: 'cart', variantId: 'var-blouse-white-m', quantity: 1 }] }))
}
function mount(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  render(<AppProviders><RouterProvider router={router} /></AppProviders>)
  return router
}
describe('Real Order lookup and owner references', () => {
  it('lists only known IDs belonging to the current account and reads detail from API', async () => {
    seed()
    const order = await paymentApi.checkout({ checkout_key: crypto.randomUUID(), shipping_address_id: 'adr-customer-home', payment_method: 'COD' })
    rememberOrder({ orderId: order.order_id, owner: 'account', accountId: 'usr-customer-01' })
    rememberOrder({ orderId: 'other-account-order', owner: 'account', accountId: 'someone-else' })
    rememberOrder({ orderId: 'guest-order', owner: 'guest' })
    mount('/orders')
    const link = await screen.findByRole('link', { name: 'Xem đơn ' + order.order_id })
    expect(screen.queryByText(/other-account-order|guest-order/)).not.toBeInTheDocument()
    fireEvent.click(link)
    await screen.findByText(/Đặt hàng thành công/)
    expect(getIdentityMockCalls().some(call => call.path === '/commerce/api/v1/orders/' + order.order_id && call.method === 'GET')).toBe(true)
    expect(screen.queryByRole('button', { name: /Gửi yêu cầu hủy|Gửi yêu cầu trả/ })).not.toBeInTheDocument()
  })

  it('does not render demo orders or mark them paid from local state', async () => {
    seed(); mount('/orders')
    expect(await screen.findByText('Chưa lưu mã đơn nào trên trình duyệt này.')).toBeInTheDocument()
    expect(screen.queryByText(/ORD-TEST/)).not.toBeInTheDocument()
  })

  it('routes a known guest order to the guest API even after login', async () => {
    seed()
    const id = crypto.randomUUID()
    rememberOrder({ orderId: id, owner: 'guest' })
    const router = mount('/payments/' + id)
    await waitFor(() => expect(router.state.location.pathname).toBe('/guest/orders/' + id))
    expect(await screen.findByRole('alert')).toHaveTextContent('phiên khách')
    expect(getIdentityMockCalls().some(call => call.path.includes('/orders/'))).toBe(false)
  })

  it('preserves known order ID when opening legacy success route', async () => {
    seed()
    const order = await paymentApi.checkout({ checkout_key: crypto.randomUUID(), shipping_address_id: 'adr-customer-home', payment_method: 'COD' })
    const router = mount('/order-success/' + order.order_id)
    await screen.findByText(/Đặt hàng thành công/)
    expect(router.state.location.pathname).toBe('/payments/' + order.order_id)
    await act(async () => { await router.navigate('/orders') })
    expect(await screen.findByRole('link', { name: 'Xem đơn ' + order.order_id })).toBeInTheDocument()
  })
})
