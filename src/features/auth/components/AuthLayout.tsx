import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { ROUTES } from '@/app/router/routes'

interface AuthLayoutProps {
  title: string
  description: string
  children: ReactNode
}

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#FAF8F5] px-5 py-10 text-[#222222]">
      <div className="mx-auto grid min-h-[calc(100dvh-80px)] max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <section className="hidden md:block">
          <Link to={ROUTES.home} className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#684B5A] font-display text-base font-semibold text-white">S</span>
            <span className="font-display text-2xl font-semibold">StyleMind</span>
          </Link>
          <p className="mt-10 max-w-xl font-display text-5xl font-semibold leading-tight">{title}</p>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#6F6B67]">{description}</p>
        </section>
        <section className="mx-auto w-full max-w-md rounded-lg bg-[#FDFCFA] p-6 shadow-[0_24px_60px_rgba(58,54,50,0.10)]">
          <div className="mb-6 md:hidden">
            <Link to={ROUTES.home} className="font-display text-xl font-semibold text-[#222222]">
              StyleMind
            </Link>
          </div>
          {children}
        </section>
      </div>
    </main>
  )
}
