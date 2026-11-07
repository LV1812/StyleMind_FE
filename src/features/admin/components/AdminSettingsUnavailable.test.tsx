import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { it, expect } from 'vitest'
import { ToastProvider } from '@/shared/ui'
import { AdminSettingsUnavailable } from './AdminSettingsUnavailable'

it('explains that saving store settings is not supported instead of reporting success', async () => {
  render(<ToastProvider><AdminSettingsUnavailable /></ToastProvider>)
  await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  expect(await screen.findByText('Chức năng chưa hỗ trợ.')).toBeInTheDocument()
  expect(screen.queryByText('Đã lưu!')).not.toBeInTheDocument()
})
