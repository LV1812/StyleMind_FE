import { Link, useParams } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'
import { formatCurrency } from '@/shared/lib/formatCurrency'

import { selectPublicOutfitByToken } from '../model/shareSelectors'

export function PublicOutfitPage() {
  const { token } = useParams()
  const { state } = useDemoStore()
  const detail = token ? selectPublicOutfitByToken(state, token) : null

  if (!detail) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] text-[#222222]">
        <section className="mx-auto max-w-[var(--container-wide)] px-5 py-10 md:px-8">
          <h1 className="font-display text-4xl font-semibold text-[#222222]">Không tìm thấy outfit</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6F6B67]">
            Liên kết này không còn hoạt động hoặc outfit đã chuyển về chế độ riêng tư.
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
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#684B5A]">Outfit công khai</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-[#222222]">{detail.outfit.name}</h1>
          {detail.outfit.description && (
            <p className="mt-3 text-sm leading-6 text-[#6F6B67]">{detail.outfit.description}</p>
          )}
        </div>

        <section aria-label="Các món trong outfit công khai" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {detail.items.map(item => (
            <Link
              key={item.item.id}
              to={`/products/${item.product.id}`}
              className="overflow-hidden rounded-lg border border-[#E3DAD0] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
            >
              {item.image && <img src={item.image.url} alt={item.image.alt} className="aspect-[4/5] w-full object-cover" />}
              <div className="p-4">
                <h2 className="font-semibold text-[#222222]">{item.product.name}</h2>
                <p className="mt-1 text-sm text-[#6F6B67]">
                  {item.variant.color} · {item.variant.size}
                </p>
                <p className="mt-3 font-semibold text-[#222222]">{formatCurrency(item.price)}</p>
              </div>
            </Link>
          ))}
        </section>
      </section>
    </main>
  )
}
