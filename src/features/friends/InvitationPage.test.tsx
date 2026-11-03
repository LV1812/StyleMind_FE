import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import { saveApiSession } from '@/test/communitySession'
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); localStorage.clear(); sessionStorage.clear() })
it('requires explicit acceptance and sends the fragment credential only in the POST body', async () => {
  const actor = '10000000-0000-0000-0000-000000000001', invitation = '20000000-0000-0000-0000-000000000002'
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: actor, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  const fetcher = vi.fn(async (path: string, options: RequestInit) => new Response(JSON.stringify(path === '/api/v1/me' ? { account_id: actor, email: 'test@example.test', profile: null } : { status: 'ACCEPTED' }), { status: 200 }))
  vi.stubGlobal('fetch', fetcher)
  const router = createMemoryRouter(appRoutes, { initialEntries: [`/friend-invitations/accept#invitation_id=${invitation}&token=secret-token`] })
  render(<AppProviders><RouterProvider router={router} /></AppProviders>)
  const user = userEvent.setup()
  const button = await screen.findByRole('button', { name: 'Chấp nhận kết bạn' })
  expect(fetcher.mock.calls.some(([, options]) => options.method === 'POST')).toBe(false)
  await user.click(button)
  await waitFor(() => expect(screen.getByText('Đã chấp nhận lời mời.')).toBeInTheDocument())
  const call = fetcher.mock.calls.find(([path]) => path.endsWith('/friend-invitations/accept'))!
  expect(call[0]).not.toContain('secret-token')
  expect(JSON.parse(call[1].body as string)).toEqual({ friend_invitation_id: invitation, token: 'secret-token' })
})
it('uses the new credential when another invitation opens in the same page', async () => {
  const actor = '10000000-0000-0000-0000-000000000001', first = '20000000-0000-0000-0000-000000000002', second = '30000000-0000-0000-0000-000000000003'
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  saveApiSession(`e30.${btoa(JSON.stringify({ sub: actor, roles: ['CUSTOMER'] }))}.sig`, Date.now() + 60000)
  const fetcher = vi.fn(async (path: string, _options: RequestInit) => new Response(JSON.stringify(path === '/api/v1/me' ? { account_id: actor, email: 'test@example.test', profile: null } : { status: 'ACCEPTED' }), { status: 200 }))
  vi.stubGlobal('fetch', fetcher)
  const router = createMemoryRouter(appRoutes, { initialEntries: [`/friend-invitations/accept#invitation_id=${first}&token=old`] })
  render(<AppProviders><RouterProvider router={router} /></AppProviders>)
  await screen.findByRole('button', { name: 'Chấp nhận kết bạn' })
  await router.navigate(`/friend-invitations/accept#invitation_id=${second}&token=new`)
  await userEvent.setup().click(await screen.findByRole('button', { name: 'Chấp nhận kết bạn' }))
  await waitFor(() => expect(fetcher.mock.calls.some(([path, options]) => path.endsWith('/friend-invitations/accept') && JSON.parse(options.body as string).friend_invitation_id === second && JSON.parse(options.body as string).token === 'new')).toBe(true))
})

