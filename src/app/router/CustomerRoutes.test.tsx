import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'
import { communityApi, type OutfitDetailDto } from '@/shared/api/communityApi'

import { appRoutes } from './AppRouter'

const outfitId = '10000000-0000-0000-0000-000000000001'
const outfit = { outfit_id: outfitId, name: 'Outfit từ API', items: [], visibility: 'PUBLIC' } as OutfitDetailDto
afterEach(() => vi.restoreAllMocks())

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
    vi.spyOn(communityApi, 'outfit').mockResolvedValue(outfit)
    vi.spyOn(communityApi, 'sharing').mockResolvedValue({ outfit_id: outfitId, visibility: 'PRIVATE', public_enabled: false, public_token: null, public_enabled_at: null })
    const entries = [
      ['/account', 'Tài khoản'],
      ['/account/addresses', 'Địa chỉ giao hàng'],
      ['/orders', 'Đơn hàng'],
      ['/orders/missing-order', 'Thanh toán đơn hàng'],
      ['/notifications', 'Thông báo'],
      ['/wardrobes', 'Tủ đồ của tôi'],
      ['/wardrobes/access', 'Quyền truy cập'],
      ['/wardrobes/new', 'Tạo outfit thủ công'],
      ['/wardrobes/new/ai', 'AI Stylist'],
      [`/outfits/${outfitId}`, 'Outfit từ API'],
      ['/shared-with-me', 'Outfit bạn bè'],
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
    const lookup = vi.spyOn(communityApi, 'publicOutfit').mockResolvedValue(outfit)
    renderRoute('/shared/outfits/pub-cafe-cuoi-tuan', false)

    expect(await screen.findByRole('heading', { name: 'Outfit từ API' })).toBeInTheDocument()
    expect(lookup).toHaveBeenCalledWith('pub-cafe-cuoi-tuan', expect.any(AbortSignal))
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
