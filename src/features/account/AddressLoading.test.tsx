import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { AddressBookPage } from './pages/AddressBookPage'

const mockApi = vi.hoisted(() => ({ listAddresses: vi.fn(), listProvinces: vi.fn() }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ currentUser: { id: 'user', email: 'user@example.test' } }) }))
vi.mock('@/shared/api/identityApi', () => ({ identityApi: mockApi, identityErrorMessage: (_error: unknown, fallback: string) => fallback }))

it('offers retry instead of claiming the address book is empty after a loading failure', async () => {
  mockApi.listAddresses.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ addresses: [] })
  mockApi.listProvinces.mockResolvedValue({ provinces: [] })
  render(<MemoryRouter><AddressBookPage /></MemoryRouter>)
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải sổ địa chỉ.')
  expect(screen.queryByRole('heading', { name: 'Chưa có địa chỉ' })).not.toBeInTheDocument()
  await userEvent.setup().click(screen.getByRole('button', { name: 'Thử tải lại' }))
  expect(await screen.findByRole('heading', { name: 'Chưa có địa chỉ' })).toBeInTheDocument()
  expect(mockApi.listAddresses).toHaveBeenCalledTimes(2)
})
