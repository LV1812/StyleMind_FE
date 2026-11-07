import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { Modal } from './Modal'

function ModalHarness() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Mở hộp thoại
      </button>
      <Modal open={open} title="Hộp thoại kiểm tra" onClose={() => setOpen(false)}>
        <p>Nội dung kiểm tra modal.</p>
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('closes the modal with Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<ModalHarness />)

    await user.click(screen.getByRole('button', { name: 'Mở hộp thoại' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mở hộp thoại' })).toHaveFocus()
  })

  it('keeps keyboard focus inside the open dialog', async () => {
    const user = userEvent.setup()
    render(<ModalHarness />)
    await user.click(screen.getByRole('button', { name: 'Mở hộp thoại' }))
    const close = screen.getByRole('button', { name: 'Đóng hộp thoại' })
    close.focus()
    await user.tab()
    expect(close).toHaveFocus()
    await user.tab({ shift: true })
    expect(close).toHaveFocus()
  })

  it('wraps focus between the first and last controls', async () => {
    const user = userEvent.setup()
    render(<Modal open title="Kiểm tra" onClose={() => {}}><button type="button">Lưu</button></Modal>)
    const close = screen.getByRole('button', { name: 'Đóng hộp thoại' })
    const save = screen.getByRole('button', { name: 'Lưu' })
    close.focus()
    await user.tab({ shift: true })
    expect(save).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()
  })
})
