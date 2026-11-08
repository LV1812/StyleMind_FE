import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ToastProvider } from '@/shared/ui'
import { AdminCustomersPanel } from './AdminCustomersPanel'

const api = vi.hoisted(() => ({ listUsers: vi.fn(), replaceUserRoles: vi.fn() }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'admin' } }) }))
vi.mock('@/shared/api/identityApi', () => ({ identityApi: api, identityErrorMessage: (e: Error) => e.message }))

it('chọn một vai trò và gửi vai trò đó tới API', async () => {
  api.listUsers.mockResolvedValue({ items: [{ account_id: 'user-1', email: 'user@example.com', roles: ['CUSTOMER'], account_status: 'ACTIVE', email_verified_at: null, created_at: '2026-01-01T00:00:00Z' }], total_pages: 1, total_elements: 1 })
  api.replaceUserRoles.mockResolvedValue({ account_id: 'user-1', roles: ['ADMIN'] })
  render(<ToastProvider><AdminCustomersPanel /></ToastProvider>)
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Sửa vai trò' }))
  const selector = screen.getByLabelText('Chọn vai trò')
  expect(selector.tagName).toBe('SELECT')
  expect(screen.queryByRole('option', { name: 'Khách hàng và Quản trị viên' })).not.toBeInTheDocument()
  await user.selectOptions(selector, 'ADMIN')
  await user.click(screen.getByRole('button', { name: 'Lưu' }))
  expect(api.replaceUserRoles).toHaveBeenCalledWith('user-1', ['ADMIN'])
  expect(await screen.findByText('Đã cập nhật vai trò tài khoản.')).toBeInTheDocument()
})

it('yêu cầu chọn rõ vai trò khi tài khoản trước đó có cả hai quyền', async () => {
  api.listUsers.mockResolvedValue({ items: [{ account_id: 'user-2', email: 'both@example.com', roles: ['CUSTOMER', 'ADMIN'], account_status: 'ACTIVE', email_verified_at: null, created_at: '2026-01-01T00:00:00Z' }], total_pages: 1, total_elements: 1 })
  api.replaceUserRoles.mockClear()
  render(<ToastProvider><AdminCustomersPanel /></ToastProvider>)
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Sửa vai trò' }))
  expect(screen.getByLabelText('Chọn vai trò')).toHaveValue('')
  expect(screen.getByRole('button', { name: 'Lưu' })).toBeDisabled()
  expect(api.replaceUserRoles).not.toHaveBeenCalled()
})
