import { Link, useParams } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { formatCurrency } from '@/shared/lib/formatCurrency'

import { selectPublicWardrobeByToken } from '../model/shareSelectors'

export function PublicWardrobePage() {
  const { token } = useParams()
  const { state } = useDemoStore()
  const wardrobe = token ? selectPublicWardrobeByToken(state, token) : null

  if (!wardrobe) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] text-[#222222]">
        <section className="mx-auto max-w-[var(--container-wide)] px-5 py-10 md:px-8">
          <h1 className="font-display text-4xl font-semibold text-[#222222]">Không tìm thấy tủ đồ</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6F6B67]">
            Liên kết này không còn hoạt động hoặc chủ tủ đồ đã tắt chia sẻ công khai.
          </p>
          <Link
            to={ROUTES.shop}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#684B5A] px-4 text-sm font-semibold text-white"
          >
            Xem sản phẩm
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#222222]">
      <section className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-5 py-8 md:px-8 md:py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#684B5A]">Tủ đồ công khai</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222]">
            Tủ đồ của {wardrobe.ownerName}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6F6B67]">
            Người sở hữu đã chia sẻ toàn bộ outfit trong tủ đồ qua liên kết public này.
          </p>
        </div>

        <section aria-label="Các outfit trong tủ đồ công khai" className="grid gap-5 lg:grid-cols-2">
          {wardrobe.outfits.map(detail => (
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
    </main>
  )
}
