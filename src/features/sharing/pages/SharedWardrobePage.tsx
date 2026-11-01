import { MessageCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { useAuth } from '@/features/auth'
import { chatSessionId } from '@/features/messages/model/chatSelectors'
import { formatCurrency } from '@/shared/lib/formatCurrency'

import { selectSharedWardrobeByOwner, selectWardrobeOutfits } from '../model/shareSelectors'

export function SharedWardrobePage() {
  const { ownerId } = useParams()
  const { state } = useDemoStore()
  const { currentUser } = useAuth()

  if (!currentUser || !ownerId) return null

  const shared = selectSharedWardrobeByOwner(state, ownerId, currentUser.email)
  const outfits = shared?.canOpen ? selectWardrobeOutfits(state, ownerId) : []

  if (!shared || !shared.canOpen) {
    return (
      <section className="mx-auto max-w-[var(--container-wide)] px-5 py-10 md:px-8">
        <Link to={ROUTES.sharedWithMe} className="text-sm font-semibold text-[#684B5A] hover:underline">
          Tủ đồ được chia sẻ với tôi
        </Link>
        <h1 className="mt-4 font-display text-4xl font-semibold text-[#222222]">Không thể mở tủ đồ</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#6F6B67]">
          Quyền truy cập của bạn đã bị thu hồi hoặc chủ tủ đồ đang để chế độ riêng tư.
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link to={ROUTES.sharedWithMe} className="text-sm font-semibold text-[#684B5A] hover:underline">
            Tủ đồ được chia sẻ với tôi
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222]">
            Tủ đồ của {shared.ownerName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F6B67]">
            Bạn có quyền xem toàn bộ outfit trong tủ đồ này. Mọi thao tác chỉnh sửa vẫn thuộc về chủ tủ đồ.
          </p>
        </div>
        <Link
          to={`${ROUTES.messages}?conversation=${chatSessionId(shared.ownerId, currentUser.email)}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white transition hover:bg-[#563E4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
        >
          <MessageCircle size={17} aria-hidden="true" />
          Chat với chủ tủ đồ
        </Link>
      </div>

      <section aria-label="Các outfit trong tủ đồ được chia sẻ" className="grid gap-5 lg:grid-cols-2">
        {outfits.map(detail => (
          <article key={detail.outfit.id} className="rounded-lg border border-[#E3DAD0] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#684B5A]">{detail.outfit.source === 'ai' ? 'Tạo với AI' : 'Tạo thủ công'}</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-[#222222]">{detail.outfit.name}</h2>
                {detail.outfit.description && (
                  <p className="mt-2 text-sm leading-6 text-[#6F6B67]">{detail.outfit.description}</p>
                )}
              </div>
              <span className="rounded-md bg-[#EEE8E1] px-2 py-1 text-xs font-semibold text-[#3A3632]">
                {detail.items.length} món
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {detail.items.map(item => (
                <Link
                  key={item.item.id}
                  to={`/products/${item.product.id}`}
                  className="grid grid-cols-[76px_1fr] gap-3 rounded-lg bg-[#FAF8F5] p-2 transition hover:-translate-y-0.5 hover:bg-[#F2EDE7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
                >
                  {item.image && (
                    <img src={item.image.url} alt={item.image.alt} className="aspect-[4/5] w-full rounded-md object-cover" />
                  )}
                  <span className="min-w-0 py-1">
                    <span className="block truncate text-sm font-semibold text-[#222222]">{item.product.name}</span>
                    <span className="mt-1 block text-xs text-[#6F6B67]">
                      {item.variant.color} · {item.variant.size}
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-[#222222]">{formatCurrency(item.price)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </section>
  )
}
