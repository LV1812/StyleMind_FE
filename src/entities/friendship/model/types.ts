export interface Friendship {
  id: string
  userAId: string
  userBId: string
  active: boolean
  establishedAt: number
}

export interface FriendInvitation {
  id: string
  senderId: string
  recipientEmail: string
  status: 'PENDING' | 'ACCEPTED' | 'INVALIDATED'
  delivery: 'SENT' | 'FAILED' | 'UNKNOWN'
  createdAt: number
  lastAttemptAt: number
  expiresAt: number
}

export type FriendsAction =
  | { type: 'friends/invite'; payload: { id: string; email: string; now: number } }
  | { type: 'friends/accept' | 'friends/retry'; payload: { id: string; now: number } }
  | { type: 'friends/remove'; payload: { friendId: string; now: number } }
