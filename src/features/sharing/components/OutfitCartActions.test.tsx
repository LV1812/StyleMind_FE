import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { OutfitCartActions } from './OutfitCartActions'

const addItem = vi.hoisted(() => vi.fn())
vi.mock('@/features/cart/model/AccountCommerceProvider', () => ({ useActiveCommerce: () => ({ addItem, busy: false }) }))

const items = [
  { outfit_item_id: 'one', variant_id: 'variant-one', product_id: 'p1', product_name: 'Áo', color: null, size: null, unit_price_vnd: 100, image_url: null, available: true },
  { outfit_item_id: 'two', variant_id: 'variant-two', product_id: 'p2', product_name: 'Quần', color: null, size: null, unit_price_vnd: 200, image_url: null, available: true },
  { outfit_item_id: 'three', variant_id: 'variant-three', product_id: null, product_name: 'Món cũ', color: null, size: null, unit_price_vnd: null, image_url: null, available: false },
]
beforeEach(() => { addItem.mockReset(); addItem.mockResolvedValue(undefined) })

it('adds only available items to the cart and reports the skipped item', async () => {
  render(<OutfitCartActions items={items} />)
  await userEvent.setup().click(screen.getByRole('button', { name: 'Thêm Outfit vào giỏ' }))
  expect(addItem.mock.calls).toEqual([['variant-one', 1], ['variant-two', 1]])
  expect(await screen.findByRole('status')).toHaveTextContent('Đã thêm 2 món; 1 món không còn khả dụng.')
})

it('adds an individual available item and disables an unavailable item', async () => {
  render(<OutfitCartActions items={items} />)
  // The visible label is short (so it never overflows on phones); the product name lives in the accessible name.
  expect(screen.getByRole('button', { name: 'Thêm Áo vào giỏ' })).toHaveTextContent(/^Thêm vào giỏ$/)
  expect(screen.getByRole('button', { name: 'Thêm Món cũ vào giỏ' })).toBeDisabled()
  await userEvent.setup().click(screen.getByRole('button', { name: 'Thêm Áo vào giỏ' }))
  expect(addItem).toHaveBeenCalledExactlyOnceWith('variant-one', 1)
  expect(await screen.findByRole('status')).toHaveTextContent('Đã thêm 1 món.')
})

it('stops and describes a partial result when a cart request fails', async () => {
  addItem.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Không kết nối được'))
  render(<OutfitCartActions items={items} />)
  await userEvent.setup().click(screen.getByRole('button', { name: 'Thêm Outfit vào giỏ' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Đã thêm 1 món')
  expect(screen.getByRole('alert')).toHaveTextContent('kiểm tra giỏ hàng')
  expect(addItem).toHaveBeenCalledTimes(2)
})
