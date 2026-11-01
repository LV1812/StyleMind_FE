import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import type { DemoDatabase } from '@/app/store/types'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'

function renderHome(database: DemoDatabase) {
  window.localStorage.clear()
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(database))

  render(
    <AppProviders>
      <RouterProvider router={createMemoryRouter(appRoutes, { initialEntries: ['/'] })} />
    </AppProviders>,
  )
}

describe('HomePage', () => {
  it('hides inactive products and categories from customer rails', async () => {
    const database = createDemoSeed()
    renderHome({
      ...database,
      products: database.products.map(product =>
        product.id === 'prd-blouse-01' ? { ...product, active: false } : product,
      ),
      categories: database.categories.map(category =>
        category.id === 'tops' ? { ...category, active: false } : category,
      ),
    })

    expect(await screen.findByRole('heading', { name: 'Sản phẩm mới' })).toBeInTheDocument()
    expect(document.querySelector('a[href="/products/prd-blouse-01"]')).toBeNull()
    expect(document.querySelector('a[href="/shop?category=tops"]')).toBeNull()
  })
})
