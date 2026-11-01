import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'

export function HeroSection() {
  return (
    <section
      className="relative min-h-[72dvh] overflow-hidden bg-[#222222] px-5 py-16 text-white md:px-8"
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(34,34,34,0.72), rgba(34,34,34,0.22)), url(https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1800&h=1200&fit=crop&auto=format)',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="mx-auto flex min-h-[56dvh] max-w-[var(--container-wide)] items-center">
        <div className="max-w-2xl">
          <h1 className="font-display text-5xl font-semibold leading-none md:text-7xl">StyleMind</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/86 md:text-lg">
            Mua sắm thời trang nữ với sản phẩm thật trong catalog StyleMind và xây dựng tủ đồ AI cá nhân hóa theo vóc dáng, dịp mặc và phong cách của bạn.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={ROUTES.aiWardrobe}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-[#222222] transition hover:bg-[#F4E7E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Tạo tủ đồ của tôi
            </Link>
            <Link
              to={ROUTES.shop}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/60 px-5 text-sm font-semibold text-white transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Mua sắm ngay
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
