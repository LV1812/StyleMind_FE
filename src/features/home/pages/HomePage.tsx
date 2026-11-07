import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useCommerceDisplay } from '@/features/cart/model/GuestCommerceProvider'
import { Button } from '@/shared/ui'

import { HeroSection } from '../components/HeroSection'
import { ProductRail } from '../components/ProductRail'
import { WardrobeIntro } from '../components/WardrobeIntro'
import { Shirt } from 'lucide-react'

export function HomePage() {
  const { state, loading, error, retry } = useCommerceDisplay()
  const activeCategoryIds = new Set(state.categories.filter(category => category.active).map(category => category.id))
  const activeProducts = state.products.filter(
    product => product.active && activeCategoryIds.has(product.categoryId) && product.variants.some(variant => variant.active),
  )
  const newest = [...activeProducts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const featured = activeProducts.filter(product => product.featured)
  const activeCategories = state.categories.filter(category => category.active).sort((a, b) => a.order - b.order)
  return (
    <>
      <HeroSection />
      {loading && <p role="status" className="p-8">Đang tải sản phẩm…</p>}
      {error && <div className="mx-auto grid max-w-[var(--container-wide)] gap-4 px-8 py-6"><p role="alert">{error}</p><Button className="w-fit" onClick={retry}>Tải lại sản phẩm</Button></div>}
      {!loading && !error && <>
      <section className="bg-[#FFFFFF] px-5 py-14 md:px-8">
        <div className="mx-auto max-w-[var(--container-wide)]">
          <div className="flex flex-wrap items-end justify-between gap-4"><h2 className="font-display text-3xl font-semibold text-[#222222]">Mua sắm theo danh mục</h2><Link to={ROUTES.shop} className="text-sm font-semibold text-[#805B41] transition-colors hover:text-[#503A2B] hover:underline">Xem tất cả →</Link></div>
          <div className={`mt-6 grid gap-6 sm:grid-cols-2 ${activeCategories.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
            {activeCategories.map(category => {
              const image = activeProducts.filter(product => product.categoryId === category.id).flatMap(product => product.variants.filter(variant => variant.active).flatMap(variant => variant.images)).find(item => item.isPrimary)
                ?? activeProducts.filter(product => product.categoryId === category.id).flatMap(product => product.variants.filter(variant => variant.active).flatMap(variant => variant.images))[0]
              return (
              <Link
                key={category.id}
                to={`${ROUTES.shop}?category=${category.id}`}
                className={`group relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#EFEDED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#805B41] ${activeCategories.length === 2 ? 'sm:aspect-[5/4]' : ''}`}
              >
                {image ? <img src={image.url} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <span className="grid h-full place-items-center text-[#C4C7C7]"><Shirt size={48} strokeWidth={1} /></span>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white"><h3 className="font-display text-3xl">{category.label}</h3><p className="mt-2 text-sm text-white/80">Khám phá →</p></div>
              </Link>
            )})}
          </div>
        </div>
      </section>
      <ProductRail title="Sản phẩm mới" products={newest} />
      {featured.length > 0 && <ProductRail title="Được yêu thích" products={featured} />}
      <WardrobeIntro />
      </>}
    </>
  )
}
