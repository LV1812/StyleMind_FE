import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ManualOutfitBuilderPage } from './pages/ManualOutfitBuilderPage'

const mocks = vi.hoisted(() => ({ load: vi.fn(), create: vi.fn() }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: '10000000-0000-0000-0000-000000000001' } }) }))
vi.mock('@/app/store/DemoStoreProvider', () => ({ useDemoStore: () => ({ state: { products: [] }, dispatch: vi.fn() }) }))
vi.mock('@/features/commerce/data/loadCommerceProducts', () => ({ loadAllCommerceProducts: mocks.load }))
vi.mock('@/shared/api/communityApi', () => ({ communityApi: { createOutfit: mocks.create } }))

const product = { product_id: '20000000-0000-0000-0000-000000000002', category_id: 'c', brand_id: 'b', category_name: 'Áo', brand_name: 'Style', name: 'Áo thật', description: null, demographic_segment: null, product_status: 'ACTIVE', variants: [{ variant_id: '30000000-0000-0000-0000-000000000003', product_id: '20000000-0000-0000-0000-000000000002', sku: 'shirt', size: 'M', color: 'white', material: null, unit_price_vnd: 100000, variant_status: 'ACTIVE', available_quantity: 5, images: [] }] }

beforeEach(() => { vi.stubEnv('VITE_COMMUNITY_MODE', 'api'); mocks.load.mockReset(); mocks.create.mockReset() })
afterEach(() => vi.unstubAllEnvs())

function renderPage() {
  render(<MemoryRouter initialEntries={['/wardrobes/new']}><Routes><Route path="/wardrobes/new" element={<ManualOutfitBuilderPage />} /><Route path="/outfits/:outfitId" element={<h1>Chi tiết Outfit thật</h1>} /></Routes></MemoryRouter>)
}

it('loads Commerce products and creates the outfit through Wardrobe', async () => {
  mocks.load.mockResolvedValue([product])
  mocks.create.mockResolvedValue({ outfit_id: '40000000-0000-0000-0000-000000000004' })
  renderPage()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Thêm Áo thật' }))
  await user.type(screen.getByLabelText('Tên outfit'), 'Đi chơi')
  await user.click(screen.getByRole('button', { name: 'Lưu outfit' }))
  await waitFor(() => expect(mocks.create).toHaveBeenCalledWith('Đi chơi', ['30000000-0000-0000-0000-000000000003']))
  expect(await screen.findByRole('heading', { name: 'Chi tiết Outfit thật' })).toBeInTheDocument()
})

it('shows a retryable error instead of an empty catalog on loading failure', async () => {
  mocks.load.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([product])
  renderPage()
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được sản phẩm')
  await userEvent.setup().click(screen.getByRole('button', { name: 'Thử lại' }))
  expect(await screen.findByRole('button', { name: 'Thêm Áo thật' })).toBeInTheDocument()
})

it('keeps the draft and shows an error if saving fails', async () => {
  mocks.load.mockResolvedValue([product])
  mocks.create.mockRejectedValue(new Error('Không lưu được outfit'))
  renderPage()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Thêm Áo thật' }))
  await user.type(screen.getByLabelText('Tên outfit'), 'Đi chơi')
  await user.click(screen.getByRole('button', { name: 'Lưu outfit' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Không lưu được outfit')
  expect(screen.getByLabelText('Tên outfit')).toHaveValue('Đi chơi')
})
