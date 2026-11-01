import { Outlet } from 'react-router-dom'

import { CustomerHeader } from './components/CustomerHeader'
import { MobileNavigation } from './components/MobileNavigation'

export function CustomerLayout() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#222222]">
      <CustomerHeader />
      <main id="main-content" className="pb-[calc(4rem+var(--safe-bottom))] md:pb-0" tabIndex={-1}>
        <Outlet />
      </main>
      <MobileNavigation />
    </div>
  )
}
