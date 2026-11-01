import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import type { DemoDatabase } from '@/app/store/types'
import type { WardrobePublicLink, WardrobeShare } from '@/entities/share/model/types'
import type { User } from '@/entities/user/model/types'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'

function databaseWithCustomer(overrides: Partial<DemoDatabase> = {}): DemoDatabase {
  return {
    ...createDemoSeed(),
    session: { userId: 'usr-customer-01', persistent: true },
    ...overrides,
  }
}

function viewerUser(email = 'friend@stylemind.vn'): User {
  return {
    id: 'usr-viewer-01',
    role: 'customer',
    status: 'active',
    fullName: 'Lê Mai',
    email,
    password: '123456',
    avatarInitials: 'LM',
    createdAt: '2026-09-27T09:00:00.000Z',
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

function renderRoute(path: string, database = databaseWithCustomer()) {
  window.localStorage.clear()
  persistDatabase(database)
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}

describe('Sharing flow', () => {
  it('grants view access to one email for the entire wardrobe', async () => {
    const user = userEvent.setup()
    renderRoute('/wardrobes')

    await user.click(await screen.findByRole('button', { name: 'Chia sẻ tủ đồ' }))
    await screen.findByRole('dialog', { name: 'Chia sẻ tủ đồ' })
    await user.type(await screen.findByLabelText('Email được chia sẻ'), 'newfriend@stylemind.vn')
    await user.click(screen.getByRole('button', { name: 'Xác nhận chia sẻ' }))

    await waitFor(() => expect(screen.getAllByText(/newfriend@stylemind.vn/).length).toBeGreaterThan(0))
    await waitFor(() => {
      const database = getDatabase()
      expect(database.wardrobeShares.some(
        share => share.ownerId === 'usr-customer-01' && share.viewerEmail === 'newfriend@stylemind.vn' && share.active,
      )).toBe(true)
      expect(database.chatSessions.some(session => session.participantEmail === 'newfriend@stylemind.vn')).toBe(true)
    })
  })

  it('revokes wardrobe access without affecting another viewer', async () => {
    const user = userEvent.setup()
    const otherViewerShare: WardrobeShare = {
      id: 'wardrobe-share-other-viewer',
      ownerId: 'usr-customer-01',
      viewerEmail: 'other-viewer@stylemind.vn',
      permission: 'view',
      active: true,
      createdAt: '2026-09-26T09:00:00.000Z',
    }
    renderRoute('/wardrobes', databaseWithCustomer({
      wardrobeShares: [...createDemoSeed().wardrobeShares, otherViewerShare],
    }))

    await user.click(await screen.findByRole('button', { name: 'Chia sẻ tủ đồ' }))
    await screen.findByRole('dialog', { name: 'Chia sẻ tủ đồ' })
    await user.click(await screen.findByRole('button', { name: 'Thu hồi friend@stylemind.vn' }))

    await waitFor(() => {
      const database = getDatabase()
      expect(database.wardrobeShares.some(share => share.viewerEmail === 'friend@stylemind.vn' && share.active)).toBe(false)
      expect(database.wardrobeShares.find(share => share.id === 'wardrobe-share-other-viewer')?.active).toBe(true)
    })
  })

  it('enables and disables a public link for the entire wardrobe', async () => {
    const user = userEvent.setup()
    renderRoute('/wardrobes')

    await user.click(await screen.findByRole('button', { name: 'Chia sẻ tủ đồ' }))
    await screen.findByRole('dialog', { name: 'Chia sẻ tủ đồ' })
    await user.click(screen.getByRole('button', { name: 'Bật link công khai' }))

    expect(await screen.findByText(/\/shared\/wardrobes\/pub-wardrobe-usr-customer-01/)).toBeInTheDocument()
    await waitFor(() => {
      const publicLink = getDatabase().wardrobePublicLinks.find(link => link.ownerId === 'usr-customer-01')
      expect(publicLink).toMatchObject({ token: 'pub-wardrobe-usr-customer-01', active: true })
    })

    await user.click(screen.getByRole('button', { name: 'Tắt link công khai' }))
    await waitFor(() => {
      const publicLink = getDatabase().wardrobePublicLinks.find(link => link.ownerId === 'usr-customer-01')
      expect(publicLink?.active).toBe(false)
    })
  })

  it('renders a public wardrobe without profile orders cart or AI chat history', async () => {
    const publicLink: WardrobePublicLink = {
      id: 'wardrobe-public-test',
      ownerId: 'usr-customer-01',
      token: 'pub-wardrobe-test',
      active: true,
      createdAt: '2026-09-27T09:00:00.000Z',
    }
    renderRoute('/shared/wardrobes/pub-wardrobe-test', databaseWithCustomer({
      session: null,
      wardrobePublicLinks: [publicLink],
      wardrobeSettings: [{
        ownerId: 'usr-customer-01',
        visibility: 'public' as const,
        publicToken: 'pub-wardrobe-test',
        updatedAt: '2026-09-27T09:00:00.000Z',
      }],
    }))

    expect(await screen.findByRole('heading', { name: /Tủ đồ của Nguyễn Thiên An/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Di lam toi gian' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cafe cuoi tuan' })).toBeInTheDocument()
    expect(screen.queryByText(/160/)).not.toBeInTheDocument()
    expect(screen.queryByText(/52/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Đơn hàng/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Giỏ hàng/)).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'AI chỉnh outfit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Chia sẻ outfit' })).not.toBeInTheDocument()
  })

  it('lists only wardrobes shared to the current customers email', async () => {
    const viewer = viewerUser()
    renderRoute('/shared-with-me', databaseWithCustomer({
      users: [...createDemoSeed().users, viewer],
      session: { userId: viewer.id, persistent: true },
    }))

    expect(await screen.findByRole('heading', { name: /Tủ đồ của Nguyễn Thiên An/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Xem tủ đồ' })).toHaveAttribute('href', '/shared-with-me/usr-customer-01')
  })

  it('renders a public outfit without height weight address orders cart or AI chat history', async () => {
    renderRoute('/shared/outfits/pub-cafe-cuoi-tuan', databaseWithCustomer({ session: null }))

    expect(await screen.findByRole('heading', { name: 'Cafe cuoi tuan' })).toBeInTheDocument()
    expect(screen.getByText('Áo dệt kim cổ lọ')).toBeInTheDocument()
    expect(screen.queryByText(/160/)).not.toBeInTheDocument()
    expect(screen.queryByText(/52/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Nguyễn Thiên An/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Đơn hàng/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Giỏ hàng/)).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'AI chỉnh outfit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Chia sẻ outfit' })).not.toBeInTheDocument()
  })

  it('prevents viewers from editing sharing renaming deleting or asking AI', async () => {
    const viewer = viewerUser()
    renderRoute('/outfits/outfit-ai-cafe', databaseWithCustomer({
      users: [...createDemoSeed().users, viewer],
      session: { userId: viewer.id, persistent: true },
    }))

    expect(await screen.findByRole('heading', { name: 'Cafe cuoi tuan' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Tên outfit')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'AI chỉnh outfit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Chia sẻ outfit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Xóa/ })).not.toBeInTheDocument()

    const itemGrid = screen.getByRole('region', { name: 'Các món trong outfit được chia sẻ' })
    expect(within(itemGrid).getByText('Áo dệt kim cổ lọ')).toBeInTheDocument()
  })
})
