import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, ApiError } from './http'
import { clearApiSession, saveApiSession } from '@/test/communitySession'
import { communityApi } from './communityApi'

const id = '10000000-0000-0000-0000-000000000001'
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
beforeEach(() => { sessionStorage.clear(); saveApiSession('access-for-http-test', Date.now() + 60000) })
afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear() })

describe('EP06 Gateway HTTP contract', () => {
  it('sends a bearer only to the internal Gateway namespace and supports 204', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 })); vi.stubGlobal('fetch', fetcher)
    await communityApi.unfriend(id)
    const [path, options] = fetcher.mock.calls[0]
    expect(path).toBe(`/wardrobe-community/api/v1/me/friends/${id}`)
    expect(options.method).toBe('DELETE'); expect(options.headers.Authorization).toBe('Bearer access-for-http-test')
    expect(options.credentials).toBe('omit')
    await expect(apiRequest('https://untrusted.test/photo')).rejects.toThrow()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('uses exact invitation JSON and never sends the current-user ID or retries automatically', async () => {
    const fetcher = vi.fn().mockResolvedValue(json({ friend_invitation_id: id, status: 'PENDING', outcome: 'INVITATION_SENT', delivery_status: 'SMTP_ACCEPTED', retry_after_seconds: 0, expires_at: '2026-11-07T00:00:00Z' })); vi.stubGlobal('fetch', fetcher)
    await communityApi.invite(' Friend@Example.test ')
    expect(fetcher.mock.calls[0][0]).toBe('/wardrobe-community/api/v1/me/friend-invitations')
    expect(fetcher.mock.calls[0][1].body).toBe('{"recipient_email":"friend@example.test"}')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('sends empty accept/resend objects and uppercase visibility, using server UUIDs', async () => {
    const fetcher = vi.fn().mockImplementation(async () => json({})); vi.stubGlobal('fetch', fetcher)
    await communityApi.accept(id); await communityApi.resend(id); await communityApi.changeSharing(id, 'friends')
    expect(fetcher.mock.calls.map(call => call[1].body)).toEqual(['{}', '{}', '{"visibility":"FRIENDS"}'])
    await expect(communityApi.sharing('outfit-ai-cafe')).rejects.toThrow()
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
  it('uses backend pagination and makes public requests without JWT', async () => {
    const fetcher = vi.fn().mockImplementation(async () => json({ items: [], page: 2, size: 20, total_elements: 41, total_pages: 3 })); vi.stubGlobal('fetch', fetcher)
    const result = await communityApi.friends(2)
    expect(result.total_elements).toBe(41)
    expect(fetcher.mock.calls[0][0]).toBe('/wardrobe-community/api/v1/me/friends?page=2&size=20')
    await communityApi.publicOutfit('public-token')
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBeUndefined()
  })
  it('retains only safe problem metadata, not arbitrary downstream detail or a fake success', async () => {
    const fetcher = vi.fn().mockResolvedValue(json({ code: 'EMAIL_DELIVERY_UNKNOWN', detail: 'SECRET_CREDENTIAL', friend_invitation_id: id, retry_after_seconds: 30 }, 504)); vi.stubGlobal('fetch', fetcher)
    try { await communityApi.invite('friend@example.test'); throw new Error('Expected failure') } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      const problem = error as ApiError
      expect(problem.message).not.toContain('SECRET_CREDENTIAL')
      expect(problem.retryAfter).toBe(30); expect(problem.invitationId).toBe(id)
    }
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('clears an expired/rejected session and never calls fetch without a valid token', async () => {
    const fetcher = vi.fn().mockResolvedValue(json({}, 401)); vi.stubGlobal('fetch', fetcher)
    await expect(communityApi.friends(0)).rejects.toMatchObject({ status: 401 })
    await expect(communityApi.friends(0)).rejects.toMatchObject({ status: 401 })
    expect(fetcher).toHaveBeenCalledTimes(2) // API request and refresh attempt
    clearApiSession()
  })
  it('refreshes the Identity session and retries with the new bearer', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ access_token: 'rotated', refresh_token: 'next-refresh', token_type: 'Bearer', expires_in: 60 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetcher)
    await communityApi.unfriend(id)
    expect(fetcher.mock.calls[1][0]).toBe('/api/v1/auth/refresh')
    expect(fetcher.mock.calls[2][1].headers.Authorization).toBe('Bearer rotated')
  })
  it('does not log out a new session when an older request returns 401 late', async () => {
    let complete!: (response: Response) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { complete = resolve })))
    const oldRequest = communityApi.friends(0)
    saveApiSession('newer-token', Date.now() + 60000)
    complete(json({}, 401))
    await expect(oldRequest).rejects.toMatchObject({ status: 401 })
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 })); vi.stubGlobal('fetch', fetcher)
    await communityApi.unfriend(id)
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer newer-token')
  })
  it('rejects malformed page responses and reports unavailable network without demo fallback', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json({ items: [], total_elements: 9 })).mockRejectedValueOnce(new TypeError('private url'))
    vi.stubGlobal('fetch', fetcher)
    await expect(communityApi.friends(0)).rejects.toThrow()
    await expect(communityApi.friends(0)).rejects.toMatchObject({ status: 0 })
  })
})
