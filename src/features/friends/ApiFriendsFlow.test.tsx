import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { saveApiSession } from '@/test/communitySession'

const actor = '10000000-0000-0000-0000-000000000001', peer = '20000000-0000-0000-0000-000000000002', invitation = '30000000-0000-0000-0000-000000000003'
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })
const page = (items: unknown[]) => ({ items, page: 0, size: 20, total_elements: items.length, total_pages: items.length ? 1 : 0 })
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); vi.stubEnv('VITE_COMMUNITY_MODE', 'api'); saveApiSession(`e30.${btoa(JSON.stringify({ sub: actor, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000) })
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })
function renderFriends() { const router = createMemoryRouter(appRoutes, { initialEntries: ['/friends'] }); render(<AppProviders><RouterProvider router={router} /></AppProviders>) }
describe('Friends real API controls', () => {
  it('accepts only after the user clicks and never creates a local demo friendship', async () => {
    let accepted = false
    const fetcher = vi.fn(async (path: string, options: RequestInit) => {
      if (path === '/api/v1/me') return response({ account_id: actor, email: 'real@example.test', profile: null })
      if (path.endsWith('/accept')) { expect(options.method).toBe('POST'); accepted = true; return response({ status: 'ACCEPTED', outcome: 'INVITATION_ACCEPTED', delivery_status: 'SMTP_ACCEPTED', retry_after_seconds: 0 }) }
      if (path.includes('/incoming?')) return response(page(accepted ? [] : [{ friend_invitation_id: invitation, sender_account_id: peer, sender_display_name: 'Bạn trên server', created_at: '2026-10-30', expires_at: '2026-11-07' }]))
      return response(page([]))
    }); vi.stubGlobal('fetch', fetcher); renderFriends(); const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Đã nhận/ }))
    expect(await screen.findByText('Bạn trên server')).toBeInTheDocument()
    expect(accepted).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Chấp nhận' }))
    await waitFor(() => expect(accepted).toBe(true))
    expect(JSON.parse(localStorage.getItem('stylemind.demo.database')!).friendships).toEqual([])
  })
  it('shows server send failures, prevents repeated submission and never says delivery succeeded', async () => {
    const fetcher = vi.fn(async (path: string, options: RequestInit) => {
      if (path === '/api/v1/me') return response({ account_id: actor, email: 'real@example.test', profile: null })
      if (options.method === 'POST') return response({ code: 'EMAIL_DELIVERY_UNKNOWN', friend_invitation_id: invitation, retry_after_seconds: 30 }, 504)
      return response(page([]))
    }); vi.stubGlobal('fetch', fetcher); renderFriends(); const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Mời bạn bè' }))
    await user.type(screen.getByLabelText('Email người nhận'), 'peer@example.test')
    await user.click(screen.getByRole('button', { name: 'Gửi lời mời' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Chưa xác định/)
    expect(screen.queryByText(/Máy chủ email đã tiếp nhận/)).not.toBeInTheDocument()
    expect(fetcher.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(1)
  })
})


