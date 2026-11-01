export type NotificationType = 'order' | 'account' | 'system' | 'ai' | 'share' | 'wardrobe'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  readAt?: string
  createdAt: string
  link: string | null
}
