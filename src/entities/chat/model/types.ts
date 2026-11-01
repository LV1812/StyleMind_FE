export interface ChatSession {
  id: string
  wardrobeOwnerId: string
  participantEmail: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  senderId: string
  body: string
  createdAt: string
  readAt?: string
}
