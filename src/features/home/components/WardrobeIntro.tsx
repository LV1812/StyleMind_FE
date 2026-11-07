import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ROUTES } from '@/app/router/routes'

const steps = [
  'Chọn sản phẩm quần áo thật trong cửa hàng.',
  'Chọn màu sắc và kích cỡ phù hợp.',
  'Lưu những outfit yêu thích vào tủ đồ.',
  'Chia sẻ phong cách cùng bạn bè.',
]

export function WardrobeIntro() {
  return (
    <section className="bg-[#FFFFFF] px-5 py-14 md:px-8">
      <div className="mx-auto max-w-[var(--container-wide)]">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#805B41]">Tủ đồ StyleMind</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-[#222222]">Tủ đồ dành riêng cho bạn</h2>
          <p className="mt-4 text-base leading-7 text-[#5E5F5D]">
            Lưu outfit yêu thích và chia sẻ phong cách cùng bạn bè.
          </p>
          <Link to={ROUTES.wardrobes} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1C1B1B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#444746]">Khám phá tủ đồ <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step} className="rounded-lg bg-[#F7F4F1] p-4">
              <span className="text-sm font-semibold text-[#805B41]">{String(index + 1).padStart(2, '0')}</span>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#3A3632]">{step}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
