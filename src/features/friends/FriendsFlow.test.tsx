import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { createDemoSeed } from '@/app/data/demoSeed'
import { DemoStoreProvider, useDemoStore } from '@/app/store/DemoStoreProvider'
import { ToastProvider } from '@/shared/ui'
import { appRoutes } from '@/app/router/AppRouter'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'
import type { DemoDatabase } from '@/app/store/types'

vi.mock('@/features/auth', async importOriginal => ({
  ...await importOriginal<typeof import('@/features/auth')>(),
  LoginPage: () => <h1>Đăng nhập</h1>,
  useAuth: () => {
    const { state } = useDemoStore()
    return { currentUser: state.users.find(user => user.id === state.session?.userId) ?? null, isInitializing: false, logout: vi.fn() }
  },
}))

function setup(authenticated = true, overrides: Partial<DemoDatabase> = {}) {
  window.localStorage.clear()
  const seed = createDemoSeed(), now = Date.now()
  seed.friendInvitations = [{ ...seed.friendInvitations[0], createdAt: now, lastAttemptAt: now, expiresAt: now + 7 * 86400000 }]
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ ...seed, session: authenticated ? { userId: 'usr-customer-01', persistent: true } : null, ...overrides }))
  const router = createMemoryRouter(appRoutes, { initialEntries: ['/friends'] })
  render(<DemoStoreProvider><ToastProvider><RouterProvider router={router} /></ToastProvider></DemoStoreProvider>)
  return router
}
describe('Friends route', () => {
  it('does not announce a renewed invitation when retry is rejected', async () => {
    const user = userEvent.setup(), seed = createDemoSeed(), now = Date.now()
    setup(true, { users: seed.users.map(u => u.id === 'usr-friend-01' ? { ...u, status: 'locked' } : u), friendInvitations: [{ id: 'old-out', senderId: 'usr-customer-01', recipientEmail: 'friend@stylemind.vn', status: 'PENDING', delivery: 'SENT', createdAt: now - 9 * 86400000, lastAttemptAt: now - 60000, expiresAt: now - 1 }] })
    await user.click(await screen.findByRole('button', { name: /Đã gửi/ }))
    await user.click(screen.getByRole('button', { name: 'Gửi lại' }))
    expect(await screen.findByText(/Tài khoản này không thể nhận lời mời/)).toBeInTheDocument()
    expect(screen.queryByText(/Đã làm mới lời mời/)).not.toBeInTheDocument()
  })
  it('requires sign-in and preserves the intended route', async () => {
    const router = setup(false)
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(router.state.location.state.from.pathname).toBe('/friends')
  })
  it('accepts an invitation then removes the friend only after confirmation', async () => {
    const user = userEvent.setup(); setup()
    expect(await screen.findByRole('heading', { name: 'Bạn bè' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Đã nhận/ }))
    await user.click(screen.getByRole('button', { name: 'Chấp nhận' }))
    await user.click(screen.getByRole('button', { name: /Bạn bè \(/ }))
    expect(screen.getByRole('heading', { name: 'Lê Mai' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hủy kết bạn với Lê Mai' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Giữ bạn bè' }))
    expect(screen.getByRole('heading', { name: 'Lê Mai' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hủy kết bạn với Lê Mai' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Hủy kết bạn' }))
    expect(screen.queryByRole('heading', { name: 'Lê Mai' })).not.toBeInTheDocument()
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY)!).friendships[0].active).toBe(false))
  })
  it('adds one normalized outgoing invitation and shows validation for duplicates', async () => {
    const user = userEvent.setup(); setup()
    await user.click(await screen.findByRole('button', { name: 'Mời bạn bè' }))
    await user.type(screen.getByLabelText('Email người nhận'), 'new@example.test')
    await user.click(screen.getByRole('button', { name: 'Thêm lời mời' }))
    await user.click(screen.getByRole('button', { name: 'Mời bạn bè' }))
    await user.type(screen.getByLabelText('Email người nhận'), 'new@example.test')
    await user.click(screen.getByRole('button', { name: 'Thêm lời mời' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/đã có lời mời/i)
    expect(JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY)!).friendInvitations.filter((i: { recipientEmail: string }) => i.recipientEmail === 'new@example.test')).toHaveLength(1)
  })
})
