import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import OrderDetailSections from './components/OrderDetailSections'
import type { OrderResponse } from '@/features/payments/api/types'
const api = vi.hoisted(() => ({ requestCancellation: vi.fn() }))
vi.mock('@/features/payments/api/paymentClient', () => ({ paymentApi: api, paymentErrorMessage: () => 'Không gửi được yêu cầu' }))

it('displays actual order history and sends a cancellation request without declaring the order cancelled', async () => {
  api.requestCancellation.mockResolvedValue({})
  const refresh = vi.fn()
  const order = { order_id: 'order', order_status: 'PLACED', history: [{ history_id: 'h1', to_status: 'PLACED', changed_at: '2026-01-01T00:00:00Z' }], cancellation_request: null } as OrderResponse
  render(<OrderDetailSections order={order} onRefresh={refresh} />)
  expect(screen.getByText('Đã đặt hàng')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu hủy đơn' }))
  fireEvent.change(screen.getByLabelText('Lý do hủy đơn'), { target: { value: 'Không còn nhu cầu' } })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu hủy' }))
  await waitFor(() => expect(api.requestCancellation).toHaveBeenCalledWith('order', 'Không còn nhu cầu'))
  expect(await screen.findByText(/Đã gửi yêu cầu hủy/)).toBeInTheDocument()
  expect(refresh).toHaveBeenCalled()
})
