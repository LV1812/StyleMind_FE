import { useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { Button } from '@/shared/ui'

import { useAuth } from '../model/useAuth'

export function AdminAccessPage() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-5 py-12 text-[#222222]">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold text-[#684B5A]">StyleMind Admin</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight">Khu vực quản trị</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#6F6B67]">
          Bạn đang đăng nhập bằng tài khoản quản trị. Layout quản trị chi tiết sẽ được triển khai ở phần tiếp theo.
        </p>
        <div className="mt-8 rounded-lg bg-[#FDFCFA] p-5 shadow-[0_18px_44px_rgba(58,54,50,0.10)]">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="font-semibold text-[#6F6B67]">Tài khoản</dt>
              <dd className="mt-1 font-semibold text-[#222222]">{currentUser?.fullName}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#6F6B67]">Vai trò</dt>
              <dd className="mt-1 font-semibold text-[#222222]">Quản trị viên</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.shop)}>
              Xem cửa hàng
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                logout()
                navigate(ROUTES.login, { replace: true })
              }}
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
