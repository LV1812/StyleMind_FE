import { afterEach, expect, it, vi } from 'vitest'
import { commerceRequest } from './http'
const auth = vi.hoisted(() => ({ token: 'old', refresh: vi.fn() }))
vi.mock('../shared/api/identityApi', () => ({ readIdentitySession: () => ({ accessToken: auth.token, refreshToken: 'refresh', persistent: false }), refreshIdentitySession: auth.refresh }))
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); auth.token = 'old' })
it('refreshes an expired Identity token and retries an authenticated request once', async () => {
  auth.refresh.mockImplementation(async () => { auth.token = 'new'; return true })
  const fetch = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 401 })).mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
  vi.stubGlobal('fetch', fetch)
  await expect(commerceRequest('/api/v1/admin/products')).resolves.toEqual({ ok: true })
  expect(auth.refresh).toHaveBeenCalledWith('old')
  expect((fetch.mock.calls[1][1].headers as Headers).get('Authorization')).toBe('Bearer new')
})
