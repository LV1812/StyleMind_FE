import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'

import { AddressForm } from './AddressForm'

const setup = (props: Partial<Parameters<typeof AddressForm>[0]> = {}) => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<AddressForm provinces={[]} wards={[]} wardLoading={false} saving={false} onProvinceChange={vi.fn()} onCancel={vi.fn()} onSubmit={onSubmit} {...props} />)
  return { onSubmit, user: userEvent.setup() }
}
const fill = async (user: ReturnType<typeof userEvent.setup>, values: { name?: string; phone?: string; line?: string }) => {
  if (values.name !== undefined) await user.type(screen.getByLabelText(/^Tên người nhận/), values.name)
  if (values.phone !== undefined) await user.type(screen.getByLabelText(/^Số điện thoại Việt Nam/), values.phone)
  if (values.line !== undefined) await user.type(screen.getByLabelText(/^Địa chỉ \(số nhà/), values.line)
}

it('shows an error under every invalid field, focuses the first one and does not submit', async () => {
  const { onSubmit, user } = setup()
  await user.click(screen.getByRole('button', { name: 'Lưu địa chỉ' }))
  expect(screen.getByText('Vui lòng nhập tên người nhận.')).toBeInTheDocument()
  expect(screen.getByText('Vui lòng nhập số điện thoại.')).toBeInTheDocument()
  expect(screen.getByText('Vui lòng nhập địa chỉ giao hàng.')).toBeInTheDocument()
  expect(screen.getByLabelText(/^Tên người nhận/)).toHaveFocus()
  expect(screen.getByLabelText(/^Số điện thoại Việt Nam/)).toHaveAttribute('aria-invalid', 'true')
  expect(onSubmit).not.toHaveBeenCalled()
})

it('flags a malformed phone number under the phone field and focuses it', async () => {
  const { onSubmit, user } = setup()
  await fill(user, { name: 'Nguyễn Văn A', phone: 'abc', line: '12 Nguyễn Trãi' })
  await user.click(screen.getByRole('button', { name: 'Lưu địa chỉ' }))
  const phone = screen.getByLabelText(/^Số điện thoại Việt Nam/)
  expect(phone).toHaveFocus()
  expect(phone).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByText(/chỉ gồm chữ số/)).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

it('clears a field error as soon as the user edits that field and submits a valid address', async () => {
  const { onSubmit, user } = setup()
  await user.click(screen.getByRole('button', { name: 'Lưu địa chỉ' }))
  await fill(user, { name: 'Nguyễn Văn A', phone: '0912345678', line: '12 Nguyễn Trãi, Quận 1' })
  expect(screen.queryByText('Vui lòng nhập tên người nhận.')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Lưu địa chỉ' }))
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ recipientName: 'Nguyễn Văn A', recipientPhone: '0912345678' }))
})

it('shows the server message inside the form when the save is rejected', () => {
  setup({ serverError: 'Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.' })
  expect(screen.getByRole('alert')).toHaveTextContent('Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.')
})
