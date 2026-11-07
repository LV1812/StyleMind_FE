import { ArrowRight, Shirt } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import authImage from '@/assets/stylemind-auth-hero.png'

export function HeroSection() {
  return <section className="mx-auto max-w-[1440px] px-6 py-12 md:px-16 md:py-20">
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div>
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#805B41]"><Shirt size={16} aria-hidden="true" /> Phong cách của bạn</div>
        <h1 className="font-display text-5xl leading-tight text-charcoal md:text-7xl">Mặc đẹp hơn,<br />chọn nhanh hơn.</h1>
        <p className="mb-8 mt-6 max-w-md text-lg leading-relaxed text-secondary">Khám phá trang phục phù hợp và lưu lại những outfit yêu thích trong tủ đồ của bạn.</p>
        <div className="flex flex-wrap gap-4"><Link to={ROUTES.shop} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-black px-8 py-3 text-sm font-medium text-white hover:bg-neutral-800">Khám phá cửa hàng <ArrowRight size={16} aria-hidden="true" /></Link><Link to={ROUTES.wardrobes} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-black px-8 py-3 text-sm font-medium text-black hover:bg-neutral-100">Tủ đồ của tôi</Link></div>
      </div>
      <div className="relative"><img src={authImage} alt="Thời trang StyleMind" className="aspect-[4/5] w-full rounded-[24px] object-cover shadow-[0_10px_40px_-15px_rgba(0,0,0,0.12)]" /></div>
    </div>
  </section>
}
