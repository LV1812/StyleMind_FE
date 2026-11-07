import { expect, it, vi } from 'vitest'
import { apiMode } from './http'

it('uses live community mode regardless of legacy demo configuration', () => {
  vi.stubEnv('VITE_COMMUNITY_MODE', '')
  expect(apiMode()).toBe(true)
  vi.stubEnv('VITE_COMMUNITY_MODE', 'api')
  expect(apiMode()).toBe(true)
  vi.stubEnv('VITE_COMMUNITY_MODE', 'demo')
  expect(apiMode()).toBe(true)
  vi.unstubAllEnvs()
})
