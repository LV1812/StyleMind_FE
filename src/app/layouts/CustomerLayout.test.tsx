import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'

function renderCustomerLayout(initialEntry = '/') {
  window.localStorage.clear()
  window.localStorage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify({
      ...createDemoSeed(),
      session: { userId: 'usr-customer-01', persistent: true },
    }),
  )

  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

describe('CustomerLayout', () => {
  it('does not expose Travel Planner or Visual Studio navigation', () => {
    renderCustomerLayout('/')

    expect(screen.getAllByRole('link', { name: 'Trang chủ' }).length).toBeGreaterThan(0)
    expect(screen.queryByText('Travel Planner')).not.toBeInTheDocument()
    expect(screen.queryByText('Visual Studio')).not.toBeInTheDocument()
  })

  it('keeps wardrobe navigation reachable as a real customer page', async () => {
    renderCustomerLayout('/wardrobes')

    expect(await screen.findByRole('heading', { name: 'Tủ đồ của tôi' })).toBeInTheDocument()
  })
})
