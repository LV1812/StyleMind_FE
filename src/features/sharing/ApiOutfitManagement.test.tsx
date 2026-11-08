import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { ApiOutfitManagement } from './components/ApiOutfitManagement'

const api = vi.hoisted(() => ({ renameOutfit: vi.fn(), deleteOutfit: vi.fn(), addOutfitItem: vi.fn(), changeOutfitItem: vi.fn(), removeOutfitItem: vi.fn(), list: vi.fn(), get: vi.fn() }))
vi.mock('@/shared/api/communityApi', () => ({ communityApi: api }))
vi.mock('@/api/commerce', () => ({ commerceApi: { products: { list: api.list, get: api.get } } }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'owner' } }) }))

const outfitId = '10000000-0000-0000-0000-000000000001', productId = '20000000-0000-0000-0000-000000000002'
const first = '30000000-0000-0000-0000-000000000003', second = '40000000-0000-0000-0000-000000000004', item = '50000000-0000-0000-0000-000000000005'
const detail = { outfit_id: outfitId, name: 'Bộ đồ', items: [{ outfit_item_id: item, variant_id: first, product_id: productId, product_name: 'Áo', color: 'Trắng', size: 'M', unit_price_vnd: 100, image_url: null, available: true }] }
const third = '60000000-0000-0000-0000-000000000006', fourth = '70000000-0000-0000-0000-000000000007', trousers = '80000000-0000-0000-0000-000000000008'
const v = (id: string, product_id: string, color: string, size: string, available_quantity: number, price = 100000) => ({ variant_id: id, product_id, sku: id, color, size, material: null, unit_price_vnd: price, variant_status: 'ACTIVE', available_quantity, images: [{ image_id: id, variant_id: id, image_url: `https://img.test/${id}.jpg`, alt_text: null, display_order: 0, is_primary: true }] })
const shirt = { product_id: productId, name: 'Áo', brand_name: 'Hãng A', product_status: 'ACTIVE', variants: [v(first, productId, 'Trắng', 'M', 5), v(second, productId, 'Đen', 'L', 0)] }
const pants = { product_id: trousers, name: 'Quần', brand_name: 'Hãng B', product_status: 'ACTIVE', variants: [v(third, trousers, 'Xanh navy', 'S', 4, 250000), v(fourth, trousers, 'Xanh navy', 'M', 0, 250000)] }
const page = (items: unknown[]) => ({ items, page: 0, size: 12, total_elements: items.length, total_pages: 1 })
beforeEach(() => { vi.clearAllMocks(); api.list.mockResolvedValue(page([shirt, pants])); api.get.mockResolvedValue(shirt); for (const fn of [api.renameOutfit, api.deleteOutfit, api.addOutfitItem, api.changeOutfitItem, api.removeOutfitItem]) fn.mockResolvedValue({}) })

it('renames and deletes only after confirmation', async () => {
  const refresh = vi.fn(), deleted = vi.fn(), user = userEvent.setup()
  render(<ApiOutfitManagement detail={detail} refresh={refresh} onDeleted={deleted} />)
  await user.click(screen.getByRole('button', { name: 'Đổi tên' }))
  const dialog = screen.getByRole('dialog', { name: 'Đổi tên outfit' })
  const input = within(dialog).getByLabelText('Tên outfit')
  await user.clear(input); await user.type(input, 'Tên mới'); await user.click(within(dialog).getByRole('button', { name: 'Lưu' }))
  await waitFor(() => expect(api.renameOutfit).toHaveBeenCalledWith(outfitId, 'Tên mới'))
  await user.click(screen.getByRole('button', { name: 'Xóa outfit' }))
  expect(api.deleteOutfit).not.toHaveBeenCalled()
  await user.click(within(screen.getByRole('dialog', { name: 'Xóa outfit' })).getByRole('button', { name: 'Xác nhận xóa' }))
  await waitFor(() => expect(deleted).toHaveBeenCalled())
  expect(api.deleteOutfit).toHaveBeenCalledWith(outfitId)
})

