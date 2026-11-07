import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { AccountPage } from './pages/AccountPage'

const mocks = vi.hoisted(() => ({ profile: vi.fn(), style: vi.fn(), addresses: vi.fn() }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'user', email: 'user@example.test', fullName: 'An' } }) }))
vi.mock('@/app/store/DemoStoreProvider', () => ({ useDemoStore: () => ({ state: { orders: [], outfits: [], notifications: [] } }) }))
vi.mock('@/shared/api/http', () => ({ apiMode: () => true }))
vi.mock('@/shared/api/identityApi', () => ({ identityApi: { getMyProfile: mocks.profile, getStyleProfile: mocks.style, listAddresses: mocks.addresses }, identityErrorMessage: (_error: unknown, fallback: string) => fallback }))

it('prevents saving blank profile fields after load failure and allows retry', async () => {
  mocks.profile.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ profile: { display_name: 'An' } })
  mocks.style.mockResolvedValue({ style_profile: null })
  mocks.addresses.mockResolvedValue({ addresses: [] })
  render(<MemoryRouter><AccountPage /></MemoryRouter>)
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải thông tin tài khoản.')
  expect(screen.queryByRole('button', { name: 'Lưu hồ sơ' })).not.toBeInTheDocument()
  expect(screen.queryByText('0 địa chỉ')).not.toBeInTheDocument()
  await userEvent.setup().click(screen.getByRole('button', { name: 'Thử tải lại' }))
  expect(await screen.findByRole('button', { name: 'Lưu hồ sơ' })).toBeEnabled()
  expect(screen.getByText('0 địa chỉ')).toBeInTheDocument()
})
