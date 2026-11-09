import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { createDemoSeed } from '@/app/data/demoSeed'
import { DemoStoreProvider } from '@/app/store/DemoStoreProvider'
import { ToastProvider } from '@/shared/ui'
import { appRoutes } from '@/app/router/AppRouter'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import type { DemoDatabase } from '@/app/store/types'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'
import GuestCommerceProvider from '@/features/cart/model/GuestCommerceProvider'
import AccountCommerceProvider from '@/features/cart/model/AccountCommerceProvider'

vi.mock('@/features/auth', async importOriginal => ({
  ...await importOriginal<typeof import('@/features/auth')>(),
  LoginPage: () => <h1>Đăng nhập</h1>,
  useAuth: () => {
    const { state } = useDemoStore()
    return { currentUser: state.users.find(user => user.id === state.session?.userId) ?? null, isInitializing: false, logout: vi.fn() }
  },
}))

vi.mock('@/shared/api/http', async importOriginal => ({
  ...await importOriginal<typeof import('@/shared/api/http')>(),
  apiMode: () => false,
}))

function MutationProbe() {
  const { dispatch } = useDemoStore()
  return <button onClick={() => dispatch({ type: 'notification/readAll', payload: { userId: 'usr-customer-01', readAt: '2026-10-31' } })}>Mark notifications</button>
}
function setup(path: string, db: DemoDatabase) {
  localStorage.clear(); localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(db))
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  render(<DemoStoreProvider><GuestCommerceProvider><AccountCommerceProvider><ToastProvider><MutationProbe /><RouterProvider router={router} /></ToastProvider></AccountCommerceProvider></GuestCommerceProvider></DemoStoreProvider>)
}
async function externalWrite(db: DemoDatabase, announcedValue = JSON.stringify(db)) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(db))
  await act(async () => window.dispatchEvent(new StorageEvent('storage', { key: DEMO_STORAGE_KEY, storageArea: localStorage, newValue: announcedValue })))
}
function stored(): DemoDatabase { return JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY)!) }

describe('Sharing across open demo tabs', () => {
  it('revokes an open PUBLIC view and does not restore the old mode on the next local mutation', async () => {
    const db = createDemoSeed(); setup('/shared/outfits/pub-cafe-cuoi-tuan', db)
    expect(await screen.findByRole('heading', { name: 'Cafe cuoi tuan' })).toBeInTheDocument()
    const next = { ...db, outfits: db.outfits.map(o => ({ ...o, visibility: 'private' as const })), orders: [] }
    // The announced value may already be stale; the storage contains the latest write.
    await externalWrite(next, JSON.stringify(db))
    expect(await screen.findByRole('heading', { name: 'Không tìm thấy outfit' })).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Mark notifications' }))
    await waitFor(() => {
      expect(stored().outfits.find(o => o.id === 'outfit-ai-cafe')?.visibility).toBe('private')
      expect(stored().orders).toEqual([])
    })
  })
  it('removes an open FRIENDS detail when another tab removes the friendship', async () => {
    const db = createDemoSeed()
    db.session = { userId: 'usr-friend-01', persistent: true }
    db.friendships = [{ id: 'pair', userAId: 'usr-customer-01', userBId: 'usr-friend-01', active: true, establishedAt: 1 }]
    db.outfits = db.outfits.map(o => ({ ...o, visibility: 'friends' }))
    setup('/outfits/outfit-work-minimal', db)
    expect(await screen.findByRole('heading', { name: 'Di lam toi gian' })).toBeInTheDocument()
    await externalWrite({ ...db, friendships: db.friendships.map(f => ({ ...f, active: false })) })
    expect(await screen.findByRole('heading', { name: 'Không tìm thấy outfit' })).toBeInTheDocument()
  })
  it('follows a session logout from another tab without deleting wardrobe data', async () => {
    const db = createDemoSeed(); db.session = { userId: 'usr-customer-01', persistent: true }
    setup('/outfits/outfit-work-minimal', db)
    expect(await screen.findByRole('heading', { name: 'Di lam toi gian' })).toBeInTheDocument()
    await externalWrite({ ...db, session: null })
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(stored().outfits).toEqual(db.outfits)
  })
  it('ignores malformed external snapshots instead of resetting commerce data', async () => {
    const db = createDemoSeed(); setup('/shared/outfits/pub-cafe-cuoi-tuan', db)
    await act(async () => {
      localStorage.setItem(DEMO_STORAGE_KEY, '{broken')
      window.dispatchEvent(new StorageEvent('storage', { key: DEMO_STORAGE_KEY, storageArea: localStorage, newValue: '{broken' }))
    })
    expect(screen.getByRole('heading', { name: 'Cafe cuoi tuan' })).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Mark notifications' }))
    await waitFor(() => expect(stored().orders).toEqual(db.orders))
  })
})
