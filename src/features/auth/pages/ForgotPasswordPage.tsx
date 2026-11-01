import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { Button, TextField } from '@/shared/ui'

import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../model/useAuth'

export function ForgotPasswordPage() {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await auth.requestPasswordReset(email)
      setMessage('Liên kết đặt lại mật khẩu đã được tạo.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi yêu cầu')
    }
  }

  return (
    <AuthLayout title="Quên mật khẩu" description="Nhập email để nhận hướng dẫn đặt lại mật khẩu cho tài khoản của bạn.">
      <h1 className="font-display text-3xl font-semibold">Quên mật khẩu</h1>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <TextField label="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} />
        {message && <p className="rounded-lg bg-[#EAF2EC] px-3 py-2 text-sm font-semibold text-[#48755A]">{message}</p>}
        {error && <p className="rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]">{error}</p>}
        <Button type="submit">Gửi hướng dẫn</Button>
      </form>
      <Link to={ROUTES.login} className="mt-5 inline-block text-sm font-semibold text-[#684B5A] hover:underline">Quay lại đăng nhập</Link>
    </AuthLayout>
  )
}
