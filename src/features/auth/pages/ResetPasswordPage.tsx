import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { clearPasswordResetToken, identityErrorMessage, readPasswordResetToken } from '@/shared/api/identityApi'
import { Button, TextField } from '@/shared/ui'

import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../model/useAuth'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')
    if ([...password].length < 12 || new TextEncoder().encode(password).length > 72) {
      setError('Mật khẩu cần ít nhất 12 ký tự và không vượt quá 72 byte UTF-8.')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    const resetToken = readPasswordResetToken()
    if (!resetToken) {
      setError('Mã đặt lại đã hết hạn. Hãy yêu cầu mã mới.')
      return
    }
    setSubmitting(true)
    try {
      await auth.resetPassword(resetToken, password)
      clearPasswordResetToken()
      setMessage('Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại.')
    } catch (err) {
      setError(identityErrorMessage(err, 'Không thể đặt lại mật khẩu'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Đặt lại mật khẩu" description="Tạo mật khẩu mới cho tài khoản của bạn.">
      <h1 className="font-display text-3xl font-semibold">Đặt lại mật khẩu</h1>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <TextField label="Mật khẩu mới (ít nhất 12 ký tự)" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} />
        <TextField label="Xác nhận mật khẩu" type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
        {message && <p className="rounded-lg bg-[#EAF2EC] px-3 py-2 text-sm font-semibold text-[#48755A]">{message}</p>}
        {error && <p className="rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]">{error}</p>}
        <Button type="submit" loading={submitting}>Cập nhật mật khẩu</Button>
      </form>
      {message && <Button type="button" className="mt-5 w-full" onClick={() => navigate(ROUTES.login, { replace: true })}>Đăng nhập lại</Button>}
      {!readPasswordResetToken() && !message && (
        <Link to={ROUTES.forgotPassword} className="mt-5 inline-block text-sm font-semibold text-[#684B5A] hover:underline">Yêu cầu mã mới</Link>
      )}
    </AuthLayout>
  )
}
