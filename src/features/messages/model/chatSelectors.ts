import type { DemoDatabase } from '@/app/store/types'
import type { ChatSession } from '@/entities/chat/model/types'
import type { User } from '@/entities/user/model/types'
import { canChatAboutWardrobe, getWardrobeSettings } from '@/features/sharing/model/shareSelectors'

export function chatSessionId(ownerId: string, email: string) {
  return `chat-${ownerId}-${email.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.replace(/-$/, '')
}

export function upsertableChatSession(ownerId: string, email: string, now: string): ChatSession {
  return {
    id: chatSessionId(ownerId, email),
    wardrobeOwnerId: ownerId,
    participantEmail: email.toLowerCase(),
    createdAt: now,
    updatedAt: now,
  }
}

export interface ChatThreadSummary {
  session: ChatSession
  title: string
  subtitle: string
  initials: string
  lastMessage: string
  lastAt: string
  isLocked: boolean
  lockReason: string
}

export function selectChatThreadsForUser(database: DemoDatabase, user: User): ChatThreadSummary[] {
  return database.chatSessions
    .filter(session => session.wardrobeOwnerId === user.id || session.participantEmail.toLowerCase() === user.email.toLowerCase())
    .filter(session => session.wardrobeOwnerId === user.id || canChatAboutWardrobe(database, session.wardrobeOwnerId, user.email))
    .map(session => {
      const owner = database.users.find(item => item.id === session.wardrobeOwnerId)
      const participant = database.users.find(item => item.email.toLowerCase() === session.participantEmail.toLowerCase())
      const messages = database.chatMessages
        .filter(message => message.sessionId === session.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      const latest = messages[messages.length - 1]
      const isOwner = session.wardrobeOwnerId === user.id
      const canChat = canChatAboutWardrobe(database, session.wardrobeOwnerId, session.participantEmail)
      const settings = getWardrobeSettings(database, session.wardrobeOwnerId)

      return {
        session,
        title: isOwner ? participant?.fullName ?? session.participantEmail : owner?.fullName ?? 'Chủ tủ đồ',
        subtitle: isOwner ? session.participantEmail : `Tủ đồ của ${owner?.fullName ?? 'người dùng'}`,
        initials: isOwner ? participant?.avatarInitials ?? session.participantEmail.slice(0, 2).toUpperCase() : owner?.avatarInitials ?? 'SM',
        lastMessage: latest?.body ?? 'Chưa có tin nhắn',
        lastAt: latest?.createdAt ?? session.createdAt,
        isLocked: !canChat,
        lockReason: settings.visibility === 'private'
          ? 'Tủ đồ đang riêng tư'
          : 'Quyền truy cập đã bị thu hồi',
      }
    })
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt))
}
