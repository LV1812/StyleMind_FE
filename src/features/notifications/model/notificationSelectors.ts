import type { DemoDatabase } from '@/app/store/types'
import type { Notification } from '@/entities/notification/model/types'

export function selectNotificationsForUser(database: DemoDatabase, userId: string): Notification[] {
  return [...database.notifications]
    .filter(notification => notification.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function selectUnreadNotificationCount(database: DemoDatabase, userId: string): number {
  return database.notifications.filter(notification => notification.userId === userId && !notification.read).length
}
