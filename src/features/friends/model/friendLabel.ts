import type { FriendDto } from '@/shared/api/communityApi'

export function friendLabel(friend: Pick<FriendDto, 'email' | 'display_name'>): string {
  const email = friend.email?.trim()
  const name = friend.display_name?.trim()
  if (email && name) return `${email} (${name})`
  return email || name || 'Một người bạn'
}
