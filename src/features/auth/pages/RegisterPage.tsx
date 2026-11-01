import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { IdentityApiError, identityErrorMessage } from '@/shared/api/identityApi'
import { Button, TextField } from '@/shared/ui'

import { AuthLayout } from '../components/AuthLayout'
import type { RegisterInput } from '../data/authRepository'
import { useAuth } from '../model/useAuth'
import { validateRegisterInput } from '../model/validators'

export function RegisterPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [input, setInput] = useState<RegisterInput>({ email: '', password: '', confirmPassword: '' })
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
      navigate(ROUTES.verifyOtp, { replace: true, state: { flow: 'registration', email: input.email.trim() } })
    } catch (error) {
      if (
        error instanceof IdentityApiError
        && (error.code === 'EMAIL_DELIVERY_UNKNOWN' || error.code === 'EMAIL_DELIVERY_FAILED')
      ) {
        const notice = error.code === 'EMAIL_DELIVERY_UNKNOWN'
          ? 'Tài khoản đã được tạo nhưng chưa xác nhận được trạng thái gửi email. Nếu bạn đã nhận mã, hãy nhập mã bên dưới; nếu chưa, hãy yêu cầu gửi lại.'
          : 'Tài khoản đã được tạo nhưng email xác nhận chưa gửi được. Bạn không cần đăng ký lại; hãy thử gửi mã xác nhận mới.'

        navigate(ROUTES.verifyOtp, {
          replace: true,
          state: { flow: 'registration', email: input.email.trim(), notice },
        })
        return
      }

      setSubmitError(identityErrorMessage(error, 'Không thể đăng ký'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Đăng ký" description="Tạo tài khoản khách hàng để lưu giỏ hàng, địa chỉ và đơn hàng của bạn.">
      <h1 className="font-display text-3xl font-semibold">Đăng ký</h1>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <TextField label="Email" type="email" value={input.email} error={errors.email} onChange={event => setInput(value => ({ ...value, email: event.target.value }))} />
        <TextField label="Mật khẩu (ít nhất 12 ký tự)" type="password" autoComplete="new-password" value={input.password} error={errors.password} onChange={event => setInput(value => ({ ...value, password: event.target.value }))} />
        <TextField
          label="Xác nhận mật khẩu"
          type="password"
          autoComplete="new-password"
          value={input.confirmPassword}
          error={errors.confirmPassword}
          onChange={event => setInput(value => ({ ...value, confirmPassword: event.target.value }))}
        />
        {submitError && <p className="rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]">{submitError}</p>}
        <Button type="submit" loading={submitting}>Tạo tài khoản</Button>
      </form>
      <p className="mt-4 text-sm text-[#6F6B67]">
        Đã nhận mã xác nhận?{' '}
        <Link
          to={ROUTES.verifyOtp}
          state={{ flow: 'registration', email: input.email.trim() }}
          className="font-semibold text-[#684B5A] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#684B5A]"
        >
          Nhập mã tại đây
        </Link>
      </p>
      <p className="mt-5 text-sm text-[#6F6B67]">
        Đã có tài khoản? <Link to={ROUTES.login} className="font-semibold text-[#684B5A] hover:underline">Đăng nhập</Link>
      </p>
    </AuthLayout>
  )
}
