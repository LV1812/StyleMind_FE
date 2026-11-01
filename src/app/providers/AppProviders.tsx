import type { PropsWithChildren } from 'react'

import { DemoStoreProvider } from '@/app/store/DemoStoreProvider'
import { IdentityAuthProvider } from '@/features/auth/model/IdentityAuthProvider'
import { CommerceProvider } from '@/features/commerce'
import { ToastProvider } from '@/shared/ui'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <DemoStoreProvider>
      <IdentityAuthProvider>
        <CommerceProvider>
          <ToastProvider>{children}</ToastProvider>
        </CommerceProvider>
      </IdentityAuthProvider>
    </DemoStoreProvider>
  )
}
