import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useDemoStore } from '@/app/store/DemoStoreProvider'

import { HeroSection } from '../components/HeroSection'
import { ProductRail } from '../components/ProductRail'
import { WardrobeIntro } from '../components/WardrobeIntro'

export function HomePage() {
  const { state } = useDemoStore()
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
      <WardrobeIntro />
      <ProductRail title="Sản phẩm mới" products={newest} />
      <ProductRail title="Được yêu thích" products={featured} />
      <section className="bg-[#FDFCFA] px-5 py-14 md:px-8">
        <div className="mx-auto max-w-[var(--container-wide)]">
          <h2 className="font-display text-3xl font-semibold text-[#222222]">Mua theo danh mục</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {activeCategories.map(category => (
              <Link
                key={category.id}
                to={`${ROUTES.shop}?category=${category.id}`}
                className="rounded-lg bg-[#FAF8F5] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(58,54,50,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
              >
                <h3 className="font-semibold text-[#222222]">{category.label}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6F6B67]">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
