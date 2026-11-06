import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { VerifyOtpPage } from './pages/VerifyOtpPage'

vi.mock('./model/useAuth', () => ({ useAuth: () => ({ verifyEmail: vi.fn(), resendEmailVerification: vi.fn() }) }))

it('shows the registration email without allowing it to be changed', () => {
  render(<MemoryRouter initialEntries={[{ pathname: '/verify-otp', state: { email: 'user@example.test' } }]}><Routes><Route path="/verify-otp" element={<VerifyOtpPage />} /></Routes></MemoryRouter>)
  expect(screen.getByLabelText('Email')).toHaveValue('user@example.test')
  expect(screen.getByLabelText('Email')).toHaveAttribute('readonly')
})

it('asks the user to return to registration when no email is available', () => {
  render(<MemoryRouter initialEntries={['/verify-otp']}><Routes><Route path="/verify-otp" element={<VerifyOtpPage />} /></Routes></MemoryRouter>)
  expect(screen.getByRole('link', { name: 'đăng ký' })).toHaveAttribute('href', '/register')
  expect(screen.getByRole('button', { name: 'Xác thực email' })).toBeDisabled()
})
