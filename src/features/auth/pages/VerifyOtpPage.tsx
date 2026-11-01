import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { Button } from '@/shared/ui'

import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../model/useAuth'

export function VerifyOtpPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const code = useMemo(() => digits.join(''), [digits])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      await auth.verifyOtp(code)
      navigate(ROUTES.login, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xác thực OTP')
    }
  }

  return (
    <AuthLayout title="Xác thực OTP" description="Nhập mã gồm sáu chữ số để hoàn tất xác thực tài khoản.">
      <h1 className="font-display text-3xl font-semibold">Xác thực OTP</h1>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-6 gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              aria-label={`Số OTP ${index + 1}`}
              value={digit}
              maxLength={1}
              inputMode="numeric"
              onChange={event => {
                const next = [...digits]
                next[index] = event.target.value.replace(/\D/g, '').slice(0, 1)
                setDigits(next)
              }}
              className="h-12 rounded-lg border border-[#D8D0C6] bg-white text-center text-lg font-semibold outline-none focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
            />
          ))}
        </div>
        <p className="text-sm text-[#6F6B67]">Mã xác thực: 123456</p>
        {error && <p className="rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]">{error}</p>}
        <Button type="submit">Xác thực</Button>
      </form>
    </AuthLayout>
  )
}
