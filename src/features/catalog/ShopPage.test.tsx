import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { commerceApi } from '@/api/commerce'
import type { CommerceProduct, ProductListQuery } from '@/api/commerce.types'
import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import type { Product } from '@/entities/product/model/types'

function toCommerceProduct(product: Product): CommerceProduct {
  return {
    product_id: product.id,
    category_id: product.categoryId,
    brand_id: `brand-${product.brand}`,
    category_name: product.categoryId,
    brand_name: product.brand,
    name: product.name,
    description: product.description,
    demographic_segment: null,
    product_status: product.active ? 'ACTIVE' : 'INACTIVE',
    variants: product.variants.map(variant => ({
      variant_id: variant.id,
      product_id: product.id,
      sku: variant.id,
      size: variant.size,
      color: variant.color,
      material: product.material,
      unit_price_vnd: variant.priceOverride ?? product.basePrice,
      variant_status: variant.active ? 'ACTIVE' : 'INACTIVE',
      available_quantity: variant.stock,
      images: variant.images.map((image, index) => ({
        image_id: image.id,
        variant_id: variant.id,
        image_url: image.url,
        alt_text: image.alt,
        display_order: index,
        is_primary: index === 0,
      })),
    })),
  }
}

function productPage(query: ProductListQuery = {}) {
  const page = query.page ?? 0
  const size = query.size ?? 20
  const keyword = query.keyword?.toLocaleLowerCase('vi')
  const filtered = createDemoSeed().products.filter(product =>
    (!keyword || product.name.toLocaleLowerCase('vi').includes(keyword))
    && (!query.category_id || product.categoryId === query.category_id),
  )
  return {
    items: filtered.slice(page * size, (page + 1) * size).map(toCommerceProduct),
    page,
    size,
    total_elements: filtered.length,
    total_pages: Math.ceil(filtered.length / size),
  }
}

function renderShop(initialEntry = '/shop') {
  window.localStorage.clear()
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

describe('ShopPage', () => {
  beforeEach(() => {
    vi.spyOn(commerceApi.products, 'list').mockImplementation(async query => productPage(query))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('clears all active filters and restores the catalog', async () => {
    const user = userEvent.setup()
    renderShop()

    await user.click(await screen.findByRole('checkbox', { name: 'Áo' }))
    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))

    expect(await screen.findAllByRole('article')).toHaveLength(Math.min(12, createDemoSeed().products.length))
  })

  it('shows the empty-search state in Vietnamese', async () => {
    renderShop('/shop?q=khongcosanpham')

    expect(await screen.findByText('Không tìm thấy sản phẩm phù hợp')).toBeInTheDocument()
  })

  it('requests the selected page from the Commerce API', async () => {
    renderShop('/shop?page=2')

    await waitFor(() => {
      expect(commerceApi.products.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, size: 12 }))
    })
  })
})
