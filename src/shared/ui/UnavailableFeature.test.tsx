import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { ToastProvider } from './ToastProvider'
import { UnavailableFeature } from './UnavailableFeature'

it('explains that the feature is unavailable and shows a toast', async () => {
  render(<MemoryRouter><ToastProvider><UnavailableFeature title="AI Stylist" /></ToastProvider></MemoryRouter>)
  expect(await screen.findByText('Chức năng chưa hỗ trợ.')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'AI Stylist' })).toBeInTheDocument()
})
