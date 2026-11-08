import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { GuestGuard } from '@/app/router/guards/GuestGuard'
import { intendedPathFromState, safeInternalPath } from './model/redirect'

const auth = vi.hoisted(() => ({ currentUser: null as null | { role: 'customer' | 'admin' }, isInitializing: false }))
vi.mock('@/features/auth', () => ({ useAuth: () => auth }))

describe('safeInternalPath', () => {
  it.each([
    ['/account/addresses', '/account/addresses'],
    ['/orders?status=PLACED#top', '/orders?status=PLACED#top'],
    [{ pathname: '/wardrobes', search: '?page=2', hash: '' }, '/wardrobes?page=2'],
  ])('keeps the internal path %j', (input, expected) => { expect(safeInternalPath(input)).toBe(expected) })

  it.each([
    ['https://evil.example/phish'], ['//evil.example'], ['/\\evil.example'], ['javascript:alert(1)'], ['account'], [''],
    ['/login'], ['/register?x=1'], ['/verify-otp'], [{ pathname: 'https://evil.example' }], [{}], [null], [undefined], [42],
  ])('rejects %j', input => { expect(safeInternalPath(input)).toBeNull() })

  it('reads the router state set by AuthGuard', () => {
    expect(intendedPathFromState({ from: { pathname: '/account/addresses', search: '', hash: '' } })).toBe('/account/addresses')
    expect(intendedPathFromState(null)).toBeNull()
    expect(intendedPathFromState({ from: { pathname: '//evil.example' } })).toBeNull()
  })
})

describe('GuestGuard after login', () => {
  const renderGuard = (state?: object) => render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
      <Routes>
        <Route path="/login" element={<GuestGuard><p>Form đăng nhập</p></GuestGuard>} />
        <Route path="/shop" element={<p>Cửa hàng</p>} />
        <Route path="/account/addresses" element={<p>Sổ địa chỉ</p>} />
        <Route path="/admin" element={<p>Quản trị</p>} />
      </Routes>
    </MemoryRouter>,
  )

  it('sends a signed-in customer back to the page they wanted', () => {
    auth.currentUser = { role: 'customer' }
    renderGuard({ from: { pathname: '/account/addresses', search: '', hash: '' } })
    expect(screen.getByText('Sổ địa chỉ')).toBeInTheDocument()
  })

  it('falls back to the shop when the intended page is missing or unsafe', () => {
    auth.currentUser = { role: 'customer' }
    renderGuard({ from: { pathname: '//evil.example' } })
    expect(screen.getByText('Cửa hàng')).toBeInTheDocument()
  })

  it('sends admins to the admin area and shows the form to guests', () => {
    auth.currentUser = { role: 'admin' }
    const { unmount } = renderGuard({ from: { pathname: '/account/addresses' } })
    expect(screen.getByText('Quản trị')).toBeInTheDocument()
    unmount()
    auth.currentUser = null
    renderGuard()
    expect(screen.getByText('Form đăng nhập')).toBeInTheDocument()
  })
})
