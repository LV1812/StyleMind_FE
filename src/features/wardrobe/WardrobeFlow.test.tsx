import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { saveApiSession } from '@/test/communitySession'

const owner = '10000000-0000-0000-0000-000000000001'
const outfitId = '20000000-0000-0000-0000-000000000002'
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })
const page = (items: unknown[]) => ({ items, page: 0, size: 20, total_elements: items.length, total_pages: items.length ? 1 : 0 })
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); sessionStorage.clear() })

function setup(path: string, api: (path: string) => Response) {
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: owner, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url === '/api/v1/me' ? response({ account_id: owner, email: 'real@example.test', profile: null }) : api(String(url))))
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  render(<AppProviders><RouterProvider router={router} /></AppProviders>)
  return router
}

it('lists owner outfits from the API and links to creation', async () => {
  setup('/wardrobes', url => url.includes('/me/outfits?') ? response(page([{ outfit_id: outfitId, name: 'Bộ đi làm', visibility: 'PRIVATE', item_count: 1 }])) : response(page([])))
  expect(await screen.findByRole('link', { name: /Bộ đi làm/ })).toHaveAttribute('href', `/outfits/${outfitId}`)
  expect(screen.getByRole('link', { name: 'Tạo Outfit' })).toHaveAttribute('href', '/wardrobes/new')
  expect(screen.queryByRole('button', { name: 'Chia sẻ tủ đồ' })).not.toBeInTheDocument()
})

it('shows a permission error without exposing a private outfit', async () => {
  setup(`/shared-with-me/${owner}/outfits/${outfitId}`, url => url.includes('/outfits/') ? response({ code: 'FORBIDDEN' }, 403) : response(page([])))
  expect(await screen.findByRole('alert')).toHaveTextContent('chưa có quyền')
  expect(screen.queryByRole('button', { name: 'Đổi tên' })).not.toBeInTheDocument()
})

it('shows unavailable outfit items without a purchasable action for them', async () => {
  setup(`/outfits/${outfitId}`, url => url.endsWith('/sharing')
    ? response({ outfit_id: outfitId, visibility: 'PRIVATE', public_enabled: false, public_token: null, public_enabled_at: null })
    : url.includes('/me/outfits/') ? response({ outfit_id: outfitId, name: 'Bộ cá nhân', visibility: 'PRIVATE', items: [{ outfit_item_id: 'item', variant_id: 'variant', product_id: null, product_name: null, color: null, size: null, unit_price_vnd: null, image_url: null, available: false }] })
    : response(page([])))
  expect((await screen.findAllByText('Sản phẩm không còn khả dụng')).length).toBeGreaterThan(0)
  expect(screen.getByRole('button', { name: 'Thêm Outfit vào giỏ' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Thêm món này vào giỏ' })).toBeDisabled()
})
