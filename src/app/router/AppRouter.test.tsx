import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { appRoutes } from './AppRouter'

describe('AppRouter', () => {
  it('renders a Vietnamese not-found page for an unknown route', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/khong-ton-tai'] })

    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy trang' })).toBeInTheDocument()
  })
})
