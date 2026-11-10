import { FormEvent, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { identityErrorMessage, storePasswordResetToken } from '@/shared/api/identityApi'
import { Button, TextField } from '@/shared/ui'

import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../model/useAuth'
import { isValidEmail } from '../model/validators'

const EMAIL_FIELD_ID = 'verify-otp-email'

export function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const routeState = location.state as { flow?: 'registration' | 'password-reset'; email?: string; notice?: string } | null
  const flow = routeState?.flow ?? 'registration'
  const isPasswordReset = flow === 'password-reset'
  const [email, setEmail] = useState(routeState?.email?.trim() ?? '')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const digitInputs = useRef<Array<HTMLInputElement | null>>([])
  const [emailError, setEmailError] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(routeState?.notice ?? '')
  const [noticeKind, setNoticeKind] = useState<'info' | 'success'>(routeState?.notice ? 'info' : 'success')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const code = useMemo(() => digits.join(''), [digits])

  const checkEmail = () => {
    const message = !email.trim() ? 'Vui lòng nhập email đã đăng ký.' : !isValidEmail(email) ? 'Email không hợp lệ.' : ''
    setEmailError(message)
    if (message) document.getElementById(EMAIL_FIELD_ID)?.focus()
    return !message
  }

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
    if (!checkEmail()) return
    if (!/^\d{6}$/.test(code)) {
      setError('Mã xác thực gồm sáu chữ số.')
      return
    }
    setSubmitting(true)
    try {
      if (isPasswordReset) {
        const result = await auth.verifyPasswordReset(email.trim(), code)
        storePasswordResetToken(result.reset_token, result.expires_in)
        navigate(ROUTES.resetPassword, { replace: true })
      } else {
        await auth.verifyEmail(email.trim(), code)
        navigate(ROUTES.login, { replace: true, state: { verifiedEmail: email.trim() } })
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
    if (!checkEmail()) return
    setResending(true)
    try {
      if (isPasswordReset) await auth.requestPasswordReset(email.trim())
      else await auth.resendEmailVerification(email.trim())
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
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#5E5F5D]">Xác minh tài khoản</p>
      <h1 className="font-display text-4xl font-semibold">{isPasswordReset ? 'Xác nhận đặt lại mật khẩu' : 'Xác thực email'}</h1>
      <p className="mt-2 text-sm leading-6 text-[#5E5F5D]">
        Nhập mã gồm sáu chữ số đã gửi đến email của bạn. Mã có hiệu lực trong 5 phút.
      </p>
      <form className="mt-6 grid gap-4" noValidate onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          className="!rounded-none !border-0 !border-b !border-[#C4C7C7] !bg-transparent !px-0"
          id={EMAIL_FIELD_ID}
          value={email}
          onChange={event => { setEmail(event.target.value); if (emailError) setEmailError('') }}
          error={emailError}
        />
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
              className="h-12 min-w-0 rounded-lg border border-[#C4C7C7] bg-white text-center text-lg font-semibold outline-none focus:border-[#1C1B1B] focus:ring-2 focus:ring-[#1C1B1B]/20"
            />
          ))}
        </div>
        {notice && (
          <p
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${noticeKind === 'success' ? 'bg-[#EAF2EC] text-[#294C36]' : 'bg-[#E9E8E7] text-[#1C1B1B]'}`}
            role="status"
          >
            {notice}
          </p>
        )}
        {error && <p id="verification-code-error" className="rounded-lg bg-[#FCEAEA] px-3 py-2 text-sm font-semibold text-[#A94B4B]" role="alert">{error}</p>}
        <Button type="submit" loading={submitting}>{isPasswordReset ? 'Xác nhận mã' : 'Xác thực email'}</Button>
        <Button type="button" variant="secondary" loading={resending} onClick={handleResend}>
          Gửi mã mới
        </Button>
      </form>
    </AuthLayout>
  )
}
