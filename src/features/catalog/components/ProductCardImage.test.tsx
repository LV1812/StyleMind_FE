import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { createDemoSeed } from '@/app/data/demoSeed'
import { ProductCard } from './ProductCard'
import { ProductRail } from '@/features/home/components/ProductRail'

it('shows a clear placeholder in the shop when a product image fails', () => {
  const product = createDemoSeed().products[0]
  render(<MemoryRouter><ProductCard product={product} /></MemoryRouter>)
  fireEvent.error(screen.getByRole('img'))
  expect(screen.getByText('Chưa có ảnh')).toBeInTheDocument()
  expect(screen.getByRole('link')).toHaveAttribute('href', `/products/${product.id}`)
})

it('shows a placeholder for missing home product images while keeping its details', () => {
  const product = createDemoSeed().products[0]
  product.variants = product.variants.map(variant => ({ ...variant, images: [] }))
  render(<MemoryRouter><ProductRail title="Sản phẩm mới" products={[product]} /></MemoryRouter>)
  expect(screen.getByText('Chưa có ảnh')).toBeInTheDocument()
  expect(screen.getByText(product.name)).toBeInTheDocument()
})