it('adds an item found by search with its colour and size, and changes the variant of an existing item', async () => {
  const user = userEvent.setup(); render(<ApiOutfitManagement detail={detail} refresh={vi.fn()} onDeleted={vi.fn()} />)
  await user.click(screen.getByRole('button', { name: 'Thêm món' }))
  const dialog = await screen.findByRole('dialog', { name: 'Thêm món' })
  api.list.mockResolvedValue(page([pants]))
  await user.type(within(dialog).getByLabelText('Tìm sản phẩm'), 'quần')
  await waitFor(() => expect(api.list).toHaveBeenLastCalledWith({ keyword: 'quần', page: 0, size: 12 }))
  await user.click(await within(dialog).findByRole('button', { name: /Quần/ }))
  expect(within(dialog).getByRole('button', { name: 'Thêm vào outfit' })).toBeDisabled()
  await user.click(within(dialog).getByRole('button', { name: 'Màu Xanh navy' }))
  await user.click(within(dialog).getByRole('button', { name: 'Kích cỡ S' }))
  await user.click(within(dialog).getByRole('button', { name: 'Thêm vào outfit' }))
  await waitFor(() => expect(api.addOutfitItem).toHaveBeenCalledWith(outfitId, third))
  await user.click(screen.getByRole('button', { name: 'Đổi màu/size Áo' }))
  const change = await screen.findByRole('dialog', { name: 'Đổi màu/size' })
  await waitFor(() => expect(api.get).toHaveBeenCalledWith(productId))
  expect(within(change).queryByLabelText('Tìm sản phẩm')).not.toBeInTheDocument()
  await user.click(await within(change).findByRole('button', { name: 'Màu Đen' }))
  await user.click(within(change).getByRole('button', { name: /^Kích cỡ L/ }))
  await user.click(within(change).getByRole('button', { name: 'Lưu phiên bản' }))
  await waitFor(() => expect(api.changeOutfitItem).toHaveBeenCalledWith(outfitId, item, second))
})

it('lets an out-of-stock variant be added to the outfit and blocks variants already in it', async () => {
  const user = userEvent.setup(); render(<ApiOutfitManagement detail={detail} refresh={vi.fn()} onDeleted={vi.fn()} />)
  await user.click(screen.getByRole('button', { name: 'Thêm món' }))
  const dialog = await screen.findByRole('dialog', { name: 'Thêm món' })
  await user.click(await within(dialog).findByRole('button', { name: /^Áo/ }))
  await user.click(within(dialog).getByRole('button', { name: 'Màu Trắng' }))
  expect(within(dialog).getByRole('button', { name: 'Kích cỡ M, đã có trong outfit' })).toBeDisabled()
  await user.click(within(dialog).getByRole('button', { name: 'Màu Đen' }))
  const soldOut = within(dialog).getByRole('button', { name: 'Kích cỡ L, hết hàng' })
  expect(soldOut).toBeEnabled()
  expect(within(dialog).getByText(/vẫn thêm được vào outfit/)).toBeInTheDocument()
  await user.click(soldOut)
  await user.click(within(dialog).getByRole('button', { name: 'Thêm vào outfit' }))
  await waitFor(() => expect(api.addOutfitItem).toHaveBeenCalledWith(outfitId, second))
})

it('shows server rejections for adding an item and keeps the dialog open', async () => {
  const { ApiError } = await import('@/shared/api/http')
  api.addOutfitItem.mockRejectedValueOnce(new ApiError(409, 'OUTFIT_ITEM_LIMIT_REACHED', 'x'))
  const user = userEvent.setup(); render(<ApiOutfitManagement detail={detail} refresh={vi.fn()} onDeleted={vi.fn()} />)
  await user.click(screen.getByRole('button', { name: 'Thêm món' }))
  const dialog = await screen.findByRole('dialog', { name: 'Thêm món' })
  await user.click(await within(dialog).findByRole('button', { name: /Quần/ }))
  await user.click(within(dialog).getByRole('button', { name: 'Màu Xanh navy' }))
  await user.click(within(dialog).getByRole('button', { name: 'Kích cỡ S' }))
  await user.click(within(dialog).getByRole('button', { name: 'Thêm vào outfit' }))
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Mỗi outfit tối đa 10 món.')
})

