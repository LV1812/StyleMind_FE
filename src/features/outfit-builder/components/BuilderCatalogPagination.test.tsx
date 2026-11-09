import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { createDemoSeed } from '@/app/data/demoSeed'
import { BuilderCatalogPanel } from './BuilderCatalogPanel'

it('phân trang catalog và trở về trang đầu khi tìm kiếm', async () => {
  const seed = createDemoSeed().products.find(product => product.active && product.variants.some(variant => variant.active))!
  const products = Array.from({ length: 13 }, (_, index) => ({ ...seed, id: `test-${index}`, name: `Áo số ${index}` }))
  const onSearchChange = vi.fn()
  const { rerender } = render(<BuilderCatalogPanel products={products} search="" onSearchChange={onSearchChange} onAddVariant={vi.fn()} />)
  const user = userEvent.setup()
  expect(screen.getByText('Áo số 0')).toBeInTheDocument()
  expect(screen.queryByText('Áo số 12')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Trang sau' }))
  expect(screen.queryByText('Áo số 0')).not.toBeInTheDocument()
  rerender(<BuilderCatalogPanel products={products} search="Áo số 0" onSearchChange={onSearchChange} onAddVariant={vi.fn()} />)
  expect(screen.getByText('Áo số 0')).toBeInTheDocument()
  expect(screen.getByText(/Trang 1 \/ 1/)).toBeInTheDocument()
})
