import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'

import { NotificationCard } from '../components/NotificationCard'
import { selectNotificationsForUser, selectUnreadNotificationCount } from '../model/notificationSelectors'

export function NotificationsPage() {
  const { state, dispatch } = useDemoStore()
  const { currentUser } = useAuth()

  if (!currentUser) return null

  const notifications = selectNotificationsForUser(state, currentUser.id)
  const unreadCount = selectUnreadNotificationCount(state, currentUser.id)

  const markRead = (notificationId: string) => {
    dispatch({ type: 'notification/read', payload: { notificationId, readAt: new Date().toISOString() } })
  }

  const markAllRead = () => {
    dispatch({ type: 'notification/readAll', payload: { userId: currentUser.id, readAt: new Date().toISOString() } })
  }

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-[#222222]">Thông báo</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F6B67]">
            Cập nhật về đơn hàng, tủ đồ, chia sẻ outfit và tài khoản của bạn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-fit rounded-full bg-[#F4E7E8] px-3 py-1 text-xs font-semibold text-[#684B5A]">
            {unreadCount} chưa đọc
          </span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#684B5A] px-3 text-sm font-semibold text-white"
              onClick={markAllRead}
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
      </div>

      {notifications.length > 0 ? (
        <div className="grid gap-3">
          {notifications.map(notification => (
            <NotificationCard key={notification.id} notification={notification} onRead={markRead} />
          ))}
        </div>
      ) : (
        <section className="rounded-lg border border-dashed border-[#D8D0C6] bg-white p-8">
          <h2 className="font-display text-2xl font-semibold text-[#222222]">Chưa có thông báo</h2>
          <p className="mt-2 text-sm leading-6 text-[#6F6B67]">Khi có cập nhật mới, StyleMind sẽ hiển thị tại đây.</p>
        </section>
      )}
    </section>
  )
}
