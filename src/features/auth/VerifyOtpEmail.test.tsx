import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { VerifyOtpPage } from './pages/VerifyOtpPage'

const auth = vi.hoisted(() => ({
  verifyEmail: vi.fn(),
  resendEmailVerification: vi.fn(),
  verifyPasswordReset: vi.fn(),
  requestPasswordReset: vi.fn(),
}))
vi.mock('./model/useAuth', () => ({ useAuth: () => auth }))

const renderPage = (state?: object) => render(
  <MemoryRouter initialEntries={[{ pathname: '/verify-otp', state }]}>
    <Routes>
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/login" element={<p>Trang đăng nhập</p>} />
    </Routes>
  </MemoryRouter>,
)
const fillCode = async (user: ReturnType<typeof userEvent.setup>, code = '123456') => {
  for (let index = 0; index < 6; index += 1) await user.type(screen.getByLabelText(`Số OTP ${index + 1}`), code[index])
}

beforeEach(() => { Object.values(auth).forEach(mock => mock.mockReset()) })

it('prefills the registration email and lets the user change it', async () => {
  const user = userEvent.setup()
  renderPage({ email: 'user@example.test' })
  const email = screen.getByLabelText(/^Email/)
  expect(email).toHaveValue('user@example.test')
  expect(email).not.toHaveAttribute('readonly')
  await user.clear(email)
  await user.type(email, 'other@example.test')
  expect(email).toHaveValue('other@example.test')
})

it('lets the user type the email when arriving without route state and validates it', async () => {
  const user = userEvent.setup()
  renderPage()
  const email = screen.getByLabelText(/^Email/)
  expect(email).toHaveValue('')
  await fillCode(user)
  await user.click(screen.getByRole('button', { name: 'Xác thực email' }))
  expect(screen.getByText('Vui lòng nhập email đã đăng ký.')).toBeInTheDocument()
  expect(email).toHaveFocus()
  await user.type(email, 'khong-hop-le')
  await user.click(screen.getByRole('button', { name: 'Xác thực email' }))
  expect(screen.getByText('Email không hợp lệ.')).toBeInTheDocument()
  expect(auth.verifyEmail).not.toHaveBeenCalled()
})

it('verifies with the typed email and returns to login with it', async () => {
  const user = userEvent.setup()
  auth.verifyEmail.mockResolvedValue(undefined)
  renderPage()
  await user.type(screen.getByLabelText(/^Email/), ' late@example.test ')
  await fillCode(user)
  await user.click(screen.getByRole('button', { name: 'Xác thực email' }))
  expect(auth.verifyEmail).toHaveBeenCalledWith('late@example.test', '123456')
  expect(await screen.findByText('Trang đăng nhập')).toBeInTheDocument()
})

it('uses the same editable email in the password reset flow and for resending the code', async () => {
  const user = userEvent.setup()
  auth.requestPasswordReset.mockResolvedValue(undefined)
  renderPage({ flow: 'password-reset' })
  await user.click(screen.getByRole('button', { name: 'Gửi mã mới' }))
  expect(screen.getByText('Vui lòng nhập email đã đăng ký.')).toBeInTheDocument()
  expect(auth.requestPasswordReset).not.toHaveBeenCalled()
  await user.type(screen.getByLabelText(/^Email/), 'reset@example.test')
  await user.click(screen.getByRole('button', { name: 'Gửi mã mới' }))
  expect(auth.requestPasswordReset).toHaveBeenCalledWith('reset@example.test')
})
