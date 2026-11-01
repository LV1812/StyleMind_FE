import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import type { DemoDatabase } from '@/app/store/types'
import type { User } from '@/entities/user/model/types'
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

function renderOutfitDetail(database = databaseWithCustomer(), outfitId = 'outfit-work-minimal') {
  window.localStorage.clear()
  persistDatabase(database)
  const router = createMemoryRouter(appRoutes, { initialEntries: [`/outfits/${outfitId}`] })

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}

describe('AI stylist edit flow', () => {
  it('loads current outfit context including manually added items', async () => {
    renderOutfitDetail()

    const aiPanel = await screen.findByRole('region', { name: 'AI chỉnh outfit' })
    expect(within(aiPanel).getByText('Áo blouse cổ vuông')).toBeInTheDocument()
    expect(within(aiPanel).getByText('Quần tây ống suông')).toBeInTheDocument()
    expect(within(aiPanel).getByText('Blazer linen vai mềm')).toBeInTheDocument()
  })

  it('proposes a complementary product without mutating the outfit', async () => {
    const user = userEvent.setup()
    const initialLength = createDemoSeed().outfits.find(outfit => outfit.id === 'outfit-work-minimal')?.items.length
    renderOutfitDetail()

    await user.type(await screen.findByLabelText('Yêu cầu chỉnh outfit'), 'Thêm một áo khoác ngoài')
    await user.click(screen.getByRole('button', { name: 'Đề xuất thay đổi' }))

    const aiPanel = screen.getByRole('region', { name: 'AI chỉnh outfit' })
    expect(await within(aiPanel).findByText(/Đề xuất thêm/)).toBeInTheDocument()
    await waitFor(() => {
      const outfit = getDatabase().outfits.find(item => item.id === 'outfit-work-minimal')
      expect(outfit?.items).toHaveLength(initialLength ?? 0)
    })
  })

  it('replaces one product only after owner confirmation', async () => {
    const user = userEvent.setup()
    const initialLength = createDemoSeed().outfits.find(outfit => outfit.id === 'outfit-work-minimal')?.items.length
    renderOutfitDetail()

    await user.type(await screen.findByLabelText('Yêu cầu chỉnh outfit'), 'Thay áo blouse bằng áo sơ mi trắng')
    await user.click(screen.getByRole('button', { name: 'Đề xuất thay đổi' }))
    await user.click(await screen.findByRole('button', { name: 'Áp dụng đề xuất' }))

    expect(await screen.findByText('Đã áp dụng đề xuất AI')).toBeInTheDocument()
    await waitFor(() => {
      const outfit = getDatabase().outfits.find(item => item.id === 'outfit-work-minimal')
      expect(outfit?.items).toHaveLength(initialLength ?? 0)
      expect(outfit?.items.some(item => item.productId === 'prd-blouse-01')).toBe(false)
      expect(outfit?.items.some(item => item.productId === 'prd-shirt-03')).toBe(true)
    })
  })

  it('does not expose AI edit controls to a viewer', async () => {
    const viewer: User = {
      id: 'usr-viewer-01',
      role: 'customer',
      status: 'active',
      fullName: 'Lê Mai',
      email: 'mai@example.com',
      password: '123456',
      avatarInitials: 'LM',
      createdAt: '2026-09-27T09:00:00.000Z',
    }
    const database = databaseWithCustomer({
      users: [...createDemoSeed().users, viewer],
      session: { userId: viewer.id, persistent: true },
    })

    renderOutfitDetail(database)

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy outfit' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'AI chỉnh outfit' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Yêu cầu chỉnh outfit')).not.toBeInTheDocument()
  })
})
