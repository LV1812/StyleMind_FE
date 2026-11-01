import type { PropsWithChildren } from 'react'

import { DemoStoreProvider } from '@/app/store/DemoStoreProvider'
import { ToastProvider } from '@/shared/ui'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <DemoStoreProvider>
      <ToastProvider>{children}</ToastProvider>
    </DemoStoreProvider>
  )
}
