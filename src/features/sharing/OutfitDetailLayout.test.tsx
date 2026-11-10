import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { saveApiSession } from '@/test/communitySession'

const id = '10000000-0000-0000-0000-000000000001'
const friendId = '20000000-0000-0000-0000-000000000002'
const item = (n: number, extra: Record<string, unknown> = {}) => ({
  outfit_item_id: `5000000${n}-0000-0000-0000-000000000000`, variant_id: `3000000${n}-0000-0000-0000-000000000000`, product_id: `4000000${n}-0000-0000-0000-000000000000`,
  product_name: n === 1 ? 'Áo sơ mi lụa cổ đức tay dài phom rộng màu kem rất dài tên' : `Sản phẩm ${n}`, color: 'Trắng', size: 'M', unit_price_vnd: 100000 * n, image_url: null, available: true, ...extra,
})
const outfit = { outfit_id: id, name: 'Bộ công sở', visibility: 'PRIVATE', items: [item(1), item(2), item(3, { available: false, unit_price_vnd: 999999 })] }

function mount(path: string, respond: (path: string) => unknown) {
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: friendId, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(url === '/api/v1/me'
    ? { account_id: friendId, email: 'me@example.test', profile: null }
    : respond(url)), { status: 200 })))
  return render(<AppProviders><RouterProvider router={createMemoryRouter(appRoutes, { initialEntries: [path] })} /></AppProviders>)
}
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); sessionStorage.clear(); localStorage.clear() })

const sharingFor = (url: string) => url.endsWith('/sharing')
  ? { outfit_id: id, visibility: 'PRIVATE', public_enabled: false, public_token: null, public_enabled_at: null }
  : outfit

it('owner detail: short actions with the product name in aria-label, 2-4 column grid, total and a way back to the wardrobe', async () => {
  mount(`/outfits/${id}`, sharingFor)
  const remove = await screen.findByRole('button', { name: /^Xóa Áo sơ mi lụa.* khỏi outfit$/ })
  expect(remove).toHaveTextContent(/^Xóa$/)
  expect(screen.getAllByRole('button', { name: /^Đổi màu\/size / })[0]).toHaveTextContent(/^Đổi màu\/size$/)
  const grid = remove.closest('article')!.parentElement!
  expect(grid.className).toContain('grid-cols-2')
  expect(grid.className).toContain('md:grid-cols-3')
  expect(grid.className).toContain('xl:grid-cols-4')
  expect(remove.closest('article')!.querySelector('div.aspect-\\[3\\/4\\], img.aspect-\\[3\\/4\\]')).not.toBeNull()
  // 100.000 + 200.000 only: the unavailable item is not counted.
  expect(screen.getByText('Tổng giá (2 món còn bán)')).toBeInTheDocument()
  expect(screen.getByText(/300\.000/)).toBeInTheDocument()
  const back = screen.getAllByRole('link', { name: 'Tủ đồ' }).filter(link => link.closest('main') !== null && link.closest('nav') === null)
  expect(back).toHaveLength(1)
  expect(back[0]).toHaveAttribute('href', '/wardrobes')
})

it('friend detail links back to the friend wardrobe and shows the total; public detail has no back link', async () => {
  const view = mount(`/shared-with-me/${id}/outfits/${id}`, () => outfit)
  expect(await screen.findByText('Tổng giá (2 món còn bán)')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Outfit bạn bè' })).toHaveAttribute('href', `/shared-with-me/${id}`)
  expect(screen.queryByRole('button', { name: /Đổi màu\/size/ })).not.toBeInTheDocument()
  view.unmount()
  mount('/shared/outfits/public-token', () => outfit)
  expect(await screen.findByText('Tổng giá (2 món còn bán)')).toBeInTheDocument()
  expect(screen.queryAllByRole('link', { name: /Tủ đồ|Outfit bạn bè/ }).filter(link => link.closest('main') !== null && link.closest('nav') === null)).toHaveLength(0)
})

it('empty wardrobe explains what to do and offers a "Tạo outfit đầu tiên" button; the pager is hidden', async () => {
  mount('/wardrobes', () => ({ items: [], page: 0, size: 20, total_elements: 0, total_pages: 0 }))
  const cta = await screen.findByRole('link', { name: 'Tạo outfit đầu tiên' })
  expect(cta).toHaveAttribute('href', '/wardrobes/new')
  expect(screen.queryByRole('button', { name: 'Trang sau' })).not.toBeInTheDocument()
  expect(screen.queryByText(/Trang 1 \/ 1/)).not.toBeInTheDocument()
})

it('hides the pager for a single page but keeps it when there are several pages', async () => {
  const entry = (n: number) => ({ outfit_id: `1000000${n}-0000-0000-0000-000000000000`, name: `Outfit ${n}`, visibility: 'PRIVATE', item_count: 2 })
  const view = mount('/wardrobes', () => ({ items: [entry(1)], page: 0, size: 20, total_elements: 1, total_pages: 1 }))
  await screen.findByText('Outfit 1')
  expect(screen.queryByText(/Trang 1 \/ 1/)).not.toBeInTheDocument()
  expect(screen.queryByText(/kết quả/)).not.toBeInTheDocument()
  view.unmount()
  mount('/wardrobes', () => ({ items: [entry(1)], page: 0, size: 1, total_elements: 2, total_pages: 2 }))
  await screen.findByText('Outfit 1')
  const pager = screen.getByText(/Trang 1 \/ 2/)
  expect(within(pager.parentElement!).getByRole('button', { name: 'Trang sau' })).toBeEnabled()
})
