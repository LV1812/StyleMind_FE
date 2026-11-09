import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import AddressAutocomplete from './AddressAutocomplete'

function Form() { const [value, setValue] = useState(''); return <AddressAutocomplete label="Địa chỉ" value={value} onChange={setValue} token="test-token" /> }
afterEach(() => vi.unstubAllGlobals())
it('gợi ý địa chỉ Việt Nam và điền địa chỉ đã chọn', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ place_id: '1', display_name: 'Quận 1, Thành phố Hồ Chí Minh, Việt Nam' }] })
  vi.stubGlobal('fetch', fetcher)
  render(<Form />)
  const user = userEvent.setup()
  await user.type(screen.getByRole('combobox', { name: 'Địa chỉ' }), 'Quận 1')
  const option = await screen.findByRole('option', { name: /Quận 1, Thành phố/ })
  expect(new URL(fetcher.mock.calls[0][0]).searchParams.get('countrycodes')).toBe('vn')
  await user.click(option)
  expect(screen.getByRole('combobox', { name: 'Địa chỉ' })).toHaveValue('Quận 1, Thành phố Hồ Chí Minh, Việt Nam')
  await waitFor(() => expect(screen.queryByRole('option')).not.toBeInTheDocument())
})
it('cho phép nhập tay nếu dịch vụ gợi ý lỗi', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))
  render(<Form />)
  await userEvent.setup().type(screen.getByRole('combobox', { name: 'Địa chỉ' }), '123 đường')
  expect(await screen.findByText(/vẫn có thể nhập địa chỉ/)).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Địa chỉ' })).toHaveValue('123 đường')
})
