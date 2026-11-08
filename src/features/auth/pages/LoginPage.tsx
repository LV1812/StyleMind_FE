import { Eye, EyeOff } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { identityErrorMessage } from '@/shared/api/identityApi'
import { Button, TextField } from '@/shared/ui'

import { AuthLayout } from '../components/AuthLayout'
import type { LoginInput } from '../data/authRepository'
import { intendedPathFromState } from '../model/redirect'
import { useAuth } from '../model/useAuth'
import { validateLoginInput } from '../model/validators'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const verifiedEmail = (location.state as { verifiedEmail?: string } | null)?.verifiedEmail
  const [input, setInput] = useState<LoginInput>({ email: verifiedEmail ?? '', password: '', remember: true })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const redirectAfterLogin = (role: 'customer' | 'admin') => {
    if (role === 'admin') return ROUTES.admin
    return intendedPathFromState(location.state) ?? ROUTES.shop
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
      <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={input.email}
          error={errors.email}
          placeholder="ten@email.com"
          className="auth-login-input min-h-12 !rounded-xl !border-[#D9D7D5] !bg-white !px-4 placeholder:font-normal placeholder:text-[#969391]"
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
            placeholder="Nhập mật khẩu"
            className="auth-login-input min-h-12 !rounded-xl !border-[#D9D7D5] !bg-white !pl-4 !pr-12 placeholder:font-normal placeholder:text-[#969391]"
          />
          <button
            type="button"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onClick={() => setShowPassword(value => !value)}
            className="absolute right-2 top-8 grid h-10 w-10 place-items-center rounded-lg text-[#5E5F5D] transition hover:bg-[#EFEDED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1B1B]"
          >
            {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
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
        {submitError && <p role="alert" className="rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]">{submitError}</p>}
        <Button type="submit" loading={submitting} className="min-h-12 rounded-xl">
          Đăng nhập
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-[#5E5F5D]">
        Chưa có tài khoản?{' '}
        <Link to={ROUTES.register} className="font-semibold text-[#1C1B1B] hover:underline">
          Đăng ký
        </Link>
      </p>
    </AuthLayout>
  )
}
