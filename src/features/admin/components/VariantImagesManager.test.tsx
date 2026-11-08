import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, it, expect, beforeEach } from 'vitest'
import VariantImagesManager from './VariantImagesManager'

const api = vi.hoisted(() => ({ getAdmin: vi.fn(), reorderImages: vi.fn(), removeImage: vi.fn() }))
vi.mock('@/api/commerce', () => ({ commerceApi: { products: api } }))

const images = [
  { image_id: 'image-1', variant_id: 'variant-1', image_url: '/1.jpg', alt_text: 'Ảnh một', display_order: 1, is_primary: true },
  { image_id: 'image-2', variant_id: 'variant-1', image_url: '/2.jpg', alt_text: 'Ảnh hai', display_order: 2, is_primary: false },
]
const product = (items = images) => ({ product_id: 'product-1', variants: [{ variant_id: 'variant-1', images: items }] })
beforeEach(() => { vi.resetAllMocks(); api.getAdmin.mockResolvedValue(product()) })

it('sắp xếp ảnh bằng API với đầy đủ ảnh và giữ ảnh chính', async () => {
  api.reorderImages.mockResolvedValue([images[1], images[0]])
  render(<VariantImagesManager productId="product-1" variantId="variant-1" onUpdated={vi.fn()} />)
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Đưa ảnh 2 lên trước' }))
  expect(api.reorderImages).toHaveBeenCalledWith('variant-1', { items: [
    { image_id: 'image-2', display_order: 1 }, { image_id: 'image-1', display_order: 2 },
  ], primary_image_id: 'image-1' })
})

it('chỉ xóa khi xác nhận và tải lại dữ liệu từ máy chủ', async () => {
  api.removeImage.mockResolvedValue(undefined)
  api.getAdmin.mockResolvedValueOnce(product()).mockResolvedValueOnce(product([images[0]]))
  const onUpdated = vi.fn()
  render(<VariantImagesManager productId="product-1" variantId="variant-1" onUpdated={onUpdated} />)
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Xóa ảnh 2' }))
  expect(api.removeImage).not.toHaveBeenCalled()
  const confirmation = screen.getByRole('group', { name: 'Xác nhận xóa ảnh 2' })
  await user.click(within(confirmation).getByRole('button', { name: 'Xác nhận xóa' }))
  expect(api.removeImage).toHaveBeenCalledWith('image-2')
  expect(await screen.findByText('Đã xóa ảnh.')).toBeInTheDocument()
  expect(onUpdated).toHaveBeenCalled()
})

it('hiển thị lỗi nếu xóa không thành công', async () => {
  api.removeImage.mockRejectedValue(new Error('Không thể xóa ảnh'))
  render(<VariantImagesManager productId="product-1" variantId="variant-1" onUpdated={vi.fn()} />)
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Xóa ảnh 2' }))
  await user.click(within(screen.getByRole('group', { name: 'Xác nhận xóa ảnh 2' })).getByRole('button', { name: 'Xác nhận xóa' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể xóa ảnh')
})
