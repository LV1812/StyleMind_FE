import type { DemoDatabase } from '@/app/store/types'
import type { FriendInvitation, FriendsAction } from '@/entities/friendship/model/types'

const TTL = 7 * 86400000
const normalizeEmail = (email: string) => email.trim().toLowerCase()
const currentUser = (db: DemoDatabase) => db.users.find(u => u.id === db.session?.userId && u.status === 'active' && u.role === 'customer')
const pairMatches = (a: string, b: string, x: string, y: string) => (a === x && b === y) || (a === y && b === x)

export function areFriends(db: DemoDatabase, a: string, b: string): boolean {
  return db.friendships.some(f => f.active && pairMatches(f.userAId, f.userBId, a, b))
}

export function selectFriends(db: DemoDatabase, userId: string) {
  const ids = new Set(db.friendships.filter(f => f.active && (f.userAId === userId || f.userBId === userId)).map(f => f.userAId === userId ? f.userBId : f.userAId))
  return db.users.filter(u => ids.has(u.id) && u.status === 'active' && u.role === 'customer')
}

export function retrySeconds(invitation: FriendInvitation, now: number): number | null {
  if (![invitation.expiresAt, invitation.lastAttemptAt, now].every(Number.isFinite)) return null
  if (invitation.status !== 'PENDING' || (invitation.expiresAt > now && invitation.delivery === 'SENT')) return null
  return Math.max(0, Math.ceil((invitation.lastAttemptAt + 30000 - now) / 1000))
}

function validateRecipient(db: DemoDatabase, value: string, now: number): string | null {
  const me = currentUser(db), email = normalizeEmail(value)
  if (!me) return 'Vui lòng đăng nhập bằng tài khoản khách hàng.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Nhập email đầy đủ, ví dụ banbe@example.com.'
  if (email === normalizeEmail(me.email)) return 'Bạn không thể tự mời chính mình.'
  const recipient = db.users.find(u => normalizeEmail(u.email) === email)
  if (recipient && (recipient.status !== 'active' || recipient.role !== 'customer')) return 'Tài khoản này không thể nhận lời mời.'
  if (recipient && areFriends(db, me.id, recipient.id)) return 'Hai bạn đã là bạn bè.'
  if (recipient && db.friendInvitations.some(i => i.senderId === recipient.id && normalizeEmail(i.recipientEmail) === normalizeEmail(me.email) && i.status === 'PENDING' && i.expiresAt > now && i.delivery === 'SENT')) return 'Bạn đã nhận lời mời từ người này. Mở Đã nhận để chấp nhận.'
  return null
}

export function validateInvitation(db: DemoDatabase, value: string, now: number): string | null {
  const invalid = validateRecipient(db, value, now)
  if (invalid) return invalid
  const me = currentUser(db)!, email = normalizeEmail(value)
  if (db.friendInvitations.some(i => i.senderId === me.id && normalizeEmail(i.recipientEmail) === email && i.status !== 'ACCEPTED' && i.status !== 'INVALIDATED')) return 'Bạn đã có lời mời cho email này. Kiểm tra Đã gửi để xem trạng thái hoặc gửi lại.'
  return null
}

export function validateRetry(db: DemoDatabase, id: string, now: number): string | null {
  const me = currentUser(db), invitation = db.friendInvitations.find(i => i.id === id)
  if (!me || !invitation || invitation.senderId !== me.id) return 'Bạn không thể gửi lại lời mời này.'
  const seconds = retrySeconds(invitation, now)
  if (seconds === null) return 'Lời mời không thể gửi lại ở trạng thái hiện tại.'
  if (seconds > 0) return `Vui lòng chờ ${seconds} giây trước khi gửi lại.`
  return validateRecipient(db, invitation.recipientEmail, now)
}

export function reduceFriends(db: DemoDatabase, action: FriendsAction): DemoDatabase {
  const me = currentUser(db)
  if (!me || !Number.isFinite(action.payload.now)) return db
  const now = action.payload.now
  if (action.type === 'friends/invite') {
    if (validateInvitation(db, action.payload.email, now) || db.friendInvitations.some(i => i.id === action.payload.id)) return db
    return { ...db, friendInvitations: [...db.friendInvitations, { id: action.payload.id, senderId: me.id, recipientEmail: normalizeEmail(action.payload.email), status: 'PENDING', delivery: 'SENT', createdAt: now, lastAttemptAt: now, expiresAt: now + TTL }] }
  }
  if (action.type === 'friends/remove') {
    const peer = db.users.find(u => u.id === action.payload.friendId)
    if (!peer || !areFriends(db, me.id, peer.id)) return db
    return {
      ...db,
      friendships: db.friendships.map(f => pairMatches(f.userAId, f.userBId, me.id, peer.id) ? { ...f, active: false } : f),
      friendInvitations: db.friendInvitations.map(i => i.status === 'PENDING' && ((i.senderId === me.id && normalizeEmail(i.recipientEmail) === normalizeEmail(peer.email)) || (i.senderId === peer.id && normalizeEmail(i.recipientEmail) === normalizeEmail(me.email))) ? { ...i, status: 'INVALIDATED' } : i),
    }
  }
  const invitation = db.friendInvitations.find(i => i.id === action.payload.id)
  if (!invitation) return db
  if (action.type === 'friends/retry') {
    if (validateRetry(db, invitation.id, now)) return db
    return { ...db, friendInvitations: db.friendInvitations.map(i => i.id === invitation.id ? { ...i, delivery: 'SENT', lastAttemptAt: now, expiresAt: now + TTL } : i) }
  }
  const sender = db.users.find(u => u.id === invitation.senderId && u.status === 'active' && u.role === 'customer')
  if (!sender || sender.id === me.id || normalizeEmail(invitation.recipientEmail) !== normalizeEmail(me.email) || invitation.status !== 'PENDING' || !Number.isFinite(invitation.expiresAt) || invitation.expiresAt <= now || invitation.delivery !== 'SENT') return db
  const pair = db.friendships.find(f => pairMatches(f.userAId, f.userBId, me.id, sender.id))
  return {
    ...db,
    friendships: pair ? db.friendships.map(f => f.id === pair.id ? { ...f, active: true, establishedAt: now } : f) : [...db.friendships, { id: `friendship-${[me.id, sender.id].sort().join('-')}`, userAId: me.id, userBId: sender.id, active: true, establishedAt: now }],
    friendInvitations: db.friendInvitations.map(i => i.id === invitation.id ? { ...i, status: 'ACCEPTED' } : i.status === 'PENDING' && ((i.senderId === me.id && normalizeEmail(i.recipientEmail) === normalizeEmail(sender.email)) || (i.senderId === sender.id && normalizeEmail(i.recipientEmail) === normalizeEmail(me.email))) ? { ...i, status: 'INVALIDATED' } : i),
  }
}
