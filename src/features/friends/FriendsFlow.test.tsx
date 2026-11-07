import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { saveApiSession } from '@/test/communitySession'

const actor = '10000000-0000-0000-0000-000000000001'
const peer = '20000000-0000-0000-0000-000000000002'
const invitation = '30000000-0000-0000-0000-000000000003'
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })
const page = (items: unknown[]) => ({ items, page: 0, size: 20, total_elements: items.length, total_pages: items.length ? 1 : 0 })

beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); sessionStorage.clear() })
function renderFriends(authenticated = true) {
  if (authenticated) saveApiSession(`e30.${btoa(JSON.stringify({ sub: actor, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  const router = createMemoryRouter(appRoutes, { initialEntries: ['/friends'] })
  render(<AppProviders><RouterProvider router={router} /></AppProviders>)
  return router
}

describe('Friends route with API', () => {
  it('requires sign-in and preserves the intended route', async () => {
    const router = renderFriends(false)
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(router.state.location.state.from.pathname).toBe('/friends')
  })

  it('only removes a friend after confirmation', async () => {
    let removed = false
    const fetcher = vi.fn(async (path: string, options: RequestInit) => {
      if (path === '/api/v1/me') return response({ account_id: actor, email: 'real@example.test', profile: null })
      if (options.method === 'DELETE') { removed = true; return new Response(null, { status: 204 }) }
      if (path.includes('/me/friends?')) return response(page(removed ? [] : [{ friendship_id: invitation, friend_account_id: peer, email: 'friend@example.test', display_name: 'Bạn An' }]))
      return response(page([]))
    })
    vi.stubGlobal('fetch', fetcher)
    renderFriends()
    const user = userEvent.setup()
    expect(await screen.findByText('friend@example.test (Bạn An)')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hủy kết bạn' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Giữ bạn bè' }))
    expect(removed).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Hủy kết bạn' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Hủy kết bạn' }))
    await waitFor(() => expect(removed).toBe(true))
    await waitFor(() => expect(screen.queryByText('friend@example.test (Bạn An)')).not.toBeInTheDocument())
    expect(fetcher.mock.calls.filter(([, options]) => options.method === 'DELETE')).toHaveLength(1)
  })

  it('sends a normalized email and displays a duplicate rejection', async () => {
    const fetcher = vi.fn(async (path: string, options: RequestInit) => {
      if (path === '/api/v1/me') return response({ account_id: actor, email: 'real@example.test', profile: null })
      if (options.method === 'POST') return response({ code: 'INVITATION_ALREADY_PENDING', detail: 'Lời mời đã tồn tại.' }, 409)
      return response(page([]))
    })
    vi.stubGlobal('fetch', fetcher)
    renderFriends()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Mời bạn bè' }))
    await user.type(screen.getByLabelText('Email người nhận'), 'Friend@Example.Test')
    await user.click(screen.getByRole('button', { name: 'Gửi lời mời' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    const request = fetcher.mock.calls.find(([, options]) => options.method === 'POST')
    expect(JSON.parse(String(request?.[1].body))).toEqual({ recipient_email: 'friend@example.test' })
    expect(screen.queryByText(/Máy chủ email đã tiếp nhận/)).not.toBeInTheDocument()
  })

  it('does not claim success if resending is rejected', async () => {
    const fetcher = vi.fn(async (path: string, options: RequestInit) => {
      if (path === '/api/v1/me') return response({ account_id: actor, email: 'real@example.test', profile: null })
      if (path.endsWith('/resend')) return response({ code: 'EMAIL_DELIVERY_FAILED', detail: 'Gửi email không thành công.' }, 503)
      if (path.includes('/me/friend-invitations?')) return response(page([{ friend_invitation_id: invitation, recipient_email: 'friend@example.test', status: 'EXPIRED', expires_at: '2026-01-01' }]))
      return response(page([]))
    })
    vi.stubGlobal('fetch', fetcher)
    renderFriends()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Đã gửi/ }))
    await user.click(await screen.findByRole('button', { name: 'Gửi lại' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText(/Máy chủ email đã tiếp nhận/)).not.toBeInTheDocument()
  })
})
