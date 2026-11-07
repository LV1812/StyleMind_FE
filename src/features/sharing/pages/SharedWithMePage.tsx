import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'
import { chatSessionId } from '@/features/messages/model/chatSelectors'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { formatDate } from '@/shared/lib/formatDate'

import { getWardrobeVisibilityLabel, selectSharedWardrobesForEmail } from '../model/shareSelectors'

export function SharedWithMePage() {
  const { state } = useDemoStore()
  const { currentUser } = useAuth()

  if (!currentUser) return null

  const sharedWardrobes = selectSharedWardrobesForEmail(state, currentUser.email)

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div>
        <h1 className="font-display text-4xl font-semibold leading-tight text-[#222222]">Tủ đồ được chia sẻ với tôi</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5E5F5D]">
          Những tủ đồ được cấp quyền qua email sẽ hiển thị tại đây. Bạn chỉ có quyền xem và chat khi quyền truy cập còn hiệu lực.
        </p>
      </div>

      {sharedWardrobes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {sharedWardrobes.map(item => (
            <article key={item.share.id} className="rounded-lg border border-[#E3E2E2] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 flex-none place-items-center rounded-lg bg-[#1C1B1B] font-display text-sm font-semibold text-white">
                  {item.ownerInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#1C1B1B]">{getWardrobeVisibilityLabel(item.settings.visibility)}</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-[#222222]">Tủ đồ của {item.ownerName}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#5E5F5D]">
                    {item.outfitCount} outfit · {formatCurrency(item.total)} · Cập nhật {formatDate(item.updatedAt)}
                  </p>
                </div>
              </div>

              {!item.canOpen && (
                <p className="mt-4 rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]">
                  Quyền xem tủ đồ đang tạm khóa.
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to={`/shared-with-me/${item.ownerId}`}
                  className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] ${
                    item.canOpen ? 'bg-[#1C1B1B] text-white hover:bg-[#563E4A]' : 'pointer-events-none bg-[#EFEDED] text-[#8A8179]'
                  }`}
                  aria-disabled={!item.canOpen}
                >
                  Xem tủ đồ
                </Link>
                <Link
                  to={`${ROUTES.messages}?conversation=${chatSessionId(item.ownerId, currentUser.email)}`}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] ${
                    item.canChat ? 'bg-[#EFEDED] text-[#222222] hover:bg-[#E3E2E2]' : 'pointer-events-none bg-[#EFEDED] text-[#8A8179]'
                  }`}
                  aria-disabled={!item.canChat}
                >
                  <MessageCircle size={17} aria-hidden="true" />
                  Chat với chủ tủ đồ
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="rounded-lg border border-dashed border-[#C4C7C7] bg-white p-8">
          <h2 className="font-display text-2xl font-semibold text-[#222222]">Chưa có tủ đồ được chia sẻ</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5E5F5D]">
            Khi ai đó cấp quyền xem tủ đồ cho email của bạn, tủ đồ đó sẽ xuất hiện tại đây.
          </p>
        </section>
      )}
    </section>
  )
}
