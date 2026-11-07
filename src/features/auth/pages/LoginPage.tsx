import { Eye, EyeOff } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { identityErrorMessage } from '@/shared/api/identityApi'
import { Button, TextField, useToast } from '@/shared/ui'

import { AuthLayout } from '../components/AuthLayout'
import type { LoginInput } from '../data/authRepository'
import { useAuth } from '../model/useAuth'
import { validateLoginInput } from '../model/validators'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const toast = useToast()
  const verifiedEmail = (location.state as { verifiedEmail?: string } | null)?.verifiedEmail
  const [input, setInput] = useState<LoginInput>({ email: verifiedEmail ?? '', password: '', remember: true })
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
      setSubmitError(identityErrorMessage(error, 'Không thể đăng nhập'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Đăng nhập" description="Một tài khoản dùng chung cho khách hàng và quản trị viên StyleMind.">
      <h1 className="font-display text-4xl font-semibold">Đăng nhập</h1>
      <form className="mt-10 grid gap-6" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={input.email}
          error={errors.email}
          className="!rounded-none !border-0 !border-b !bg-transparent !px-0"
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
            className="!rounded-none !border-0 !border-b !bg-transparent !pl-0 pr-11"
          />
          <button
            type="button"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onClick={() => setShowPassword(value => !value)}
            className="absolute right-2 top-8 grid h-8 w-8 place-items-center rounded-md text-[#5E5F5D] transition hover:bg-[#EFEDED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]"
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
              className="h-4 w-4 accent-[#1C1B1B]"
            />
            Ghi nhớ đăng nhập
          </label>
          <Link to={ROUTES.forgotPassword} className="font-semibold text-[#1C1B1B] hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
        {submitError && <p className="rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]">{submitError}</p>}
        <Button type="submit" loading={submitting}>
          Đăng nhập
        </Button>
      </form>
      <div className="my-7 flex items-center gap-3 text-xs text-secondary"><span className="h-px flex-1 bg-[#E3E2E2]" />HOẶC<span className="h-px flex-1 bg-[#E3E2E2]" /></div>
      <button type="button" onClick={() => toast.info('Chức năng chưa hỗ trợ.')} className="min-h-11 w-full rounded-lg border border-[#C4C7C7] bg-transparent text-sm font-medium hover:bg-[#EFEDED]"><span aria-hidden="true" className="mr-3 font-bold text-[#4285F4]">G</span>Tiếp tục với Google</button>
      <p className="mt-5 text-sm text-[#5E5F5D]">
        Chưa có tài khoản?{' '}
        <Link to={ROUTES.register} className="font-semibold text-[#1C1B1B] hover:underline">
          Đăng ký
        </Link>
      </p>
    </AuthLayout>
  )
}
