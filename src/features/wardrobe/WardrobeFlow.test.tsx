import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import type { DemoDatabase } from '@/app/store/types'
import type { Outfit } from '@/entities/outfit/model/types'
import type { ProductVariant } from '@/entities/product/model/types'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'

function databaseWithCustomer(overrides: Partial<DemoDatabase> = {}): DemoDatabase {
  return {
    ...createDemoSeed(),
    session: { userId: 'usr-customer-01', persistent: true },
    ...overrides,
  }
}

function persistDatabase(database: DemoDatabase) {
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(database))
}

function getDatabase() {
  const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
  if (!raw) throw new Error('Expected database in localStorage')
  return JSON.parse(raw) as DemoDatabase
}

function renderAt(initialEntry: string, database = databaseWithCustomer()) {
  window.localStorage.clear()
  persistDatabase(database)
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] })

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}

function databaseWithInactiveVariant(): DemoDatabase {
  const database = databaseWithCustomer()
  const product = database.products.find(item => item.id === 'prd-blouse-01')
  if (!product) throw new Error('Expected blouse product')
  const baseVariant = product.variants[0]
  const inactiveVariant: ProductVariant = {
    ...baseVariant,
    id: 'var-blouse-inactive-test',
    color: 'Xám tắt',
    active: false,
  }

  return {
    ...database,
    products: database.products.map(item =>
      item.id === product.id ? { ...item, variants: [...item.variants, inactiveVariant] } : item,
    ),
  }
}

