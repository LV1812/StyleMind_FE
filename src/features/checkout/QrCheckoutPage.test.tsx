import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import QrCheckoutPage from './pages/QrCheckoutPage'

const api = vi.hoisted(() => ({ getQrCheckout: vi.fn(), getQrAttempt: vi.fn(), cancelQrCheckout: vi.fn() }))
const guestApi = vi.hoisted(() => ({ getQr: vi.fn(), qrAttempt: vi.fn(), cancelQr: vi.fn() }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'account' } }) }))
vi.mock('@/features/payments/api/paymentClient', () => ({ paymentApi: api, paymentErrorMessage: () => 'Chưa xác định được kết quả' }))
vi.mock('@/features/checkout/data/guestCheckoutApi', () => ({ guestCheckoutApi: guestApi }))
vi.mock('@/features/cart/model/guestSession', () => ({ readGuestSessionKey: () => 'guest-session' }))

const id = '11111111-1111-4111-8111-111111111111'
const state = { checkoutId: id, customerId: 'account', totalVnd: 199000, status: 'PREPARING', expiresAt: '2099-01-01T00:00:00Z' }
const attempt = { qrPayload: 'https://example.test/qr.png', transferContent: 'SMTEST' }
function page() {
  return render(<MemoryRouter initialEntries={[`/checkout/qr/${id}`]}><Routes>
    <Route path="/checkout/qr/:checkoutId" element={<QrCheckoutPage />} />
    <Route path="/payments/:orderId" element={<p>Đơn đã được tạo</p>} />
  </Routes></MemoryRouter>)
}
beforeEach(() => {
  localStorage.clear(); vi.resetAllMocks()
  api.getQrCheckout.mockResolvedValue(state)
  api.getQrAttempt.mockResolvedValue(attempt)
  api.cancelQrCheckout.mockResolvedValue({ ...state, status: 'CANCELLED' })
  guestApi.getQr.mockResolvedValue({ ...state, customerId: null })
  guestApi.qrAttempt.mockResolvedValue(attempt)
  guestApi.cancelQr.mockResolvedValue({ ...state, customerId: null, status: 'CANCELLED' })
})

it('hủy thanh toán và ẩn mã QR sau khi máy chủ xác nhận', async () => {
  page()
  expect(await screen.findByRole('img', { name: 'Mã VietQR để thanh toán' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Hủy thanh toán' }))
  expect(await screen.findByText('Thanh toán đã được hủy.')).toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(api.cancelQrCheckout).toHaveBeenCalledWith(id)
})

it('không hiển thị lại QR khi phản hồi tạo mã về sau khi hủy', async () => {
  let finish!: (value: typeof attempt) => void
  api.getQrAttempt.mockImplementation(() => new Promise(resolve => { finish = resolve }))
  page()
  await screen.findByRole('button', { name: 'Hủy thanh toán' })
  fireEvent.click(screen.getByRole('button', { name: 'Hủy thanh toán' }))
  await screen.findByText('Thanh toán đã được hủy.')
  finish(attempt)
  await waitFor(() => expect(screen.queryByRole('img')).not.toBeInTheDocument())
})

it('cập nhật trạng thái đối soát nếu tiền đến sau khi hủy', async () => {
  page()
  await screen.findByRole('img', { name: 'Mã VietQR để thanh toán' })
  fireEvent.click(screen.getByRole('button', { name: 'Hủy thanh toán' }))
  await screen.findByText('Thanh toán đã được hủy.')
  api.getQrCheckout.mockResolvedValue({ ...state, status: 'RECONCILIATION_REQUIRED' })
  expect(await screen.findByText('Giao dịch đang được cửa hàng đối soát.', {}, { timeout: 5000 })).toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})

it('chuyển sang đơn chỉ khi BE báo đã tạo đơn', async () => {
  api.getQrCheckout.mockResolvedValue({ ...state, status: 'ORDER_CREATED' })
  page()
  expect(await screen.findByText('Đơn đã được tạo')).toBeInTheDocument()
})

it('khách vãng lai hủy phiên bằng mã phiên khách', async () => {
  render(<MemoryRouter initialEntries={[`/guest/checkout/qr/${id}`]}><Routes>
    <Route path="/guest/checkout/qr/:checkoutId" element={<QrCheckoutPage guest />} />
  </Routes></MemoryRouter>)
  expect(await screen.findByRole('img', { name: 'Mã VietQR để thanh toán' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Hủy thanh toán' }))
  expect(await screen.findByText('Thanh toán đã được hủy.')).toBeInTheDocument()
  expect(guestApi.cancelQr).toHaveBeenCalledWith('guest-session', id)
  expect(api.cancelQrCheckout).not.toHaveBeenCalled()
})
