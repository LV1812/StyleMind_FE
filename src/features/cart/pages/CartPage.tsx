import GuestCartPage from './GuestCartPage'
import { useAuth } from '@/features/auth'

export default function CartPage() {
  const { isInitializing } = useAuth()
  if (isInitializing) return null
  return <GuestCartPage />
}
export { CartPage }
