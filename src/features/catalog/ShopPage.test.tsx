import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'

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
  it('clears all active filters and restores the catalog', async () => {
    const user = userEvent.setup()
    renderShop()

    await user.click(screen.getByRole('checkbox', { name: 'Áo' }))
    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))

    expect(screen.getAllByRole('article')).toHaveLength(createDemoSeed().products.length)
  })

  it('shows the empty-search state in Vietnamese', async () => {
    renderShop('/shop?q=khongcosanpham')

    expect(await screen.findByText('Không tìm thấy sản phẩm phù hợp')).toBeInTheDocument()
  })
})
