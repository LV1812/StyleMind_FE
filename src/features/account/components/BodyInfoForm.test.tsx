import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it } from 'vitest'
import type { StyleProfileInput } from '../model/validators'
import { BodyInfoForm } from './BodyInfoForm'

it('keeps existing style codes when advanced settings are collapsed', async () => {
  const original: StyleProfileInput = { fitPreference: '', heightCm: '', weightKg: '', usualTopSize: '', usualBottomSize: '', shoeSize: '', styleCodes: 'CASUAL', colorCodes: '', brandIds: '' }
  function Harness() { const [value, setValue] = useState(original); return <BodyInfoForm value={value} errors={{}} onChange={setValue} /> }
  render(<Harness />)
  const advanced = screen.getByText('Tùy chọn nâng cao')
  await userEvent.setup().click(advanced)
  expect(screen.getByLabelText('Mã phong cách (phân tách bằng dấu phẩy)')).toHaveValue('CASUAL')
  await userEvent.setup().click(advanced)
  await userEvent.setup().click(advanced)
  expect(screen.getByLabelText('Mã phong cách (phân tách bằng dấu phẩy)')).toHaveValue('CASUAL')
})
