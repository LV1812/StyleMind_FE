import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

import { installIdentityMockBackend, resetIdentityMockBackend } from './identityMockBackend'

installIdentityMockBackend()

afterEach(() => {
  cleanup()
  resetIdentityMockBackend()
})
