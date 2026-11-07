import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

import { ToastProvider } from '@/shared/ui'
import { AdminCustomersPanel } from './AdminCustomersPanel'

vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'admin' } }) }))
vi.mock('@/shared/api/identityApi', () => ({
  identityApi: { listUsers: vi.fn().mockResolvedValue({ items: [], total_pages: 0, total_elements: 0 }) },
  identityErrorMessage: () => 'Không thể tải danh sách tài khoản.',
}))

it('explains that creating accounts from administration is not yet supported', async () => {
  render(<ToastProvider><AdminCustomersPanel /></ToastProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
  expect(await screen.findByText('Chức năng chưa hỗ trợ.')).toBeInTheDocument()
})
