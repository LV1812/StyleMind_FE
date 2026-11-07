import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { ApiOutfitManagement } from './components/ApiOutfitManagement'

const api = vi.hoisted(() => ({ renameOutfit: vi.fn(), deleteOutfit: vi.fn(), addOutfitItem: vi.fn(), changeOutfitItem: vi.fn(), removeOutfitItem: vi.fn(), load: vi.fn() }))
vi.mock('@/shared/api/communityApi', () => ({ communityApi: api }))
vi.mock('@/features/commerce/data/loadCommerceProducts', () => ({ loadAllCommerceProducts: api.load }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'owner' } }) }))

const outfitId = '10000000-0000-0000-0000-000000000001', productId = '20000000-0000-0000-0000-000000000002'
const first = '30000000-0000-0000-0000-000000000003', second = '40000000-0000-0000-0000-000000000004', item = '50000000-0000-0000-0000-000000000005'
const detail = { outfit_id: outfitId, name: 'Bộ đồ', items: [{ outfit_item_id: item, variant_id: first, product_id: productId, product_name: 'Áo', color: 'Trắng', size: 'M', unit_price_vnd: 100, image_url: null, available: true }] }
const products = [{ product_id: productId, name: 'Áo', product_status: 'ACTIVE', variants: [{ variant_id: first, variant_status: 'ACTIVE', color: 'Trắng', size: 'M' }, { variant_id: second, variant_status: 'ACTIVE', color: 'Đen', size: 'L' }] }]
beforeEach(() => { vi.clearAllMocks(); api.load.mockResolvedValue(products); for (const fn of [api.renameOutfit, api.deleteOutfit, api.addOutfitItem, api.changeOutfitItem, api.removeOutfitItem]) fn.mockResolvedValue({}) })

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

it('adds an item and changes its variant using catalog data', async () => {
  const user = userEvent.setup(); render(<ApiOutfitManagement detail={detail} refresh={vi.fn()} onDeleted={vi.fn()} />)
  await user.click(screen.getByRole('button', { name: 'Thêm món' }))
  await user.selectOptions(await screen.findByLabelText('Chọn sản phẩm và phiên bản'), second)
  await user.click(screen.getByRole('button', { name: 'Thêm vào outfit' }))
  await waitFor(() => expect(api.addOutfitItem).toHaveBeenCalledWith(outfitId, second))
  await user.click(screen.getByRole('button', { name: 'Đổi phiên bản Áo' }))
  await user.selectOptions(await screen.findByLabelText('Chọn phiên bản mới'), second)
  await user.click(screen.getByRole('button', { name: 'Lưu phiên bản' }))
  await waitFor(() => expect(api.changeOutfitItem).toHaveBeenCalledWith(outfitId, item, second))
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
