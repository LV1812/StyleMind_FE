import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'

function renderCartWithOneLine() {
  const database = createDemoSeed()

  window.localStorage.clear()
  window.localStorage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify({
      ...database,
      cartLines: [
        {
          id: 'cart-test-line',
          productId: 'prd-blouse-01',
          variantId: 'var-blouse-white-m',
          quantity: 1,
          source: 'shop',
        },
      ],
    }),
  )

  const router = createMemoryRouter(appRoutes, { initialEntries: ['/cart'] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

describe('CartPage', () => {
  it('requires confirmation before removing a line', async () => {
    const user = userEvent.setup()
    renderCartWithOneLine()

    await user.click(screen.getByRole('button', { name: 'Xóa Áo blouse cổ vuông' }))

    expect(screen.getByRole('dialog', { name: 'Xóa sản phẩm khỏi giỏ?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Xóa sản phẩm' }))

    expect(screen.getByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument()
  })
})
