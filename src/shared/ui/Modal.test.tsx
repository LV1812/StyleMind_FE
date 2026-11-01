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
})
