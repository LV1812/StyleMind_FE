import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import type { DemoDatabase } from '@/app/store/types'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'

function databaseWithCustomer(overrides: Partial<DemoDatabase> = {}): DemoDatabase {
  return {
    ...createDemoSeed(),
    session: { userId: 'usr-customer-01', persistent: true },
    ...overrides,
  }
}

function persistDatabase(database: DemoDatabase) {
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(database))
}

function getDatabase() {
  const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
  if (!raw) throw new Error('Expected database in localStorage')
  return JSON.parse(raw) as DemoDatabase
}

function renderAt(initialEntry: string, database = databaseWithCustomer()) {
  window.localStorage.clear()
  persistDatabase(database)
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] })

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}

describe('Account flow', () => {
  it('updates profile and body info without storing style preferences', async () => {
    const user = userEvent.setup()
    renderAt('/account')

    await user.clear(screen.getByLabelText('Họ tên'))
    await user.type(screen.getByLabelText('Họ tên'), 'Lê Hà My')
    await user.clear(screen.getByLabelText('Số điện thoại'))
    await user.type(screen.getByLabelText('Số điện thoại'), '0909123456')
    await user.clear(screen.getByLabelText('Chiều cao (cm)'))
    await user.type(screen.getByLabelText('Chiều cao (cm)'), '165')
    await user.clear(screen.getByLabelText('Cân nặng (kg)'))
    await user.type(screen.getByLabelText('Cân nặng (kg)'), '49')
    await user.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))

    expect(await screen.findByText('Đã cập nhật tài khoản')).toBeInTheDocument()
    await waitFor(() => expect(getDatabase().users.find(item => item.id === 'usr-customer-01')?.fullName).toBe('Lê Hà My'))

    const updatedUser = getDatabase().users.find(item => item.id === 'usr-customer-01')
    expect(updatedUser).toMatchObject({
      fullName: 'Lê Hà My',
      phone: '0909123456',
      heightCm: 165,
      weightKg: 49,
    })
    expect(updatedUser && 'stylePreference' in updatedUser).toBe(false)
  })

  it('adds edits deletes and sets a default address', async () => {
    const user = userEvent.setup()
    renderAt('/account/addresses')

    await user.click(screen.getByRole('button', { name: 'Thêm địa chỉ' }))
    await user.type(screen.getByLabelText('Tên người nhận'), 'Lê Hà My')
    await user.type(screen.getByLabelText('Số điện thoại'), '0909000000')
    await user.type(screen.getByLabelText('Địa chỉ'), 'Căn hộ Studio')
    await user.type(screen.getByLabelText('Phường/Xã'), 'Phường 2')
    await user.type(screen.getByLabelText('Quận/Huyện'), 'Quận 10')
    await user.type(screen.getByLabelText('Tỉnh/Thành'), 'TP. Hồ Chí Minh')
    await user.click(screen.getByRole('button', { name: 'Lưu địa chỉ' }))

    expect(await screen.findByText(/Căn hộ Studio/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sửa địa chỉ Căn hộ Studio' }))
    await user.clear(screen.getByLabelText('Địa chỉ'))
    await user.type(screen.getByLabelText('Địa chỉ'), 'Căn hộ Studio B')
    await user.click(screen.getByRole('button', { name: 'Lưu địa chỉ' }))

    expect(await screen.findByText(/Căn hộ Studio B/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Đặt mặc định Căn hộ Studio B' }))
    await user.click(screen.getByRole('button', { name: 'Xóa địa chỉ 18 Lê Thánh Tôn' }))

    await waitFor(() => {
      const database = getDatabase()
      expect(database.addresses.some(address => address.line1 === '18 Lê Thánh Tôn')).toBe(false)
      expect(database.addresses.find(address => address.line1 === 'Căn hộ Studio B')?.isDefault).toBe(true)
    })

    const defaultBadgeCard = screen.getByText(/Căn hộ Studio B/).closest('article')
    expect(defaultBadgeCard).not.toBeNull()
    expect(within(defaultBadgeCard as HTMLElement).getByText('Mặc định')).toBeInTheDocument()
  })

  it('does not allow deleting the last address without showing a checkout-safe empty state', async () => {
    const user = userEvent.setup()
    const database = databaseWithCustomer({
      addresses: createDemoSeed().addresses.filter(address => address.id === 'adr-customer-home'),
    })
    renderAt('/account/addresses', database)

    await user.click(screen.getByRole('button', { name: 'Xóa địa chỉ 72 Nguyễn Thị Minh Khai' }))

    expect(await screen.findByText('Cần ít nhất một địa chỉ để thanh toán.')).toBeInTheDocument()
    expect(getDatabase().addresses).toHaveLength(1)
  })
})
