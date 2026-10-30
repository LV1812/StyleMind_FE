import type { PropsWithChildren } from 'react'

import { DemoStoreProvider } from '@/app/store/DemoStoreProvider'
import { IdentityAuthProvider } from '@/features/auth/model/IdentityAuthProvider'
import { ToastProvider } from '@/shared/ui'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <DemoStoreProvider>
      <IdentityAuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </IdentityAuthProvider>
    </DemoStoreProvider>
  )
}
