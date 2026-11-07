import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { commerceApi } from '@/api/commerce'
import { createDemoSeed } from '@/app/data/demoSeed'
import { ToastProvider } from '@/shared/ui'
import { AdminProductsPanel } from './AdminProductsPanel'

it('groups the product form and rejects an invalid price before calling the API', async () => {
  const create = vi.spyOn(commerceApi.products, 'create')
  render(<ToastProvider><AdminProductsPanel database={createDemoSeed()} dispatch={vi.fn()} /></ToastProvider>)
  await userEvent.setup().click(screen.getByRole('button', { name: 'Thêm sản phẩm' }))
  expect(screen.getByRole('heading', { name: 'Thông tin sản phẩm' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Phiên bản sản phẩm' })).toBeInTheDocument()
  for (const [label, value] of Object.entries({ 'ID sản phẩm': 'prd-test', 'Tên sản phẩm': 'Áo', 'Thương hiệu': 'Test', 'Giá cơ bản': '0', 'Mô tả': 'Áo test', 'Chất liệu': 'Cotton', 'Phom dáng': 'Vừa', 'Họa tiết': 'Trơn', 'Màu': 'Trắng', 'URL ảnh': 'https://example.test/image.png' })) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  }
  await userEvent.setup().click(screen.getByRole('button', { name: 'Lưu sản phẩm' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Giá cơ bản phải lớn hơn 0.')
  expect(create).not.toHaveBeenCalled()
  create.mockRestore()
})
