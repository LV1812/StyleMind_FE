import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { saveApiSession } from '@/test/communitySession'

const userId = '10000000-0000-0000-0000-000000000001'
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); sessionStorage.clear() })

function renderRoute(path: string) {
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: userId, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  const fetcher = vi.fn(async (path: string) => new Response(JSON.stringify(path === '/api/v1/me'
    ? { account_id: userId, email: 'real@example.test', profile: null }
    : path.endsWith('/sharing') ? { outfit_id: userId, visibility: 'PRIVATE', public_enabled: false, public_token: null, public_enabled_at: null }
    : { outfit_id: userId, name: 'Outfit cá nhân', visibility: 'PRIVATE', items: [] }), { status: 200 }))
  vi.stubGlobal('fetch', fetcher)
  render(<AppProviders><RouterProvider router={createMemoryRouter(appRoutes, { initialEntries: [path] })} /></AppProviders>)
  return fetcher
}

describe('AI features while unsupported', () => {
  it.each(['/ai-wardrobe', '/wardrobes/new/ai'])('shows unsupported feedback at %s without starting AI', async path => {
    const fetcher = renderRoute(path)
    expect(await screen.findByRole('heading', { name: 'AI Stylist' })).toBeInTheDocument()
    expect(await screen.findByText('Chức năng chưa hỗ trợ.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Tin nhắn cho AI Stylist')).not.toBeInTheDocument()
    expect(fetcher.mock.calls.some(([url]) => /ai-stylist|recommendation/i.test(String(url)))).toBe(false)
  })

  it('does not expose simulated AI editing on an existing outfit', async () => {
    renderRoute(`/outfits/${userId}`)
    expect(await screen.findByRole('heading', { name: 'Outfit cá nhân' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'AI chỉnh outfit' })).not.toBeInTheDocument()
  })
})
