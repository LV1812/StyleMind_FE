import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { ROUTES } from '@/app/router/routes'
import authImage from '@/assets/stylemind-auth-hero.png'

interface AuthLayoutProps { title: string; description: string; children: ReactNode }
export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return <main className="flex min-h-screen bg-[#FBF9F9] text-[#1C1B1B]">
    <section className="relative hidden overflow-hidden lg:flex lg:w-1/2">
      <img src={authImage} alt="Ảnh thời trang StyleMind" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="relative mt-auto p-16 text-white"><Link to={ROUTES.home} className="font-display text-5xl">StyleMind</Link><p className="mt-4 text-lg text-white/80">Khám phá phong cách của riêng bạn.</p></div>
    </section>
    <section className="flex w-full items-center justify-center px-6 py-12 md:px-16 lg:w-1/2">
      <div className="w-full max-w-md"><Link to={ROUTES.home} className="mb-8 block font-display text-3xl lg:hidden">StyleMind</Link>{(title === 'Đăng nhập' || title === 'Đăng ký') && <Link to={ROUTES.home} className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-secondary transition hover:text-[#1C1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] focus-visible:ring-offset-2"><ArrowLeft size={16} aria-hidden="true" /> Về trang chủ</Link>}<p className="mb-2 text-sm text-secondary">{description}</p><span className="sr-only">{title}</span>{children}</div>
    </section>
  </main>
}
