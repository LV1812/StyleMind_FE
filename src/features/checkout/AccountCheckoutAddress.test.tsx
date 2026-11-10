import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import AccountCheckoutPage from './pages/AccountCheckoutPage'
import { beginAccountSelection } from './model/accountSelection'

const mocks = vi.hoisted(() => ({ addresses: vi.fn(), create: vi.fn(), provinces: vi.fn(), wards: vi.fn(), preview: vi.fn(), checkout: vi.fn(), refresh: vi.fn() }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'account' } }) }))
vi.mock('@/features/cart/model/AccountCommerceProvider', () => ({ useAccountCommerce: () => ({ refreshCart: mocks.refresh }) }))
vi.mock('@/shared/ui/AddressAutocomplete', () => ({ default: ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <label>{label}<input value={value} onChange={event => onChange(event.target.value)} /></label> }))
vi.mock('@/shared/api/identityApi', () => ({ identityApi: { listAddresses: mocks.addresses, createAddress: mocks.create, listProvinces: mocks.provinces, listWards: mocks.wards }, identityErrorMessage: (e: Error) => e.message }))
vi.mock('@/features/payments/api/paymentClient', () => ({ paymentApi: { previewSelection: mocks.preview, checkoutSelection: mocks.checkout }, paymentErrorMessage: () => 'Lỗi thanh toán' }))

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); vi.resetAllMocks()
  beginAccountSelection('account', { kind: 'selected', cart_item_ids: ['item'] })
  mocks.preview.mockResolvedValue({ items: [{ cart_item_id: 'item', product_name: 'Áo', quantity: 1, line_total_vnd: 100 }], total_vnd: 100 })
  mocks.addresses.mockResolvedValue({ addresses: [] })
  mocks.provinces.mockResolvedValue({ provinces: [] })
})

it('tạo và chọn địa chỉ ngay tại trang thanh toán', async () => {
  mocks.create.mockResolvedValue({ address_id: 'new-address', recipient_name: 'An', recipient_phone: '0987654321', address_line: '12 Nguyễn Huệ', is_default: true })
  render(<MemoryRouter><AccountCheckoutPage /></MemoryRouter>)
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Thêm địa chỉ mới' }))
  await user.type(screen.getByLabelText('Tên người nhận'), 'An')
  await user.type(screen.getByLabelText('Số điện thoại Việt Nam'), '0987654321')
  await user.type(screen.getByLabelText('Địa chỉ (số nhà, đường, quận/huyện, tỉnh/thành)'), '12 Nguyễn Huệ')
  expect(screen.getByRole('button', { name: 'Đặt hàng' })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Lưu địa chỉ' }))
  await waitFor(() => expect(screen.getByLabelText('Chọn địa chỉ')).toHaveValue('new-address'))
  expect(screen.getByRole('button', { name: 'Đặt hàng' })).toBeEnabled()
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ recipient_name: 'An', address_line: '12 Nguyễn Huệ' }))
})

it('giữ biểu mẫu và báo lỗi khi không lưu được', async () => {
  mocks.create.mockRejectedValue(new Error('Không lưu được địa chỉ'))
  render(<MemoryRouter><AccountCheckoutPage /></MemoryRouter>)
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Thêm địa chỉ mới' }))
  await user.type(screen.getByLabelText('Tên người nhận'), 'An')
  await user.type(screen.getByLabelText('Số điện thoại Việt Nam'), '0987654321')
  await user.type(screen.getByLabelText('Địa chỉ (số nhà, đường, quận/huyện, tỉnh/thành)'), '12 Nguyễn Huệ')
  await user.click(screen.getByRole('button', { name: 'Lưu địa chỉ' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Không lưu được địa chỉ')
  expect(screen.getByLabelText('Tên người nhận')).toHaveValue('An')
})
