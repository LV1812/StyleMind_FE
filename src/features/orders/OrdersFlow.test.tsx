import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { demoReducer } from '@/app/store/demoReducer'
import type { DemoDatabase } from '@/app/store/types'
import type { AddressSnapshot } from '@/entities/address/model/types'
import type { Order, OrderStatus } from '@/entities/order/model/types'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'

function addressSnapshot(database: DemoDatabase): AddressSnapshot {
  const address = database.addresses.find(item => item.id === 'adr-customer-home')
  if (!address) throw new Error('Expected address fixture')
  const { userId: _userId, isDefault: _isDefault, ...snapshot } = address
  return snapshot
}

function orderFixture(database: DemoDatabase, overrides: Partial<Order> = {}): Order {
  const product = database.products.find(item => item.id === 'prd-blouse-01')
  const variant = product?.variants.find(item => item.id === 'var-blouse-white-m')
  const image = variant?.images[0]
  if (!product || !variant || !image) throw new Error('Expected product fixture')

  return {
    id: 'ORD-TEST-001',
    userId: 'usr-customer-01',
    status: 'pending',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    paymentReference: null,
    items: [
      {
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        brand: product.brand,
        color: variant.color,
        size: variant.size,
        quantity: 1,
        unitPrice: product.basePrice,
        imageUrl: image.url,
      },
    ],
    shippingAddress: addressSnapshot(database),
    subtotal: product.basePrice,
    discount: 0,
    shipping: 30_000,
    total: product.basePrice + 30_000,
    createdAt: '2026-09-26T09:00:00.000Z',
    timeline: [
      { id: 'timeline-created', label: 'Đã tạo đơn COD', at: '2026-09-26T09:00:00.000Z' },
      { id: 'timeline-confirmed', label: 'Đã xác nhận thông tin', at: '2026-09-26T09:20:00.000Z' },
    ],
    ...overrides,
  }
}

function databaseWithOrders(status: OrderStatus = 'pending') {
  const database = createDemoSeed()
  return {
    ...database,
    session: { userId: 'usr-customer-01', persistent: true },
    orders: [orderFixture(database, { status })],
    cancellationRequests: [],
    returnRequests: [],
  }
}

function persistDatabase(database: DemoDatabase) {
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(database))
}

function getDatabase() {
  const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
  if (!raw) throw new Error('Expected database in localStorage')
  return JSON.parse(raw) as DemoDatabase
}

function renderAt(initialEntry: string, database: DemoDatabase) {
  window.localStorage.clear()
  persistDatabase(database)
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] })

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}

describe('Orders flow', () => {
  it('lists current customer orders and opens an order detail', async () => {
    const user = userEvent.setup()
    renderAt('/orders', databaseWithOrders())

    expect(await screen.findByRole('heading', { name: 'Đơn hàng' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /ORD-TEST-001/ }))

    expect(await screen.findByRole('heading', { name: 'Đơn ORD-TEST-001' })).toBeInTheDocument()
    expect(screen.getByText('Đã tạo đơn COD')).toBeInTheDocument()
    expect(screen.getByText(/72 Nguyễn Thị Minh Khai/)).toBeInTheDocument()
  })

  it('submits a cancellation request with a reason for an eligible order', async () => {
    const user = userEvent.setup()
    renderAt('/orders/ORD-TEST-001', databaseWithOrders('pending'))

    await user.type(screen.getByLabelText('Lý do hủy đơn'), 'Tôi đặt nhầm size')
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu hủy' }))

    expect(await screen.findByText('Đã gửi yêu cầu hủy')).toBeInTheDocument()
    await waitFor(() => expect(getDatabase().cancellationRequests).toHaveLength(1))
    expect(getDatabase().cancellationRequests[0]).toMatchObject({
      orderId: 'ORD-TEST-001',
      userId: 'usr-customer-01',
      reason: 'Tôi đặt nhầm size',
      status: 'submitted',
    })
  })

  it('allows cancellation for paid orders', async () => {
    renderAt('/orders/ORD-TEST-001', databaseWithOrders('paid'))

    expect(await screen.findByLabelText('Lý do hủy đơn')).toBeInTheDocument()
  })

  it('does not allow cancellation for processing orders', async () => {
    renderAt('/orders/ORD-TEST-001', databaseWithOrders('processing'))

    expect(await screen.findByRole('heading', { name: 'Đơn ORD-TEST-001' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Lý do hủy đơn')).not.toBeInTheDocument()
  })

  it('submits a return request for selected order items', async () => {
    const user = userEvent.setup()
    renderAt('/orders/ORD-TEST-001', databaseWithOrders('shipped'))

    await user.click(screen.getByLabelText(/Áo blouse cổ vuông/))
    await user.type(screen.getByLabelText('Lý do trả hàng'), 'Sản phẩm không vừa')
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu trả hàng' }))

    expect(await screen.findByText('Đã gửi yêu cầu trả hàng')).toBeInTheDocument()
    await waitFor(() => expect(getDatabase().returnRequests).toHaveLength(1))
    expect(getDatabase().returnRequests[0]).toMatchObject({
      orderId: 'ORD-TEST-001',
      userId: 'usr-customer-01',
      reason: 'Sản phẩm không vừa',
      status: 'submitted',
      items: [
        {
          productId: 'prd-blouse-01',
          variantId: 'var-blouse-white-m',
          quantity: 1,
        },
      ],
    })
  })

  it('keeps address snapshot unchanged after the address book changes', () => {
    const database = databaseWithOrders()
    const order = database.orders[0]
    const changedAddress = { ...database.addresses[0], line1: 'Địa chỉ mới sau khi đặt hàng' }
    const nextDatabase = demoReducer(database, { type: 'address/upserted', payload: changedAddress })

    expect(order.shippingAddress.line1).toBe('72 Nguyễn Thị Minh Khai')
    expect(nextDatabase.orders[0].shippingAddress.line1).toBe('72 Nguyễn Thị Minh Khai')
  })

  it('links order success to the placed order detail', async () => {
    renderAt('/order-success/ORD-TEST-001', databaseWithOrders())

    expect(await screen.findByRole('heading', { name: 'Đặt hàng thành công' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Xem chi tiết đơn hàng' })).toHaveAttribute('href', '/orders/ORD-TEST-001')
  })
})
