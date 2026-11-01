import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import type { DemoDatabase } from '@/app/store/types'
import type { AddressSnapshot } from '@/entities/address/model/types'
import type { Order } from '@/entities/order/model/types'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'

function addressSnapshot(database: DemoDatabase): AddressSnapshot {
  const address = database.addresses[0]
  const { userId: _userId, isDefault: _isDefault, ...snapshot } = address
  return snapshot
}

function orderFixture(database: DemoDatabase): Order {
  const product = database.products[0]
  const variant = product.variants[0]
  const image = variant.images[0]

  return {
    id: 'ORD-NOTI-001',
    userId: 'usr-customer-01',
    status: 'confirmed',
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
    createdAt: '2026-09-27T09:00:00.000Z',
    timeline: [{ id: 'timeline-confirmed', label: 'Đã xác nhận đơn hàng', at: '2026-09-27T09:30:00.000Z' }],
  }
}

function databaseWithNotifications(): DemoDatabase {
  const database = createDemoSeed()

  return {
    ...database,
    session: { userId: 'usr-customer-01', persistent: true },
    orders: [orderFixture(database)],
    notifications: [
      {
        id: 'noti-order-confirmed',
        userId: 'usr-customer-01',
        type: 'order',
        title: 'Đơn hàng đã xác nhận',
        body: 'Đơn ORD-NOTI-001 đã được xác nhận.',
        read: false,
        createdAt: '2026-09-27T09:35:00.000Z',
        link: '/orders/ORD-NOTI-001',
      },
      {
        id: 'noti-share-ready',
        userId: 'usr-customer-01',
        type: 'share',
        title: 'Outfit đã bật chia sẻ',
        body: 'Public link của outfit đang hoạt động.',
        read: false,
        createdAt: '2026-09-27T09:20:00.000Z',
        link: '/outfits/outfit-ai-cafe',
      },
    ],
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

function renderAt(initialEntry: string, database = databaseWithNotifications()) {
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

describe('Notifications flow', () => {
  it('marks one notification as read and updates the header unread count', async () => {
    const user = userEvent.setup()
    renderAt('/notifications')

    expect(await screen.findByRole('link', { name: 'Thông báo (2 chưa đọc)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Đánh dấu đã đọc Đơn hàng đã xác nhận' }))

    expect(await screen.findByRole('link', { name: 'Thông báo (1 chưa đọc)' })).toBeInTheDocument()
    await waitFor(() => expect(getDatabase().notifications.find(item => item.id === 'noti-order-confirmed')?.read).toBe(true))
  })

  it('marks all notifications as read', async () => {
    const user = userEvent.setup()
    renderAt('/notifications')

    await user.click(await screen.findByRole('button', { name: 'Đánh dấu tất cả đã đọc' }))

    expect(await screen.findByRole('link', { name: 'Thông báo (0 chưa đọc)' })).toBeInTheDocument()
    await waitFor(() => expect(getDatabase().notifications.every(item => item.read)).toBe(true))
  })

  it('follows a notification link to its destination', async () => {
    const user = userEvent.setup()
    const router = renderAt('/notifications')

    await user.click(await screen.findByRole('link', { name: 'Mở Đơn hàng đã xác nhận' }))

    expect(router.state.location.pathname).toBe('/orders/ORD-NOTI-001')
    expect(await screen.findByRole('heading', { name: 'Đơn ORD-NOTI-001' })).toBeInTheDocument()
  })
})
