import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ColorSelector } from './ColorSelector'
import { colorSwatchHex } from '@/shared/lib/colorSwatch'

it('renders solid, split and patterned swatches and keeps colour selection working', async () => {
  const colors = ['Đỏ rượu vang', 'Trắng/đen', 'Hoa xanh dương', 'Màu Milan']
  const onChange = vi.fn()
  render(<ColorSelector options={colors.map(color => ({ color, colorHex: colorSwatchHex(color), available: true }))} selectedColor={colors[0]} onChange={onChange} />)
  const button = (color: string) => screen.getByRole('button', { name: `Màu ${color}` })
  expect(button(colors[0]).querySelector('span')).toHaveStyle({ backgroundColor: '#722F37' })
  expect(button(colors[1]).querySelector('span')?.style.backgroundImage).toContain('linear-gradient')
  expect(button(colors[2]).querySelector('span')?.style.backgroundImage).toContain('radial-gradient')
  expect(button(colors[3]).querySelector('span')?.style.backgroundImage).toContain('repeating-linear-gradient')
  await userEvent.setup().click(button(colors[1]))
  expect(onChange).toHaveBeenCalledWith('Trắng/đen')
})
