import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { DemoStoreProvider, useDemoStore } from './DemoStoreProvider'

afterEach(() => vi.restoreAllMocks())

function Consumer() {
  const { state, dispatch, resetDatabase } = useDemoStore()
  return <>
    <p>Store loaded: {state.schemaVersion}</p>
    <button onClick={() => dispatch({ type: 'session/loggedOut' })}>Sign out</button>
    <button onClick={resetDatabase}>Reset</button>
  </>
}

it('keeps children interactive and warns when saving exceeds browser quota', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage full', 'QuotaExceededError')
  })
  render(<DemoStoreProvider><Consumer /></DemoStoreProvider>)
  expect(screen.getByText('Store loaded: 1')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Không thể lưu dữ liệu tạm')
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Sign out' }))
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  expect(screen.getByText('Store loaded: 1')).toBeInTheDocument()
})
