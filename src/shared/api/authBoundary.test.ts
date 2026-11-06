import { expect, it, vi } from 'vitest'
import { apiMode } from './http'

it('enables live community mode only when explicitly configured', () => {
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  expect(apiMode()).toBe(true)
  vi.stubEnv('VITE_COMMUNITY_MODE', 'demo')
  expect(apiMode()).toBe(false)
  vi.unstubAllEnvs()
})
