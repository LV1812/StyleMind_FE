import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import type { DemoDatabase } from '@/app/store/types'
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

function renderBuilder(database = databaseWithCustomer()) {
  window.localStorage.clear()
  persistDatabase(database)
  const router = createMemoryRouter(appRoutes, { initialEntries: ['/wardrobes/new'] })

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}

describe('Manual outfit builder', () => {
  it('searches products and adds active variants to an outfit draft', async () => {
    const user = userEvent.setup()
    renderBuilder()

    await user.type(await screen.findByLabelText('Tìm sản phẩm cho outfit'), 'blouse')
    expect(screen.queryByText('Quần tây ống suông')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thêm Áo blouse cổ vuông' }))

    const draftPanel = screen.getByRole('region', { name: 'Outfit đang tạo' })
    expect(within(draftPanel).getByText('Áo blouse cổ vuông')).toBeInTheDocument()
    expect(within(draftPanel).getByText(/Trắng/)).toBeInTheDocument()
  })

  it('removes and changes variants inside the draft', async () => {
    const user = userEvent.setup()
    renderBuilder()

    await user.click(await screen.findByRole('button', { name: 'Thêm Áo blouse cổ vuông' }))
    await user.selectOptions(screen.getByLabelText('Đổi phiên bản draft Áo blouse cổ vuông'), 'var-blouse-01-black-m')
    expect(screen.getByText(/Đen/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Xóa Áo blouse cổ vuông khỏi draft' }))
    expect(screen.getByText('Chưa có món nào trong outfit')).toBeInTheDocument()
  })

  it('requires an outfit name before saving', async () => {
    const user = userEvent.setup()
    renderBuilder()

    await user.click(await screen.findByRole('button', { name: 'Thêm Áo blouse cổ vuông' }))
    await user.click(screen.getByRole('button', { name: 'Lưu outfit' }))

    expect(await screen.findByText('Vui lòng nhập tên outfit')).toBeInTheDocument()
    expect(getDatabase().outfits.some(outfit => outfit.name === 'Outfit chưa đặt tên')).toBe(false)
  })

  it('saves a manual outfit and navigates to its detail page', async () => {
    const user = userEvent.setup()
    const router = renderBuilder()

    await user.click(await screen.findByRole('button', { name: 'Thêm Áo blouse cổ vuông' }))
    await user.type(screen.getByLabelText('Tên outfit'), 'Outfit đi chơi')
    await user.click(screen.getByRole('button', { name: 'Lưu outfit' }))

    expect(await screen.findByRole('heading', { name: 'Outfit đi chơi' })).toBeInTheDocument()
    expect(router.state.location.pathname).toMatch(/^\/outfits\//)

    await waitFor(() => {
      const created = getDatabase().outfits.find(outfit => outfit.name === 'Outfit đi chơi')
      expect(created).toMatchObject({
        ownerId: 'usr-customer-01',
        source: 'manual',
        visibility: 'private',
      })
      expect(created?.items).toHaveLength(1)
    })
  })
})
