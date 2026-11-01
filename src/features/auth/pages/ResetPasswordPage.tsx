import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { Button, TextField } from '@/shared/ui'

import { AuthLayout } from '../components/AuthLayout'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')
    if (password.length < 8) {
      setError('Mật khẩu cần ít nhất 8 ký tự')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    setMessage('Mật khẩu đã được cập nhật.')
  }

  return (
    <AuthLayout title="Đặt lại mật khẩu" description="Tạo mật khẩu mới cho tài khoản của bạn.">
      <h1 className="font-display text-3xl font-semibold">Đặt lại mật khẩu</h1>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <TextField label="Mật khẩu mới" type="password" value={password} onChange={event => setPassword(event.target.value)} />
        <TextField label="Xác nhận mật khẩu" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
        {message && <p className="rounded-lg bg-[#EAF2EC] px-3 py-2 text-sm font-semibold text-[#48755A]">{message}</p>}
        {error && <p className="rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]">{error}</p>}
        <Button type="submit">Cập nhật mật khẩu</Button>
      </form>
      {message && <Link to={ROUTES.login} className="mt-5 inline-block text-sm font-semibold text-[#684B5A] hover:underline">Đăng nhập lại</Link>}
    </AuthLayout>
  )
}
