import { FormEvent, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { identityErrorMessage, storePasswordResetToken } from '@/shared/api/identityApi'
import { Button, TextField } from '@/shared/ui'

import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../model/useAuth'

export function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const routeState = location.state as { flow?: 'registration' | 'password-reset'; email?: string; notice?: string } | null
  const flow = routeState?.flow ?? 'registration'
  const isPasswordReset = flow === 'password-reset'
  const email = routeState?.email ?? ''
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const digitInputs = useRef<Array<HTMLInputElement | null>>([])
  const [emailError, setEmailError] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(routeState?.notice ?? '')
  const [noticeKind, setNoticeKind] = useState<'info' | 'success'>(routeState?.notice ? 'info' : 'success')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const code = useMemo(() => digits.join(''), [digits])

  const applyDigits = (startIndex: number, value: string) => {
    const nextDigits = value.replace(/\D/g, '').slice(0, 6 - startIndex).split('')
    if (nextDigits.length === 0) return

    setError('')
    setDigits(current => {
      const next = [...current]
      nextDigits.forEach((digit, offset) => {
        next[startIndex + offset] = digit
      })
      return next
    })
    digitInputs.current[Math.min(startIndex + nextDigits.length, 5)]?.focus()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setEmailError('')
    setNotice('')
    if (!email.trim()) {
      setEmailError('Vui lòng nhập email đã đăng ký.')
      return
    }
    if (!/^\d{6}$/.test(code)) {
      setError('Mã xác thực gồm sáu chữ số.')
      return
    }
    setSubmitting(true)
    try {
      if (isPasswordReset) {
        const result = await auth.verifyPasswordReset(email, code)
        storePasswordResetToken(result.reset_token, result.expires_in)
        navigate(ROUTES.resetPassword, { replace: true })
      } else {
        await auth.verifyEmail(email, code)
        navigate(ROUTES.login, { replace: true, state: { verifiedEmail: email } })
      }
    } catch (err) {
      setError(identityErrorMessage(err, 'Không thể xác thực mã'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setEmailError('')
    setNotice('')
    setResending(true)
    try {
      if (isPasswordReset) await auth.requestPasswordReset(email)
      else await auth.resendEmailVerification(email)
      setNoticeKind('success')
      setNotice(isPasswordReset ? 'Nếu email hợp lệ, hướng dẫn đặt lại mật khẩu sẽ được gửi.' : 'Đã yêu cầu gửi mã xác thực mới.')
    } catch (err) {
      setError(identityErrorMessage(err, 'Không thể gửi mã mới'))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title={isPasswordReset ? 'Xác nhận đặt lại mật khẩu' : 'Xác thực email'}
      description={isPasswordReset ? 'Nhập mã sáu chữ số đã gửi đến email để tiếp tục.' : 'Nhập mã sáu chữ số đã gửi đến email để xác thực tài khoản.'}
    >
      <h1 className="font-display text-3xl font-semibold">{isPasswordReset ? 'Xác nhận đặt lại mật khẩu' : 'Xác thực email'}</h1>
      <p className="mt-2 text-sm leading-6 text-[#6F6B67]">
        Nhập mã gồm sáu chữ số đã gửi đến email của bạn. Mã có hiệu lực trong 5 phút.
      </p>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          readOnly
          error={emailError}
        />
        {!email && <p className="text-sm text-[#A94B4B]">Không tìm thấy email. Vui lòng quay lại <Link className="underline" to={isPasswordReset ? ROUTES.forgotPassword : ROUTES.register}>{isPasswordReset ? 'quên mật khẩu' : 'đăng ký'}</Link> để nhận mã.</p>}
        <div className="grid grid-cols-6 gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={element => { digitInputs.current[index] = element }}
              aria-label={`Số OTP ${index + 1}`}
              value={digit}
              maxLength={1}
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'verification-code-error' : undefined}
              onKeyDown={event => {
                if (event.key === 'Backspace' && !digit && index > 0) {
                  digitInputs.current[index - 1]?.focus()
                }
              }}
              onPaste={event => {
                event.preventDefault()
                applyDigits(index, event.clipboardData.getData('text'))
              }}
              onChange={event => {
                const value = event.target.value.replace(/\D/g, '')
                if (error) setError('')
                if (value.length > 1) {
                  applyDigits(index, value)
                  return
                }
                setDigits(current => current.map((currentDigit, digitIndex) => digitIndex === index ? value.slice(0, 1) : currentDigit))
                if (value && index < 5) digitInputs.current[index + 1]?.focus()
              }}
              className="h-12 min-w-0 rounded-lg border border-[#D8D0C6] bg-white text-center text-lg font-semibold outline-none focus:border-[#684B5A] focus:ring-2 focus:ring-[#684B5A]/20"
            />
          ))}
        </div>
        {notice && (
          <p
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${noticeKind === 'success' ? 'bg-[#EAF2EC] text-[#294C36]' : 'bg-[#F4E7E8] text-[#684B5A]'}`}
            role="status"
          >
            {notice}
          </p>
        )}
        {error && <p id="verification-code-error" className="rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]" role="alert">{error}</p>}
        <Button type="submit" loading={submitting} disabled={!email.trim()}>{isPasswordReset ? 'Xác nhận mã' : 'Xác thực email'}</Button>
        <Button type="button" variant="secondary" loading={resending} disabled={!email.trim()} onClick={handleResend}>
          Gửi mã mới
        </Button>
      </form>
    </AuthLayout>
  )
}
