import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { commerceApi } from '@/api/commerce'
import { createDemoSeed } from '@/app/data/demoSeed'
import { ToastProvider } from '@/shared/ui'
import { AdminProductsPanel } from './AdminProductsPanel'

it('groups the product form and rejects an invalid price before calling the API', async () => {
  const create = vi.spyOn(commerceApi.products, 'create')
  vi.spyOn(commerceApi.categories, 'list').mockResolvedValue({ items: [{ id: 'tops', name: 'Áo', slug: 'ao', is_active: true }] })
  vi.spyOn(commerceApi.brands, 'list').mockResolvedValue({ items: [{ id: 'brand', name: 'Test', slug: 'test', is_active: true }] })
  const user = userEvent.setup()
  render(<ToastProvider><AdminProductsPanel database={createDemoSeed()} dispatch={vi.fn()} /></ToastProvider>)
  await user.click(screen.getByRole('button', { name: 'Thêm sản phẩm' }))
  expect(await screen.findByRole('heading', { name: 'Thông tin sản phẩm' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Biến thể sản phẩm' })).toBeInTheDocument()
  for (const [label, value] of Object.entries({ 'Tên sản phẩm': 'Áo', 'Danh mục': 'tops', 'Thương hiệu': 'brand', 'Giá bán (VND)': '0', 'SKU': 'TEST-M', 'Mô tả': 'Áo test', 'Chất liệu': 'Cotton', 'Màu': 'Trắng' })) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  }
  await user.upload(screen.getByLabelText('Ảnh sản phẩm'), new File(['image bytes'], 'shirt.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: 'Lưu sản phẩm' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('giá bán phải là số nguyên lớn hơn 0')
  expect(create).not.toHaveBeenCalled()
  create.mockRestore()
  vi.restoreAllMocks()
})
