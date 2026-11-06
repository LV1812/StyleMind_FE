import { describe, expect, it } from 'vitest'
import { createDemoSeed } from '@/app/data/demoSeed'
import { demoReducer, normalizeDemoDatabase } from '@/app/store/demoReducer'
import type { DemoDatabase } from '@/app/store/types'
import { loadDemoDatabase, DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'
import { selectFriends, validateInvitation, validateRetry, retrySeconds } from './friendshipModel'

const now = Date.now(), owner = 'usr-customer-01', mai = 'usr-friend-01'
function stateFor(userId = owner): DemoDatabase {
  return { ...createDemoSeed(), session: { userId, persistent: true }, friendships: [], friendInvitations: [] }
}
function invitation() {
  return { id: 'invite-mai', senderId: mai, recipientEmail: 'customer@stylemind.vn', status: 'PENDING' as const, delivery: 'SENT' as const, createdAt: now, lastAttemptAt: now, expiresAt: now + 86400000 }
}

describe('Friends demo state', () => {
  it('retry directs the sender to accept the opposite live invitation', () => {
    const state = stateFor()
    state.friendInvitations = [{ ...invitation(), id: 'old-out', senderId: owner, recipientEmail: 'friend@stylemind.vn', expiresAt: now - 1, lastAttemptAt: now - 60000 }, invitation()]
    expect(validateRetry(state, 'old-out', now)).toMatch(/chấp nhận/i)
    expect(demoReducer(state, { type: 'friends/retry', payload: { id: 'old-out', now } })).toEqual(state)
  })
  it('retry rejects a locked recipient with an actionable reason', () => {
    const state = stateFor()
    state.users = state.users.map(u => u.id === mai ? { ...u, status: 'locked' } : u)
    state.friendInvitations = [{ ...invitation(), id: 'old-out', senderId: owner, recipientEmail: 'friend@stylemind.vn', expiresAt: now - 1, lastAttemptAt: now - 60000 }]
    expect(validateRetry(state, 'old-out', now)).toMatch(/không thể nhận/i)
    expect(demoReducer(state, { type: 'friends/retry', payload: { id: 'old-out', now } })).toEqual(state)
  })
  it('malformed persisted timestamps never accept or offer a NaN retry', () => {
    const state = stateFor()
    state.friendInvitations = [{ ...invitation(), expiresAt: Number.NaN }]
    expect(demoReducer(state, { type: 'friends/accept', payload: { id: 'invite-mai', now } })).toEqual(state)
    expect(retrySeconds(state.friendInvitations[0], now)).toBeNull()
  })
  it('rejects self, invalid emails, duplicate and opposite pending invitations', () => {
    let state = stateFor()
    expect(validateInvitation(state, 'customer@stylemind.vn', now)).toBeTruthy()
    expect(validateInvitation(state, 'a@b', now)).toBeTruthy()
    state = demoReducer(state, { type: 'friends/invite', payload: { id: 'out', email: ' NEW@example.test ', now } })
    expect(state.friendInvitations).toHaveLength(1)
    expect(validateInvitation(state, 'new@example.test', now)).toBeTruthy()
    expect(demoReducer(state, { type: 'friends/invite', payload: { id: 'duplicate', email: 'new@example.test', now } }).friendInvitations).toHaveLength(1)
    state.friendInvitations = [invitation()]
    expect(validateInvitation(state, 'friend@stylemind.vn', now)).toMatch(/chấp nhận/i)
  })

  it('accepts only for the recipient and preserves Outfit and legacy sharing', () => {
    const state = stateFor(); state.friendInvitations = [invitation()]
    const wrong = { ...state, session: { userId: mai, persistent: true } }
    expect(demoReducer(wrong, { type: 'friends/accept', payload: { id: 'invite-mai', now } })).toEqual(wrong)
    const after = demoReducer(state, { type: 'friends/accept', payload: { id: 'invite-mai', now } })
    expect(selectFriends(after, owner).map(user => user.id)).toEqual([mai])
    expect(selectFriends(after, mai).map(user => user.id)).toEqual([owner])
    expect(after.outfits).toEqual(state.outfits)
    expect(after.wardrobeShares).toEqual(state.wardrobeShares)
    expect(validateInvitation(after, 'friend@stylemind.vn', now)).toBeTruthy()
    expect(state.friendships).toEqual([])
  })

  it('rejects expired acceptance and supports failed or expired retry after30s only', () => {
    const state = stateFor(mai)
    state.friendInvitations = [{ ...invitation(), delivery: 'FAILED', lastAttemptAt: now - 10000 }]
    expect(retrySeconds(state.friendInvitations[0], now)).toBe(20)
    expect(demoReducer(state, { type: 'friends/retry', payload: { id: 'invite-mai', now } })).toEqual(state)
    const after = demoReducer(state, { type: 'friends/retry', payload: { id: 'invite-mai', now: now + 20000 } })
    expect(after.friendInvitations[0].delivery).toBe('SENT')
    expect(retrySeconds(after.friendInvitations[0], now + 50000)).toBeNull()
    expect(after.friendInvitations[0].expiresAt).toBe(now + 20000 + 7 * 86400000)
    state.friendInvitations[0] = { ...invitation(), expiresAt: now - 1 }
    expect(demoReducer({ ...state, session: { userId: owner, persistent: true } }, { type: 'friends/accept', payload: { id: 'invite-mai', now } }).friendships).toEqual([])
  })

  it('unfriend invalidates pending invitations in both directions without deleting history', () => {
    let state = stateFor(); state.friendInvitations = [invitation()]
    state = demoReducer(state, { type: 'friends/accept', payload: { id: 'invite-mai', now } })
    state.friendInvitations = [{ ...invitation(), id: 'old-in' }, { ...invitation(), id: 'old-out', senderId: owner, recipientEmail: 'friend@stylemind.vn' }]
    const after = demoReducer(state, { type: 'friends/remove', payload: { friendId: mai, now } })
    expect(selectFriends(after, owner)).toEqual([])
    expect(after.friendInvitations.every(i => i.status === 'INVALIDATED')).toBe(true)
    expect(after.chatMessages).toEqual(state.chatMessages)
    expect(after.outfits).toEqual(state.outfits)
  })

  it('normalizes legacy storage without granting friendships or resetting customer data', () => {
    const legacy = createDemoSeed()
    delete (legacy as Partial<typeof legacy>).friendships
    delete (legacy as Partial<typeof legacy>).friendInvitations
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(legacy))
    const result = loadDemoDatabase(window.localStorage)
    expect(result.recovered).toBe(false)
    expect(result.database.friendships).toEqual([])
    expect(result.database.friendInvitations).toEqual([])
    expect(result.database.outfits).toEqual(legacy.outfits)
    expect(result.database.orders).toEqual(legacy.orders)
    expect(normalizeDemoDatabase(legacy).friendships).toEqual([])
  })
})