describe('Wardrobe flow', () => {
  it('lists the current customers outfits as wardrobe cards', async () => {
    renderAt('/wardrobes')

    expect(await screen.findByRole('heading', { name: 'Tủ đồ của tôi' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tạo tủ đồ' })).toHaveAttribute('href', '/wardrobes/new')
    expect(screen.queryByRole('link', { name: 'Tạo thủ công' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Di lam toi gian/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Cafe cuoi tuan/ })).toBeInTheDocument()
  })

  it('shares the entire wardrobe from the wardrobe header', async () => {
    const user = userEvent.setup()
    renderAt('/wardrobes')

    await user.click(await screen.findByRole('button', { name: 'Chia sẻ tủ đồ' }))
    await screen.findByRole('dialog', { name: 'Chia sẻ tủ đồ' })
    await user.type(screen.getByLabelText('Email được chia sẻ'), 'banbe@example.com')
    await user.click(screen.getByRole('button', { name: 'Xác nhận chia sẻ' }))

    await waitFor(() => expect(screen.getAllByText(/banbe@example.com/).length).toBeGreaterThan(0))
    await waitFor(() => {
      const database = getDatabase()
      const ownedOutfitIds = database.outfits
        .filter(outfit => outfit.ownerId === 'usr-customer-01')
        .map(outfit => outfit.id)
      const sharedOutfitIds = database.outfitShares
        .filter(share => share.viewerEmail === 'banbe@example.com' && share.active)
        .map(share => share.outfitId)

      expect(sharedOutfitIds.sort()).toEqual(ownedOutfitIds.sort())
    })
  })

  it('opens an owner outfit detail with product-linked items', async () => {
    renderAt('/outfits/outfit-work-minimal')

    expect(await screen.findByRole('heading', { name: 'Di lam toi gian' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Áo blouse cổ vuông/ })).toHaveAttribute('href', '/products/prd-blouse-01')
    expect(screen.getByRole('link', { name: /Quần tây ống suông/ })).toHaveAttribute('href', '/products/prd-trousers-01')
  })

  it('renames an outfit and removes an item', async () => {
    const user = userEvent.setup()
    renderAt('/outfits/outfit-work-minimal')

    await user.clear(await screen.findByLabelText('Tên outfit'))
    await user.type(screen.getByLabelText('Tên outfit'), 'Đi làm thứ hai')
    await user.click(screen.getByRole('button', { name: 'Lưu tên outfit' }))
    await user.click(screen.getByRole('button', { name: 'Xóa món Áo blouse cổ vuông' }))

    expect(await screen.findByRole('heading', { name: 'Đi làm thứ hai' })).toBeInTheDocument()
    await waitFor(() => {
      const outfit = getDatabase().outfits.find(item => item.id === 'outfit-work-minimal')
      expect(outfit?.name).toBe('Đi làm thứ hai')
      expect(outfit?.items.some(item => item.id === 'outfit-item-blouse-white')).toBe(false)
    })
  })

  it('changes an outfit item variant only to an active variant', async () => {
    const user = userEvent.setup()
    renderAt('/outfits/outfit-work-minimal', databaseWithInactiveVariant())

    const select = await screen.findByLabelText('Đổi phiên bản Áo blouse cổ vuông')
    expect(screen.queryByRole('option', { name: /Xám tắt/ })).not.toBeInTheDocument()

    await user.selectOptions(select, 'var-blouse-01-black-m')

    await waitFor(() => {
      const outfit = getDatabase().outfits.find(item => item.id === 'outfit-work-minimal')
      expect(outfit?.items.find(item => item.id === 'outfit-item-blouse-white')?.variantId).toBe('var-blouse-01-black-m')
    })
  })

  it('adds one item and the entire outfit to cart', async () => {
    const user = userEvent.setup()
    renderAt('/outfits/outfit-ai-cafe')

    await user.click(await screen.findByRole('button', { name: 'Thêm Áo dệt kim cổ lọ vào giỏ' }))
    expect(await screen.findByText('Đã thêm món vào giỏ hàng')).toBeInTheDocument()
    await waitFor(() => expect(getDatabase().cartLines).toHaveLength(1))

    await user.click(screen.getByRole('button', { name: 'Thêm toàn bộ outfit vào giỏ' }))
    expect(await screen.findByText('Đã thêm toàn bộ outfit vào giỏ hàng')).toBeInTheDocument()
    await waitFor(() => expect(getDatabase().cartLines.reduce((total, line) => total + line.quantity, 0)).toBe(3))
  })

  it('shows unavailable outfit items and skips them when adding the entire outfit to cart', async () => {
    const user = userEvent.setup()
    const database = databaseWithCustomer()
    const inactiveDatabase = {
      ...database,
      products: database.products.map(product =>
        product.id === 'prd-trousers-01' ? { ...product, active: false } : product,
      ),
    }
    renderAt('/outfits/outfit-work-minimal', inactiveDatabase)

    expect(await screen.findByText('Quần tây ống suông')).toBeInTheDocument()
    expect(screen.getByText('Sản phẩm này hiện không thể thêm vào giỏ')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thêm toàn bộ outfit vào giỏ' }))

    expect(await screen.findByText(/Đã thêm các món còn khả dụng vào giỏ/)).toBeInTheDocument()
    expect(screen.getByText(/Bỏ qua Quần tây ống suông/)).toBeInTheDocument()
    await waitFor(() => {
      const cartLines = getDatabase().cartLines
      expect(cartLines).toHaveLength(2)
      expect(cartLines.some(line => line.productId === 'prd-trousers-01')).toBe(false)
    })
  })

  it('shows a no-access state for a private outfit owned by someone else', async () => {
    const database = databaseWithCustomer()
    const privateOutfit: Outfit = {
      id: 'outfit-private-other',
      ownerId: 'usr-other',
      name: 'Outfit riêng của người khác',
      source: 'manual',
      visibility: 'private',
      createdAt: '2026-09-28T09:00:00.000Z',
      updatedAt: '2026-09-28T09:00:00.000Z',
      items: [
        {
          id: 'other-item-01',
          productId: 'prd-blouse-01',
          variantId: 'var-blouse-white-m',
          addedBy: 'owner',
        },
      ],
    }

    renderAt('/outfits/outfit-private-other', {
      ...database,
      outfits: [...database.outfits, privateOutfit],
    })

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy outfit' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Tên outfit')).not.toBeInTheDocument()
  })
})
