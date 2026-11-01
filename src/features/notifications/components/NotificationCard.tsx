import { Link } from 'react-router-dom'

import type { Notification } from '@/entities/notification/model/types'
import { formatDate } from '@/shared/lib/formatDate'

interface NotificationCardProps {
  notification: Notification
  onRead: (notificationId: string) => void
}

export function NotificationCard({ notification, onRead }: NotificationCardProps) {
  return (
    <article className={`rounded-lg border p-5 shadow-sm ${notification.read ? 'border-[#E3DAD0] bg-white' : 'border-[#D8B9C2] bg-[#FFF9FB]'}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#222222]">{notification.title}</h2>
          <p className="mt-1 text-xs font-semibold text-[#8A8179]">{formatDate(notification.createdAt)}</p>
        </div>
        {!notification.read && (
          <span className="w-fit rounded-full bg-[#684B5A] px-3 py-1 text-xs font-semibold text-white">
            Mới
          </span>
        )}
      </div>
      <p className="mt-3 text-sm leading-6 text-[#6F6B67]">{notification.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {notification.link && (
          <Link
            to={notification.link}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#EEE8E1] px-3 text-sm font-semibold text-[#222222]"
          >
            Mở {notification.title}
          </Link>
        )}
        {!notification.read && (
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#F4E7E8] px-3 text-sm font-semibold text-[#684B5A]"
            onClick={() => onRead(notification.id)}
          >
            Đánh dấu đã đọc {notification.title}
          </button>
        )}
      </div>
    </article>
  )
}
