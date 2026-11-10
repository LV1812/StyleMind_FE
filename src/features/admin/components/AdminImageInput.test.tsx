import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { commerceApi } from '@/api/commerce'
import { createDemoSeed } from '@/app/data/demoSeed'
import { ToastProvider } from '@/shared/ui'
import { AdminProductsPanel } from './AdminProductsPanel'

afterEach(() => vi.restoreAllMocks())

it('offers a file picker for product images instead of requiring an image URL', async () => {
  vi.spyOn(commerceApi.categories, 'list').mockResolvedValue({ items: [] })
  vi.spyOn(commerceApi.brands, 'list').mockResolvedValue({ items: [] })
  render(<ToastProvider><AdminProductsPanel database={createDemoSeed()} dispatch={vi.fn()} /></ToastProvider>)
  await userEvent.setup().click(screen.getByRole('button', { name: 'Thêm sản phẩm' }))
  expect(await screen.findByLabelText('Ảnh sản phẩm')).toHaveAttribute('type', 'file')
  expect(screen.queryByLabelText('URL ảnh')).not.toBeInTheDocument()
})

it('uploads the selected file to the created variant', async () => {
  const user = userEvent.setup()
  const variant = { variant_id: 'server-variant', product_id: 'server-product', sku: 'SKU', size: 'M', color: 'Trắng', material: 'Cotton', unit_price_vnd: 100000, variant_status: 'ACTIVE', available_quantity: 1, images: [] }
  const product = { product_id: 'server-product', category_id: 'tops', brand_id: 'brand', category_name: 'Áo', brand_name: 'Test', name: 'Áo test', description: 'Áo', demographic_segment: null, product_status: 'ACTIVE', variants: [] }
  vi.spyOn(commerceApi.brands, 'list').mockResolvedValue({ items: [{ id: 'brand', name: 'Test', slug: 'test', is_active: true }] })
  vi.spyOn(commerceApi.categories, 'list').mockResolvedValue({ items: [{ id: 'tops', name: 'Áo', slug: 'ao', is_active: true }] })
  vi.spyOn(commerceApi.products, 'create').mockResolvedValue(product)
  vi.spyOn(commerceApi.products, 'createVariant').mockResolvedValue(variant)
  const upload = vi.spyOn(commerceApi.products, 'uploadImage').mockResolvedValue({ image_id: 'image', variant_id: 'server-variant', image_url: '/image', alt_text: null, display_order: 0, is_primary: true })
  vi.spyOn(commerceApi.products, 'getAdmin').mockResolvedValue({ ...product, variants: [variant] })
  render(<ToastProvider><AdminProductsPanel database={createDemoSeed()} dispatch={vi.fn()} /></ToastProvider>)
  await user.click(screen.getByRole('button', { name: 'Thêm sản phẩm' }))
  await screen.findByLabelText('Tên sản phẩm')
  await user.selectOptions(screen.getByLabelText('Danh mục'), 'tops')
  await user.selectOptions(screen.getByLabelText('Thương hiệu'), 'brand')
  for (const [label, value] of Object.entries({ 'SKU': 'TEST-M', 'Tên sản phẩm': 'Áo test', 'Giá bán (VND)': '100000', 'Mô tả': 'Áo', 'Chất liệu': 'Cotton', 'Màu': 'Trắng' })) {
    await user.type(screen.getByLabelText(label), value)
  }
  const file = new File(['image'], 'shirt.png', { type: 'image/png' })
  await user.upload(screen.getByLabelText('Ảnh sản phẩm'), file)
  await user.click(screen.getByRole('button', { name: 'Lưu sản phẩm' }))
  expect(upload).toHaveBeenCalledWith('server-variant', file, 'Áo test màu Trắng')
})
