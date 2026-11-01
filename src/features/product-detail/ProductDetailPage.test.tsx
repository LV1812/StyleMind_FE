import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'

let router: ReturnType<typeof createMemoryRouter>

function renderProductDetail(productId: string) {
  const database = createDemoSeed()

  window.localStorage.clear()
  window.localStorage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify({ ...database, session: { userId: 'usr-customer-01', persistent: true } }),
  )

  router = createMemoryRouter(appRoutes, { initialEntries: [`/products/${productId}`] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

function currentPath() {
  return router.state.location.pathname
}

describe('ProductDetailPage', () => {
  it('requires a size before adding a product to the cart', async () => {
    const user = userEvent.setup()
    renderProductDetail('prd-blouse-01')

    await user.click(screen.getByRole('button', { name: 'Thêm vào giỏ' }))

    expect(screen.getByText('Vui lòng chọn kích thước')).toBeInTheDocument()
  })

  it('buy now adds the selected variant and navigates to checkout', async () => {
    const user = userEvent.setup()
    renderProductDetail('prd-blouse-01')

    await user.click(screen.getByRole('button', { name: 'Kích thước M' }))
    await user.click(screen.getByRole('button', { name: 'Mua ngay' }))

    await waitFor(() => expect(currentPath()).toBe('/checkout'))
    expect(screen.getByLabelText('Giỏ hàng (1 sản phẩm)')).toBeInTheDocument()
  })
})
