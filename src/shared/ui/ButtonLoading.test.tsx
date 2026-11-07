import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Button } from './Button'

it('indicates that a disabled button is processing', () => {
  render(<Button loading>Lưu</Button>)
  const button = screen.getByRole('button', { name: 'Đang xử lý' })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('aria-busy', 'true')
})
