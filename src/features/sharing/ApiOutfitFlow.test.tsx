import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { saveApiSession } from '@/test/communitySession'

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); sessionStorage.clear(); localStorage.clear() })
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

