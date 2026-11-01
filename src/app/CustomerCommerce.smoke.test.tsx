import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'

let router: ReturnType<typeof createMemoryRouter>

function renderApplication(initialEntry: string) {
  window.localStorage.clear()
  window.sessionStorage.clear()
  router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

async function loginWith(email: string, password: string) {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Mật khẩu'), password)
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/shop'))
}

async function searchFor(query: string) {
  const user = userEvent.setup()
  const searchInput = await screen.findByLabelText('Tìm kiếm sản phẩm')

  await user.type(searchInput, query)
  await user.keyboard('{Enter}')
  await waitFor(() => expect(router.state.location.pathname).toBe('/shop'))
}

async function navigateToCartAndCheckout() {
  const user = userEvent.setup()

  await user.click(await screen.findByLabelText('Giỏ hàng (1 sản phẩm)'))
  await user.click(screen.getByRole('button', { name: 'Tiến hành thanh toán' }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/checkout'))
}

describe('customer commerce smoke flow', () => {
  it('completes login, search, product selection, cart and COD checkout', async () => {
    const user = userEvent.setup()
    renderApplication('/login')

    await loginWith('customer@stylemind.vn', 'StyleMind123!')
    await searchFor('áo blouse')
    await user.click(await screen.findByRole('link', { name: /Áo blouse cổ vuông/ }))
    await user.click(screen.getByRole('button', { name: 'Kích thước M' }))

    expect(document.body).not.toHaveTextContent(/Còn \d+ sản phẩm|tồn kho|hết hàng|stock/i)

    await user.click(screen.getByRole('button', { name: 'Thêm vào giỏ' }))
    await navigateToCartAndCheckout()
    await user.click(screen.getByLabelText('Thanh toán khi nhận hàng'))
    await user.click(screen.getByRole('button', { name: 'Đặt hàng' }))

    expect(await screen.findByText('Đặt hàng thành công')).toBeInTheDocument()
  }, 10_000)
})
