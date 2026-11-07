import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'

export function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#FBF9F9] px-6 py-20 text-[#222222]">
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 text-sm font-semibold text-[#1C1B1B]">404</p>
        <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">Không tìm thấy trang</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#5E5F5D]">
          Đường dẫn này không còn hoạt động hoặc đã được chuyển sang vị trí khác trong StyleMind.
        </p>
        <Link
          to={ROUTES.home}
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1C1B1B] px-5 text-sm font-semibold text-white transition hover:bg-[#583d4b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B] focus-visible:ring-offset-2"
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  )
}
