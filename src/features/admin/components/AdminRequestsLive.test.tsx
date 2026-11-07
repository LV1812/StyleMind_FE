import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import type { DemoDatabase } from '@/app/store/types'
import { ToastProvider } from '@/shared/ui'
import { AdminRequestsPanel } from './AdminRequestsPanel'

it('does not offer simulated return and refund decisions', async () => {
  const database = { cancellationRequests: [], returnRequests: [{ id: 'demo-return', status: 'submitted', createdAt: '2026-01-01' }], users: [] } as unknown as DemoDatabase
  const dispatch = vi.fn()
  render(<MemoryRouter><ToastProvider><AdminRequestsPanel database={database} dispatch={dispatch} reviewerId="admin" /></ToastProvider></MemoryRouter>)
  await userEvent.setup().click(screen.getByRole('button', { name: 'Đổi/trả' }))
  expect(screen.getByText('Quản lý yêu cầu đổi/trả hiện chưa được hỗ trợ.')).toBeInTheDocument()
  expect(screen.queryByText('demo-return')).not.toBeInTheDocument()
  expect(dispatch).not.toHaveBeenCalled()
})
