import { beforeEach, expect, it, vi } from 'vitest'
import { storeIdentityTokens } from '@/shared/api/identityApi'
import { paymentApi } from './paymentClient'

beforeEach(() => { window.localStorage.clear(); window.sessionStorage.clear() })

it('uses the active Identity session and reads rotated tokens without persisting a second session', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ order_id: 'id' }), { status: 200 }))
  try {
    storeIdentityTokens({ access_token: 'identity-access-1', refresh_token: 'test-refresh', token_type: 'Bearer', expires_in: 900 }, false)
    await paymentApi.getOrder('id')
    expect(fetch.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer identity-access-1' })
    storeIdentityTokens({ access_token: 'identity-access-2', refresh_token: 'test-refresh-2', token_type: 'Bearer', expires_in: 900 }, false)
    await paymentApi.getOrder('id')
    expect(fetch.mock.calls[1][1]?.headers).toMatchObject({ Authorization: 'Bearer identity-access-2' })
  } finally {
    fetch.mockRestore()
  }
})
