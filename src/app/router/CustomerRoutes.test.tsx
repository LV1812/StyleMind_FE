import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'

import { appRoutes } from './AppRouter'

function seedSession() {
  window.localStorage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify({
      ...createDemoSeed(),
      session: { userId: 'usr-customer-01', persistent: true },
    }),
  )
}

function renderRoute(initialEntry: string, authenticated = true) {
  window.localStorage.clear()
  if (authenticated) seedSession()
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] })

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}

function expectRealCustomerPage() {
  const bodyText = document.body.textContent ?? ''

  expect(bodyText).not.toMatch(/đang được hoàn thiện/i)
  expect(bodyText).not.toMatch(/demo/i)
  expect(bodyText).not.toMatch(/placeholder/i)
}

describe('customer routes', () => {
  it('routes every customer surface to a non-placeholder page', async () => {
    const entries = [
      ['/account', 'Tài khoản'],
      ['/account/addresses', 'Địa chỉ'],
      ['/orders', 'Đơn hàng'],
      ['/orders/missing-order', 'Không tìm thấy đơn hàng'],
      ['/notifications', 'Thông báo'],
      ['/wardrobes', 'Tủ đồ của tôi'],
      ['/wardrobes/access', 'Quyền truy cập'],
      ['/wardrobes/new', 'Tạo outfit thủ công'],
      ['/wardrobes/new/ai', 'AI Stylist'],
      ['/outfits/outfit-ai-cafe', 'Cafe cuoi tuan'],
      ['/shared-with-me', 'Tủ đồ được chia sẻ với tôi'],
      ['/messages', 'Tin nhắn'],
    ] as const

    for (const [path, heading] of entries) {
      document.body.innerHTML = ''
      renderRoute(path)

      expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
      expectRealCustomerPage()
    }
  })

  it('keeps public outfit route accessible without auth', async () => {
    renderRoute('/shared/outfits/pub-cafe-cuoi-tuan', false)

    expect(await screen.findByRole('heading', { name: 'Cafe cuoi tuan' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Đăng nhập' })).not.toBeInTheDocument()
    expectRealCustomerPage()
  })

  it('shows customer navigation to wardrobe, orders, notifications, account and cart', async () => {
    renderRoute('/')

    const header = await screen.findByRole('banner')

    expect(within(header).getByRole('link', { name: 'Tủ đồ' })).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: 'Đơn hàng' })).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: /Thông báo/ })).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: 'Tin nhắn' })).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: 'Tài khoản' })).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: /Giỏ hàng/ })).toBeInTheDocument()
  })
})
