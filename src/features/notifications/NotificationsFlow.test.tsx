import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'
import { ToastProvider } from '@/shared/ui'
import { AdminNotificationsUnavailable } from '@/features/admin/components/AdminNotificationsUnavailable'

function renderCustomerNotifications() {
  const seed = createDemoSeed()
  const stored = { ...seed, session: { userId: 'usr-customer-01', persistent: true } }
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(stored))
  const router = createMemoryRouter(appRoutes, { initialEntries: ['/notifications'] })
  render(<AppProviders><RouterProvider router={router} /></AppProviders>)
  return { router, stored }
}

afterEach(() => { localStorage.clear(); sessionStorage.clear(); vi.restoreAllMocks() })

describe('Notifications with the current backend', () => {
  it('does not present demo notifications or a fabricated unread count', async () => {
    const { stored } = renderCustomerNotifications()
    expect(await screen.findByText('Thông báo trong ứng dụng hiện chưa được hỗ trợ.')).toBeInTheDocument()
    const header = screen.getByRole('banner')
    expect(within(header).getByRole('link', { name: 'Thông báo' })).toBeInTheDocument()
    expect(stored.notifications.length).toBeGreaterThan(0)
    for (const notification of stored.notifications) expect(screen.queryByText(notification.title)).not.toBeInTheDocument()
  })

  it('shows unsupported feedback without changing stored notifications', async () => {
    const user = userEvent.setup()
    const { stored } = renderCustomerNotifications()
    await user.click(await screen.findByRole('button', { name: 'Đánh dấu tất cả đã đọc' }))
    expect(screen.getAllByText('Chức năng chưa hỗ trợ.').length).toBeGreaterThan(1)
    const after = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY)!)
    expect(after.notifications).toEqual(stored.notifications)
    expect(screen.queryByText(/Đã đánh dấu tất cả/)).not.toBeInTheDocument()
  })

  it.each(['Tất cả', 'Chưa đọc', 'Đã đọc'])('does not simulate the customer filter %s', async label => {
    const user = userEvent.setup()
    const { stored } = renderCustomerNotifications()
    await user.click(await screen.findByRole('button', { name: label }))
    expect(screen.getAllByText('Chức năng chưa hỗ trợ.').length).toBeGreaterThan(1)
    expect(JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY)!).notifications).toEqual(stored.notifications)
  })

  it('shows unsupported feedback for admin notification actions', async () => {
    const user = userEvent.setup()
    render(<ToastProvider><AdminNotificationsUnavailable /></ToastProvider>)
    expect(screen.getByText('Danh sách thông báo chưa được hỗ trợ.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Làm mới' }))
    expect(await screen.findByText('Chức năng chưa hỗ trợ.')).toBeInTheDocument()
  })

  it.each(['Tất cả', 'Đã gửi', 'Chờ gửi', 'Thất bại'])('reports unsupported admin filter %s', async label => {
    const user = userEvent.setup()
    render(<ToastProvider><AdminNotificationsUnavailable /></ToastProvider>)
    await user.click(screen.getByRole('button', { name: label }))
    expect(await screen.findByText('Chức năng chưa hỗ trợ.')).toBeInTheDocument()
  })
})
