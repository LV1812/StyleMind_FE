import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { saveApiSession } from '@/test/communitySession'
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); sessionStorage.clear(); localStorage.clear() })
function connectSocket() {
  class Socket {
    onopen: (() => void) | null = null; onmessage: ((event: { data: string }) => void) | null = null; onclose: (() => void) | null = null; onerror: (() => void) | null = null
    constructor() { queueMicrotask(() => this.onopen?.()) }
    send(data: string) { if (data.startsWith('CONNECT')) queueMicrotask(() => this.onmessage?.({ data: 'CONNECTED\nversion:1.2\n\n\u0000' })) }
    close() { this.onclose?.() }
  }
  vi.stubGlobal('WebSocket', Socket)
}
it('offers a way to open Friends without showing a misleading connection status when there are no chats', async () => {
  const actor = '10000000-0000-0000-0000-000000000001'
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: actor, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(path === '/api/v1/me'
    ? { account_id: actor, email: 'real@example.test', profile: null }
    : { items: [], page: 0, size: 20, total_elements: 0, total_pages: 0 }), { status: 200 })))
  render(<AppProviders><RouterProvider router={createMemoryRouter(appRoutes, { initialEntries: ['/messages'] })} /></AppProviders>)
  expect(await screen.findByRole('link', { name: 'Đi đến Bạn bè' })).toHaveAttribute('href', '/friends')
  expect(screen.queryByText(/Đang kết nối/)).not.toBeInTheDocument()
})
it('places the current user messages on the right and friend messages on the left', async () => {
  const actor = '10000000-0000-0000-0000-000000000001', peer = '30000000-0000-0000-0000-000000000003', chat = '20000000-0000-0000-0000-000000000002'
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  connectSocket()
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: actor, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  vi.stubGlobal('fetch', vi.fn(async (path: string) => {
    const page = { items: [], page: 0, size: 20, total_elements: 0, total_pages: 0 }
    const body = path === '/api/v1/me' ? { account_id: actor, email: 'real@example.test', profile: null }
      : path.includes('/me/chats?') ? { ...page, items: [{ chat_session_id: chat, friend_account_id: peer }], total_elements: 1, total_pages: 1 }
      : path.includes('/messages?') ? { items: [
        { chat_message_id: 'a', sender_account_id: actor, sequence_number: 1, content: 'Tin của tôi', attachments: [] },
        { chat_message_id: 'b', sender_account_id: peer, sequence_number: 2, content: 'Tin của bạn bè', attachments: [] },
      ], has_more: false, next_before_sequence: null } : page
    return new Response(JSON.stringify(body), { status: 200 })
  }))
  render(<AppProviders><RouterProvider router={createMemoryRouter(appRoutes, { initialEntries: ['/messages'] })} /></AppProviders>)
  expect((await screen.findByLabelText('Tin nhắn của bạn')).parentElement).toHaveClass('justify-end')
  expect(screen.getByLabelText('Tin nhắn của bạn bè').parentElement).toHaveClass('justify-start')
})
it('loads a server conversation and submits the entered text', async () => {
  const actor = '10000000-0000-0000-0000-000000000001', chat = '20000000-0000-0000-0000-000000000002'
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  connectSocket()
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: actor, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  const fetcher = vi.fn(async (path: string, options: RequestInit) => {
    const body = path === '/api/v1/me' ? { account_id: actor, email: 'real@example.test', profile: null } : options.method === 'POST' ? { chat_message_id: actor } : path.includes('/me/chats?') ? { items: [{ chat_session_id: chat, friend_account_id: actor, created_at: '2026-11-03', updated_at: '2026-11-03' }], page: 0, size: 20, total_elements: 1, total_pages: 1 } : { items: [], has_more: false, next_before_sequence: null }
    return new Response(JSON.stringify(body), { status: 200 })
  }); vi.stubGlobal('fetch', fetcher)
  const router = createMemoryRouter(appRoutes, { initialEntries: ['/messages'] })
  render(<AppProviders><RouterProvider router={router} /></AppProviders>)
  const user = userEvent.setup()
  await user.type(await screen.findByRole('textbox', { name: 'Tin nhắn' }), 'Xin chào')
  expect(screen.getByRole('textbox', { name: 'Tin nhắn' })).toHaveValue('Xin chào')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gửi' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: 'Gửi' }))
  await waitFor(() => expect(fetcher.mock.calls.filter(([, options]) => options.method === 'POST').map(([path, options]) => ({ path, content: JSON.parse(options.body as string).content }))).toEqual([{ path: `/wardrobe-community/api/v1/chats/${chat}/messages`, content: 'Xin chào' }]))
})
it('hides the composer when chat history is no longer accessible', async () => {
  const actor = '10000000-0000-0000-0000-000000000001', chat = '20000000-0000-0000-0000-000000000002'
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: actor, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  vi.stubGlobal('fetch', vi.fn(async (path: string) => {
    const body = path === '/api/v1/me' ? { account_id: actor, email: 'real@example.test', profile: null } : path.includes('/me/chats?') ? { items: [{ chat_session_id: chat, friend_account_id: actor, created_at: '2026-11-03', updated_at: '2026-11-03' }], page: 0, size: 20, total_elements: 1, total_pages: 1 } : path.includes('/cart') ? { items: [] } : { code: 'RESOURCE_NOT_FOUND' }
    return new Response(JSON.stringify(body), { status: path.includes('/messages?') ? 404 : 200 })
  }))
  render(<AppProviders><RouterProvider router={createMemoryRouter(appRoutes, { initialEntries: ['/messages'] })} /></AppProviders>)
  expect(await screen.findByRole('alert')).toHaveTextContent(/không có quyền/i)
  expect(screen.queryByRole('textbox', { name: 'Tin nhắn' })).not.toBeInTheDocument()
})
it('keeps a draft and blocks sending when realtime is disconnected', async () => {
  const actor = '10000000-0000-0000-0000-000000000001', chat = '20000000-0000-0000-0000-000000000002'
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: actor, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  class OfflineSocket { onopen = null; onmessage = null; onclose = null; onerror = null; close() {} }
  vi.stubGlobal('WebSocket', OfflineSocket)
  vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(path === '/api/v1/me' ? { account_id: actor, email: 'real@example.test', profile: null } : path.includes('/me/chats?') ? { items: [{ chat_session_id: chat, friend_account_id: actor }], page: 0, size: 20, total_elements: 1, total_pages: 1 } : { items: [], has_more: false, next_before_sequence: null }), { status: 200 })))
  render(<AppProviders><RouterProvider router={createMemoryRouter(appRoutes, { initialEntries: ['/messages'] })} /></AppProviders>)
  await userEvent.setup().type(await screen.findByRole('textbox', { name: 'Tin nhắn' }), 'Bản nháp')
  expect(screen.getByRole('textbox', { name: 'Tin nhắn' })).toHaveValue('Bản nháp')
  expect(screen.getByRole('button', { name: 'Gửi' })).toBeDisabled()
})