it('loads more products and reports a load failure with a retry', async () => {
  api.list.mockResolvedValueOnce({ items: [shirt], page: 0, size: 12, total_elements: 2, total_pages: 2 })
  const user = userEvent.setup(); render(<ApiOutfitManagement detail={detail} refresh={vi.fn()} onDeleted={vi.fn()} />)
  await user.click(screen.getByRole('button', { name: 'Thêm món' }))
  const dialog = await screen.findByRole('dialog', { name: 'Thêm món' })
  await within(dialog).findByRole('button', { name: /^Áo/ })
  api.list.mockResolvedValueOnce({ items: [pants], page: 1, size: 12, total_elements: 2, total_pages: 2 })
  await user.click(within(dialog).getByRole('button', { name: 'Tải thêm' }))
  expect(await within(dialog).findByRole('button', { name: /Quần/ })).toBeInTheDocument()
  expect(api.list).toHaveBeenLastCalledWith({ keyword: undefined, page: 1, size: 12 })
  expect(within(dialog).queryByRole('button', { name: 'Tải thêm' })).not.toBeInTheDocument()
})

it('prevents removing the final item and removes another item after confirmation', async () => {
  const user = userEvent.setup(), refresh = vi.fn()
  const { rerender } = render(<ApiOutfitManagement detail={detail} refresh={refresh} onDeleted={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Xóa Áo khỏi outfit' })).toBeDisabled()
  rerender(<ApiOutfitManagement detail={{ ...detail, items: [...detail.items, { ...detail.items[0], outfit_item_id: second, variant_id: second, product_name: 'Quần' }] }} refresh={refresh} onDeleted={vi.fn()} />)
  await user.click(screen.getByRole('button', { name: 'Xóa Áo khỏi outfit' }))
  expect(api.removeOutfitItem).not.toHaveBeenCalled()
  await user.click(within(screen.getByRole('dialog', { name: 'Xóa món' })).getByRole('button', { name: 'Xác nhận xóa' }))
  await waitFor(() => expect(api.removeOutfitItem).toHaveBeenCalledWith(outfitId, item))
})

it('keeps the rename dialog open and preserves the name if saving fails', async () => {
  api.renameOutfit.mockRejectedValueOnce(new Error('Không thể cập nhật'))
  const user = userEvent.setup(); render(<ApiOutfitManagement detail={detail} refresh={vi.fn()} onDeleted={vi.fn()} />)
  await user.click(screen.getByRole('button', { name: 'Đổi tên' }))
  const input = screen.getByLabelText('Tên outfit')
  await user.clear(input); await user.type(input, 'Tên mới'); await user.click(screen.getByRole('button', { name: 'Lưu' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể cập nhật')
  expect(input).toHaveValue('Tên mới')
})

it('does not navigate away from another outfit when an older delete completes', async () => {
  let finish!: () => void
  api.deleteOutfit.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve }))
  const deleted = vi.fn(), user = userEvent.setup()
  const { rerender } = render(<ApiOutfitManagement detail={detail} refresh={vi.fn()} onDeleted={deleted} />)
  await user.click(screen.getByRole('button', { name: 'Xóa outfit' }))
  await user.click(within(screen.getByRole('dialog', { name: 'Xóa outfit' })).getByRole('button', { name: 'Xác nhận xóa' }))
  rerender(<ApiOutfitManagement detail={{ ...detail, outfit_id: second }} refresh={vi.fn()} onDeleted={deleted} />)
  await act(async () => { finish(); await Promise.resolve() })
  expect(deleted).not.toHaveBeenCalled()
})
