import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { demoReducer } from '@/app/store/demoReducer'
import type { DemoAction, DemoDatabase } from '@/app/store/types'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'

import { CHECKOUT_QR_SESSION_KEY, createQrSession, confirmQrPayment, type QrSession } from './data/checkoutRepository'

let router: ReturnType<typeof createMemoryRouter>

function databaseWithCustomerAndCart(overrides: Partial<DemoDatabase> = {}): DemoDatabase {
  const database = createDemoSeed()

  return {
    ...database,
    session: { userId: 'usr-customer-01', persistent: true },
    orders: [],
    cancellationRequests: [],
    returnRequests: [],
    cartLines: [
      {
        id: 'cart-test-line',
        productId: 'prd-blouse-01',
        variantId: 'var-blouse-white-m',
        quantity: 1,
        source: 'shop',
      },
    ],
    ...overrides,
  }
}

function persistDatabase(database: DemoDatabase) {
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(database))
}

function getDatabase() {
  const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
  if (!raw) throw new Error('Expected demo database in localStorage')
  return JSON.parse(raw) as DemoDatabase
}

function renderAt(initialEntry: string, database: DemoDatabase) {
  window.localStorage.clear()
  window.sessionStorage.clear()
  persistDatabase(database)
  mount(initialEntry)
}

function mount(initialEntry: string) {
  router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

function renderCheckoutWithCustomerAndCart() {
  renderAt('/checkout', databaseWithCustomerAndCart())
}

function currentPath() {
  return router.state.location.pathname
}

function createActiveQrSession(overrides: Partial<QrSession> = {}): QrSession {
  return {
    id: 'qr-idempotent-01',
    amount: 650_000,
    transferContent: 'STYLEMIND QR qr-idempotent-01',
    expiresAt: '2099-09-25T06:10:00.000Z',
    orderId: null,
    ...overrides,
  }
}

function renderExpiredQrSession() {
  window.localStorage.clear()
  window.sessionStorage.clear()
  persistDatabase(databaseWithCustomerAndCart())
  window.sessionStorage.setItem(
    CHECKOUT_QR_SESSION_KEY,
    JSON.stringify(createActiveQrSession({ id: 'qr-expired-01', expiresAt: '2000-01-01T00:00:00.000Z' })),
  )
  mount('/checkout/qr')
}

describe('Checkout flow', () => {
  it('redirects an empty cart from checkout to cart', async () => {
    renderAt('/checkout', databaseWithCustomerAndCart({ cartLines: [] }))

    expect(await screen.findByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument()
    expect(currentPath()).toBe('/cart')
  })

  it('places one COD order and clears purchased cart lines', async () => {
    const user = userEvent.setup()
    renderCheckoutWithCustomerAndCart()

    await user.click(screen.getByLabelText('Thanh toán khi nhận hàng'))
    await user.click(screen.getByRole('button', { name: 'Đặt hàng' }))

    expect(await screen.findByText('Đặt hàng thành công')).toBeInTheDocument()
    await waitFor(() => expect(getDatabase().orders).toHaveLength(1))
    expect(getDatabase().cartLines).toHaveLength(0)
  })

  it('does not create an order when an expired QR is confirmed', () => {
    renderExpiredQrSession()

    expect(screen.getByText('Thanh toán đã hết hạn')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tôi đã thanh toán' })).not.toBeInTheDocument()
    expect(getDatabase().orders).toHaveLength(0)
  })

  it('creates only one order when the same QR session is confirmed twice', async () => {
    const session = createActiveQrSession()
    let database = databaseWithCustomerAndCart()
    const dispatch = (action: DemoAction) => {
      database = demoReducer(database, action)
    }

    const first = await confirmQrPayment(session, database)
    dispatch({ type: 'order/placed', payload: first })
    const second = await confirmQrPayment(session, database)
    dispatch({ type: 'order/placed', payload: second })

    expect(database.orders.filter(order => order.paymentReference === session.id)).toHaveLength(1)
  })

  it('confirms a QR order from the selected checkout snapshot', async () => {
    const database = databaseWithCustomerAndCart()
    const session = await createQrSession({
      database,
      userId: 'usr-customer-01',
      addressId: 'adr-customer-office',
      discountCode: 'STYLE10',
      now: '2026-09-25T06:00:00.000Z',
    })
    const changedDatabase = {
      ...database,
      cartLines: [],
      addresses: database.addresses.map(address => ({
        ...address,
        isDefault: address.id === 'adr-customer-home',
        line1: address.id === 'adr-customer-office' ? 'Địa chỉ văn phòng đã đổi' : address.line1,
      })),
    }

    const order = await confirmQrPayment(session, changedDatabase)

    expect(order.shippingAddress).toMatchObject({
      id: 'adr-customer-office',
      line1: '18 Lê Thánh Tôn',
      district: 'Quận 1',
    })
    expect(order.items).toHaveLength(1)
    expect(order.discount).toBe(62_000)
    expect(order.total).toBe(session.amount)
    expect(order.paymentReference).toBe(session.id)
  })

  it('stores the selected shipping address snapshot on the order', async () => {
    const user = userEvent.setup()
    renderCheckoutWithCustomerAndCart()

    expect(screen.getByRole('link', { name: 'Quản lý địa chỉ' })).toHaveAttribute('href', '/account/addresses')

    await user.selectOptions(screen.getByLabelText('Chọn địa chỉ'), 'adr-customer-office')
    await user.click(screen.getByLabelText('Thanh toán khi nhận hàng'))
    await user.click(screen.getByRole('button', { name: 'Đặt hàng' }))

    await waitFor(() => expect(getDatabase().orders).toHaveLength(1))

    const placedDatabase = getDatabase()
    const order = placedDatabase.orders[0]
    expect(order.shippingAddress).toMatchObject({
      id: 'adr-customer-office',
      line1: '18 Lê Thánh Tôn',
      district: 'Quận 1',
    })
    expect('userId' in order.shippingAddress).toBe(false)
    expect('isDefault' in order.shippingAddress).toBe(false)

    const officeAddress = placedDatabase.addresses.find(address => address.id === 'adr-customer-office')
    if (!officeAddress) throw new Error('Expected office address')

    const nextDatabase = demoReducer(placedDatabase, {
      type: 'address/upserted',
      payload: { ...officeAddress, line1: 'Địa chỉ đã thay đổi' },
    })

    expect(nextDatabase.orders[0].shippingAddress.line1).toBe('18 Lê Thánh Tôn')
  })
})
