import type { PropsWithChildren } from 'react'

import { DemoStoreProvider } from '@/app/store/DemoStoreProvider'
import { IdentityAuthProvider } from '@/features/auth/model/IdentityAuthProvider'
import { CommerceProvider } from '@/features/commerce'
import { ToastProvider } from '@/shared/ui'
import GuestCommerceProvider from '@/features/cart/model/GuestCommerceProvider'
import AccountCommerceProvider from '@/features/cart/model/AccountCommerceProvider'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <DemoStoreProvider>
      <IdentityAuthProvider>
        <GuestCommerceProvider><AccountCommerceProvider><ToastProvider>{children}</ToastProvider></AccountCommerceProvider></GuestCommerceProvider>
      </IdentityAuthProvider>
    </DemoStoreProvider>
  )
}
