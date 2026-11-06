import { describe, expect, it } from 'vitest'
import { createDemoSeed } from '@/app/data/demoSeed'
import { demoReducer, normalizeDemoDatabase } from '@/app/store/demoReducer'
import type { DemoDatabase } from '@/app/store/types'
import { canViewSharedOutfit, selectPublicOutfitByToken, selectPublicWardrobeByToken } from './shareSelectors'

const owner = 'usr-customer-01', friend = 'usr-friend-01', id = 'outfit-work-minimal'
function fixture(): DemoDatabase {
  const db = createDemoSeed()
  return { ...db, session: { userId: owner, persistent: true }, friendships: [{ id: 'pair', userAId: owner, userBId: friend, active: true, establishedAt: 1 }] }
}

describe('Per-Outfit sharing access', () => {
  it('does not grant PRIVATE access from a legacy email or wardrobe grant', () => {
    const db = fixture()
    expect(db.wardrobeShares.some(s => s.active && s.viewerEmail === 'friend@stylemind.vn')).toBe(true)
    expect(canViewSharedOutfit(db, id, 'friend@stylemind.vn')).toBe(false)
  })
  it('allows FRIENDS only while both accounts and the friendship are active', () => {
    let db = fixture()
    db.outfits = db.outfits.map(o => o.id === id ? { ...o, visibility: 'friends' } : o)
    db.wardrobeShares = []; db.outfitShares = []
    expect(canViewSharedOutfit(db, id, 'friend@stylemind.vn')).toBe(true)
    db = demoReducer(db, { type: 'friends/remove', payload: { friendId: friend, now: 2 } })
    expect(canViewSharedOutfit(db, id, 'friend@stylemind.vn')).toBe(false)
    expect(db.outfits.find(o => o.id === id)?.visibility).toBe('friends')
  })
  it('denies FRIENDS to locked viewers and does not grant PUBLIC via old tokens after leaving PUBLIC', () => {
    const db = fixture()
    db.users = db.users.map(u => u.id === friend ? { ...u, status: 'locked' } : u)
    db.outfits = db.outfits.map(o => o.id === id ? { ...o, visibility: 'friends', publicToken: 'old-token' } : o)
    expect(canViewSharedOutfit(db, id, 'friend@stylemind.vn')).toBe(false)
    expect(selectPublicOutfitByToken(db, 'old-token')).toBeNull()
  })
  it('never exposes PRIVATE or FRIENDS through a legacy public wardrobe link', () => {
    const db = fixture()
    db.wardrobeSettings = [{ ownerId: owner, visibility: 'public', updatedAt: '2026-10-31' }]
    db.wardrobePublicLinks = [{ id: 'old-link', ownerId: owner, token: 'old-wardrobe', active: true, createdAt: '2026-10-31' }]
    expect(selectPublicWardrobeByToken(db, 'old-wardrobe')?.outfits.map(d => d.outfit.id)).toEqual(['outfit-ai-cafe'])
  })
  it('normalizes unknown modes to private without losing unrelated data or legacy records', () => {
    const db = fixture()
    const malformed = { ...db, outfits: [{ ...db.outfits[0], visibility: 'protected' }] } as unknown as DemoDatabase
    const next = normalizeDemoDatabase(malformed)
    expect(next.outfits[0].visibility).toBe('private')
    expect(next.orders).toEqual(db.orders)
    expect(next.wardrobeShares).toEqual(db.wardrobeShares)
  })
})

describe('Owner visibility changes', () => {
  it('changes only the selected outfit and preserves a public token across off/on', () => {
    const db = fixture()
    const first = demoReducer(db, { type: 'outfit/visibilityChanged', payload: { outfitId: id, visibility: 'public', publicToken: 'stable-public' } })
    expect(first.outfits.find(o => o.id === id)?.visibility).toBe('public')
    const off = demoReducer(first, { type: 'outfit/visibilityChanged', payload: { outfitId: id, visibility: 'friends' } })
    expect(off.outfits.find(o => o.id === id)?.publicToken).toBe('stable-public')
    expect(selectPublicOutfitByToken(off, 'stable-public')).toBeNull()
    const on = demoReducer(off, { type: 'outfit/visibilityChanged', payload: { outfitId: id, visibility: 'public', publicToken: 'replacement' } })
    expect(on.outfits.find(o => o.id === id)?.publicToken).toBe('stable-public')
    expect(on.outfits.find(o => o.id === 'outfit-ai-cafe')).toEqual(db.outfits.find(o => o.id === 'outfit-ai-cafe'))
    expect(on.wardrobeShares).toEqual(db.wardrobeShares)
  })
  it('rejects guest, viewer and locked owner visibility changes', () => {
    const db = fixture()
    for (const userId of [null, friend, 'usr-admin-01']) {
      const state = { ...db, session: userId ? { userId, persistent: true } : null }
      expect(demoReducer(state, { type: 'outfit/visibilityChanged', payload: { outfitId: id, visibility: 'public' } })).toEqual(state)
    }
    const locked = { ...db, users: db.users.map(u => u.id === owner ? { ...u, status: 'locked' as const } : u) }
    expect(demoReducer(locked, { type: 'outfit/visibilityChanged', payload: { outfitId: id, visibility: 'public' } })).toEqual(locked)
  })
  it('does not let the old public toggle discard the retained token', () => {
    const db = fixture()
    const off = demoReducer(db, { type: 'outfit/publicToggled', payload: { outfitId: 'outfit-ai-cafe', enabled: false } })
    expect(off.outfits.find(o => o.id === 'outfit-ai-cafe')?.publicToken).toBe('pub-cafe-cuoi-tuan')
  })
})

