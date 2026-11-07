import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { saveApiSession } from '@/test/communitySession'
import { waitFor } from '@testing-library/react'

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); sessionStorage.clear(); localStorage.clear() })
it('does not expose the retired email access controls in live mode', async () => {
  const id = '10000000-0000-0000-0000-000000000001'
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: id, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(path === '/api/v1/me' ? { account_id: id, email: 'real@example.test', profile: null } : { items: [], total_elements: 0, total_pages: 0 }), { status: 200 })))
  render(<AppProviders><RouterProvider router={createMemoryRouter(appRoutes, { initialEntries: ['/wardrobes/access'] })} /></AppProviders>)
  expect(await screen.findByText('Quyền xem được quản lý theo từng Outfit và danh sách bạn bè.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Thu hồi' })).not.toBeInTheDocument()
})
it('shows that notifications are unavailable instead of demo notifications', async () => {
  const id = '10000000-0000-0000-0000-000000000001'
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: id, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(path === '/api/v1/me' ? { account_id: id, email: 'real@example.test', profile: null } : { items: [], total_elements: 0, total_pages: 0 }), { status: 200 })))
  render(<AppProviders><RouterProvider router={createMemoryRouter(appRoutes, { initialEntries: ['/notifications'] })} /></AppProviders>)
  expect(await screen.findByText('Danh sách thông báo hiện chưa được hỗ trợ.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Đánh dấu tất cả đã đọc' })).not.toBeInTheDocument()
})
it('uses the public link endpoints to turn public sharing on and off', async () => {
  const id = '10000000-0000-0000-0000-000000000001'
  let visibility = 'PRIVATE'
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: id, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  const fetcher = vi.fn(async (path: string, options: RequestInit) => {
    if (path.endsWith('/public-link')) visibility = options.method === 'PUT' ? 'PUBLIC' : 'PRIVATE'
    const data = path === '/api/v1/me' ? { account_id: id, email: 'real@example.test', profile: null }
      : path.endsWith('/sharing') ? { outfit_id: id, visibility, public_enabled: visibility === 'PUBLIC', public_token: 'token' }
      : path.endsWith('/public-link') ? { public_token: 'token', enabled_at: '2026-11-07' }
      : { outfit_id: id, name: 'Bộ đồ', items: [], visibility }
    return new Response(JSON.stringify(data), { status: 200 })
  })
  vi.stubGlobal('fetch', fetcher)
  render(<AppProviders><RouterProvider router={createMemoryRouter(appRoutes, { initialEntries: [`/outfits/${id}`] })} /></AppProviders>)
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Chia sẻ outfit' }))
  await user.click(screen.getByRole('radio', { name: 'Công khai' }))
  await user.click(screen.getByRole('button', { name: 'Lưu chế độ' }))
  await waitFor(() => expect(fetcher.mock.calls.some(([path, opts]) => path.endsWith('/public-link') && opts.method === 'PUT')).toBe(true))
  await user.click(await screen.findByRole('button', { name: 'Chia sẻ outfit' }))
  await user.click(screen.getByRole('radio', { name: 'Riêng tư' }))
  await user.click(screen.getByRole('button', { name: 'Lưu chế độ' }))
  await waitFor(() => expect(fetcher.mock.calls.some(([path, opts]) => path.endsWith('/public-link') && opts.method === 'DELETE')).toBe(true))
})
it('lists real server outfits instead of local demo outfits', async () => {
  const id = '10000000-0000-0000-0000-000000000001'
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: id, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(path === '/api/v1/me' ? { account_id: id, email: 'real@example.test', profile: null } : { items: [{ outfit_id: id, name: 'Outfit từ server', visibility: 'PRIVATE', item_count: 1, updated_at: '2026-11-03T00:00:00Z' }], page: 0, size: 20, total_elements: 1, total_pages: 1 }), { status: 200 })))
  const router = createMemoryRouter(appRoutes, { initialEntries: ['/wardrobes'] })
  render(<AppProviders><RouterProvider router={router} /></AppProviders>)
  expect(await screen.findByText('Outfit từ server')).toBeInTheDocument()
  expect(screen.queryByText('Cafe cuoi tuan')).not.toBeInTheDocument()
})
it('keeps an unsaved sharing choice when the window regains focus', async () => {
  const id = '10000000-0000-0000-0000-000000000001'
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: id, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(path === '/api/v1/me' ? { account_id: id, email: 'real@example.test', profile: null } : path.endsWith('/sharing') ? { outfit_id: id, visibility: 'PRIVATE', public_enabled: false, public_token: null } : { outfit_id: id, name: 'Bộ đồ', items: [], visibility: 'PRIVATE' }), { status: 200 })))
  const router = createMemoryRouter(appRoutes, { initialEntries: [`/outfits/${id}`] })
  render(<AppProviders><RouterProvider router={router} /></AppProviders>)
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Chia sẻ outfit' }))
  await user.click(screen.getByRole('radio', { name: 'Bạn bè' }))
  window.dispatchEvent(new Event('focus'))
  expect(screen.getByRole('dialog', { name: 'Chia sẻ outfit' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'Bạn bè' })).toBeChecked()
})

it('does not show owner controls on a friend or public outfit', async () => {
  const id = '10000000-0000-0000-0000-000000000001'
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: id, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(path === '/api/v1/me' ? { account_id: id, email: 'real@example.test', profile: null } : { outfit_id: id, name: 'Outfit của bạn bè', items: [], visibility: 'FRIENDS' }), { status: 200 })))
  const router = createMemoryRouter(appRoutes, { initialEntries: [`/shared-with-me/${id}/outfits/${id}`] })
  render(<AppProviders><RouterProvider router={router} /></AppProviders>)
  expect(await screen.findByRole('heading', { name: 'Outfit của bạn bè' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Đổi tên' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Xóa outfit' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Thêm món' })).not.toBeInTheDocument()
})

