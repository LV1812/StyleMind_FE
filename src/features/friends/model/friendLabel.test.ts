import { describe, expect, it } from 'vitest'
import { friendLabel } from './friendLabel'

describe('friendLabel', () => {
  it('shows the email followed by the display name when present', () => {
    expect(friendLabel({ email: 'ban@example.test', display_name: 'Linh' })).toBe('ban@example.test (Linh)')
  })
  it('shows the email alone when the friend has no display name', () => {
    expect(friendLabel({ email: 'ban@example.test', display_name: '  ' })).toBe('ban@example.test')
  })
  it('keeps older responses usable while the backend is updated', () => {
    expect(friendLabel({ display_name: 'Linh' })).toBe('Linh')
  })
})
