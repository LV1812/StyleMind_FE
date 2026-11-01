import { Eye, EyeOff } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { DEMO_ADMIN, DEMO_CUSTOMER } from '@/shared/constants/demoAccounts'
import { Button, TextField } from '@/shared/ui'

import { AuthLayout } from '../components/AuthLayout'
import type { LoginInput } from '../data/authRepository'
import { useAuth } from '../model/useAuth'
import { validateLoginInput } from '../model/validators'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const [input, setInput] = useState<LoginInput>({ email: '', password: '', remember: true })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const redirectAfterLogin = (role: 'customer' | 'admin') => {
    if (role === 'admin') return ROUTES.admin
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
    return from && from !== ROUTES.login ? from : ROUTES.shop
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateLoginInput(input)
    setErrors(nextErrors)
    setSubmitError('')
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const user = await auth.login(input)
      navigate(redirectAfterLogin(user.role), { replace: true })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể đăng nhập')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Đăng nhập" description="Một tài khoản dùng chung cho khách hàng và quản trị viên StyleMind.">
      <h1 className="font-display text-3xl font-semibold">Đăng nhập</h1>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={input.email}
          error={errors.email}
          onChange={event => setInput(value => ({ ...value, email: event.target.value }))}
        />
        <div className="relative">
          <TextField
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={input.password}
            error={errors.password}
            onChange={event => setInput(value => ({ ...value, password: event.target.value }))}
            className="pr-11"
          />
          <button
            type="button"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onClick={() => setShowPassword(value => !value)}
            className="absolute right-2 top-8 grid h-8 w-8 place-items-center rounded-md text-[#6F6B67] transition hover:bg-[#EEE8E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
          >
            {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="inline-flex items-center gap-2 font-semibold text-[#3A3632]">
            <input
              type="checkbox"
              checked={input.remember}
              onChange={event => setInput(value => ({ ...value, remember: event.target.checked }))}
              className="h-4 w-4 accent-[#684B5A]"
            />
            Ghi nhớ đăng nhập
          </label>
          <Link to={ROUTES.forgotPassword} className="font-semibold text-[#684B5A] hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
        {submitError && <p className="rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]">{submitError}</p>}
        <Button type="submit" loading={submitting}>
          Đăng nhập
        </Button>
      </form>
      <div className="mt-5 rounded-lg bg-[#F4E7E8] p-3 text-xs leading-5 text-[#3A3632]">
        <p className="font-semibold">Tài khoản dùng thử</p>
        <p>Khách hàng: {DEMO_CUSTOMER.email} / {DEMO_CUSTOMER.password}</p>
        <p>Quản trị: {DEMO_ADMIN.email} / {DEMO_ADMIN.password}</p>
      </div>
      <p className="mt-5 text-sm text-[#6F6B67]">
        Chưa có tài khoản?{' '}
        <Link to={ROUTES.register} className="font-semibold text-[#684B5A] hover:underline">
          Đăng ký
        </Link>
      </p>
    </AuthLayout>
  )
}
