import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { Button, TextField } from '@/shared/ui'

import { AuthLayout } from '../components/AuthLayout'
import type { RegisterInput } from '../data/authRepository'
import { useAuth } from '../model/useAuth'
import { validateRegisterInput } from '../model/validators'

export function RegisterPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [input, setInput] = useState<RegisterInput>({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateRegisterInput(input)
    setErrors(nextErrors)
    setSubmitError('')
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await auth.register(input)
      navigate(ROUTES.verifyOtp, { replace: true })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể đăng ký')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Đăng ký" description="Tạo tài khoản khách hàng để lưu giỏ hàng, địa chỉ và đơn hàng của bạn.">
      <h1 className="font-display text-3xl font-semibold">Đăng ký</h1>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <TextField label="Họ tên" value={input.fullName} error={errors.fullName} onChange={event => setInput(value => ({ ...value, fullName: event.target.value }))} />
        <TextField label="Email" type="email" value={input.email} error={errors.email} onChange={event => setInput(value => ({ ...value, email: event.target.value }))} />
        <TextField label="Mật khẩu" type="password" value={input.password} error={errors.password} onChange={event => setInput(value => ({ ...value, password: event.target.value }))} />
        <TextField
          label="Xác nhận mật khẩu"
          type="password"
          value={input.confirmPassword}
          error={errors.confirmPassword}
          onChange={event => setInput(value => ({ ...value, confirmPassword: event.target.value }))}
        />
        {submitError && <p className="rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]">{submitError}</p>}
        <Button type="submit" loading={submitting}>Tạo tài khoản</Button>
      </form>
      <p className="mt-5 text-sm text-[#6F6B67]">
        Đã có tài khoản? <Link to={ROUTES.login} className="font-semibold text-[#684B5A] hover:underline">Đăng nhập</Link>
      </p>
    </AuthLayout>
  )
}
