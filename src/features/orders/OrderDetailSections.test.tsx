import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import OrderDetailSections from './components/OrderDetailSections'
import type { OrderResponse } from '@/features/payments/api/types'
const api = vi.hoisted(() => ({ cancelOrder: vi.fn() }))
vi.mock('@/features/payments/api/paymentClient', () => ({ paymentApi: api, paymentErrorMessage: () => 'Không gửi được yêu cầu' }))

it('hủy ngay đơn đủ điều kiện và chỉ báo thành công khi BE xác nhận', async () => {
  api.cancelOrder.mockResolvedValue({ order_status: 'CANCELLED' })
  const refresh = vi.fn()
  const order = { order_id: 'order', payment_method: 'COD', confirmation_state: 'UNCONFIRMED', order_status: 'PLACED', history: [{ history_id: 'h1', to_status: 'PLACED', changed_at: '2026-01-01T00:00:00Z' }], cancellation_request: null } as OrderResponse
  render(<OrderDetailSections order={order} onRefresh={refresh} />)
  expect(screen.getAllByText('Đã đặt hàng').length).toBeGreaterThan(0)
  fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn hàng' }))
  fireEvent.change(screen.getByLabelText('Lý do hủy đơn'), { target: { value: 'Không còn nhu cầu' } })
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận hủy đơn' }))
  await waitFor(() => expect(api.cancelOrder).toHaveBeenCalledWith('order', 'Không còn nhu cầu'))
  expect(await screen.findByText('Đơn hàng đã được hủy.')).toBeInTheDocument()
  expect(refresh).toHaveBeenCalled()
})

it('vẫn cho phép hủy khi yêu cầu trước đó đang chờ duyệt', () => {
  const order = { order_id: 'order', payment_method: 'COD', confirmation_state: 'UNCONFIRMED', order_status: 'PLACED', history: [], cancellation_request: { request_status: 'PENDING', reason: 'Không còn nhu cầu' } } as unknown as OrderResponse
  render(<OrderDetailSections order={order} onRefresh={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Hủy đơn hàng' })).toBeInTheDocument()
})

it('không báo hủy thành công khi máy chủ không xác nhận', async () => {
  api.cancelOrder.mockResolvedValueOnce({ order_status: 'PENDING_PAYMENT' })
  const order = { order_id: 'order', payment_method: 'COD', confirmation_state: 'UNCONFIRMED', order_status: 'PENDING_PAYMENT', history: [], cancellation_request: null } as unknown as OrderResponse
  render(<OrderDetailSections order={order} onRefresh={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn hàng' }))
  fireEvent.change(screen.getByLabelText('Lý do hủy đơn'), { target: { value: 'Không còn nhu cầu' } })
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận hủy đơn' }))
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.queryByText('Đơn hàng đã được hủy.')).not.toBeInTheDocument()
})

