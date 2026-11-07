import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { identityErrorMessage } from '@/shared/api/identityApi'
import { Button, TextField } from '@/shared/ui'

import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../model/useAuth'
import { ArrowLeft } from 'lucide-react'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      await auth.requestPasswordReset(email)
      setMessage('Nếu email đã đăng ký và đủ điều kiện, hướng dẫn đặt lại mật khẩu sẽ được gửi.')
    } catch (err) {
      setError(identityErrorMessage(err, 'Không thể gửi yêu cầu'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Quên mật khẩu" description="Nhập email để nhận hướng dẫn đặt lại mật khẩu cho tài khoản của bạn.">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#5E5F5D]">Khôi phục tài khoản</p>
      <h1 className="font-display text-4xl font-semibold">Quên mật khẩu?</h1>
      <form className="mt-8 grid gap-6" onSubmit={handleSubmit}>
        <TextField label="Email" type="email" autoComplete="email" className="!rounded-none !border-0 !border-b !border-[#C4C7C7] !bg-transparent !px-0" value={email} onChange={event => setEmail(event.target.value)} />
        {message && <p role="status" className="border-l-2 border-[#444746] pl-4 text-sm leading-6 text-[#5E5F5D]">{message}</p>}
        {error && <p role="alert" className="rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]">{error}</p>}
        <Button type="submit" loading={submitting}>Gửi hướng dẫn</Button>
      </form>
      {message && (
        <Button
          type="button"
          className="mt-3 w-full"
          variant="secondary"
          onClick={() => navigate(ROUTES.verifyOtp, { state: { flow: 'password-reset', email } })}
        >
          Nhập mã xác thực
        </Button>
      )}
      <Link to={ROUTES.login} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1C1B1B] hover:underline"><ArrowLeft size={16} aria-hidden="true" />Quay lại đăng nhập</Link>
    </AuthLayout>
  )
}
