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

    const nameInput = await screen.findByDisplayValue('Nguyễn Thiên An')
    await user.clear(nameInput)
    await user.type(screen.getByLabelText('Tên hiển thị'), 'Lê Hà My')
    await user.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }))

    expect(await screen.findByText('Đã cập nhật hồ sơ cá nhân.')).toBeInTheDocument()
    await waitFor(() => expect(getDatabase().users.find(item => item.id === 'usr-customer-01')?.fullName).toBe('Lê Hà My'))

    await user.clear(screen.getByLabelText('Chiều cao (cm)'))
    await user.type(screen.getByLabelText('Chiều cao (cm)'), '165')
    await user.clear(screen.getByLabelText('Cân nặng (kg)'))
    await user.type(screen.getByLabelText('Cân nặng (kg)'), '49')
    await user.click(screen.getByRole('button', { name: 'Lưu thông tin phong cách' }))

    expect(await screen.findByText('Đã cập nhật thông tin vóc dáng và phong cách.')).toBeInTheDocument()
    await waitFor(() => expect(getDatabase().users.find(item => item.id === 'usr-customer-01')?.fullName).toBe('Lê Hà My'))

    const updatedUser = getDatabase().users.find(item => item.id === 'usr-customer-01')
    expect(updatedUser).toMatchObject({
      fullName: 'Lê Hà My',
      heightCm: 165,
      weightKg: 49,
    })
    expect(updatedUser && 'stylePreference' in updatedUser).toBe(false)
  })

  it('adds edits deletes and sets a default address', async () => {
    const user = userEvent.setup()
    renderAt('/account/addresses')

    await user.click(await screen.findByRole('button', { name: 'Thêm địa chỉ' }))
    await user.type(screen.getByLabelText('Tên người nhận'), 'Lê Hà My')
    await user.type(screen.getByLabelText('Số điện thoại Việt Nam'), '0909000000')
    await user.type(screen.getByLabelText(/Địa chỉ \(số nhà/), 'Căn hộ Studio')
    await user.click(screen.getByRole('button', { name: 'Lưu địa chỉ' }))

    expect(await screen.findByText(/Căn hộ Studio/)).toBeInTheDocument()

    const createdAddress = screen.getByText(/Căn hộ Studio/).closest('article') as HTMLElement
    await user.click(within(createdAddress).getByRole('button', { name: /Sửa địa chỉ/ }))
    await user.clear(screen.getByLabelText(/Địa chỉ \(số nhà/))
    await user.type(screen.getByLabelText(/Địa chỉ \(số nhà/), 'Căn hộ Studio B')
    await user.click(screen.getByRole('button', { name: 'Lưu địa chỉ' }))

    expect(await screen.findByText(/Căn hộ Studio B/)).toBeInTheDocument()

    const updatedAddress = screen.getByText(/Căn hộ Studio B/).closest('article') as HTMLElement
    await user.click(within(updatedAddress).getByRole('button', { name: /Đặt mặc định/ }))
    await user.click(screen.getByRole('button', { name: /Xóa địa chỉ .*18 Lê Thánh Tôn/ }))
    await user.click(within(screen.getByRole('dialog', { name: 'Xóa địa chỉ' })).getByRole('button', { name: 'Xác nhận xóa' }))

    expect(await screen.findByText(/Đã xóa địa chỉ/)).toBeInTheDocument()

    const defaultBadgeCard = screen.getByText(/Căn hộ Studio B/).closest('article')
    expect(defaultBadgeCard).not.toBeNull()
    expect(within(defaultBadgeCard as HTMLElement).getByText('Mặc định')).toBeInTheDocument()
  })

  it('allows deleting the only address and displays the empty state returned by Identity', async () => {
    const user = userEvent.setup()
    const database = databaseWithCustomer({
      addresses: createDemoSeed().addresses.filter(address => address.id === 'adr-customer-home'),
    })
    renderAt('/account/addresses', database)

    await user.click(await screen.findByRole('button', { name: /Xóa địa chỉ .*72 Nguyễn Thị Minh Khai/ }))
    const dialog = screen.getByRole('dialog', { name: 'Xóa địa chỉ' })
    await user.click(within(dialog).getByRole('button', { name: 'Giữ địa chỉ' }))
    expect(screen.getByText(/72 Nguyễn Thị Minh Khai/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Xóa địa chỉ .*72 Nguyễn Thị Minh Khai/ }))
    await user.click(within(screen.getByRole('dialog', { name: 'Xóa địa chỉ' })).getByRole('button', { name: 'Xác nhận xóa' }))

    expect(await screen.findByRole('heading', { name: 'Chưa có địa chỉ' })).toBeInTheDocument()
  })
})
