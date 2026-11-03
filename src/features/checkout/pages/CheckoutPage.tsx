import { useAuth } from '@/features/auth'
import GuestCheckoutPage from './GuestCheckoutPage'
import AccountCheckoutPage from './AccountCheckoutPage'
export default function CheckoutPage() {
 const { currentUser, isInitializing } = useAuth()
 if (isInitializing) return null
 return currentUser ? <AccountCheckoutPage key={currentUser.id} /> : <GuestCheckoutPage />
}
export { CheckoutPage }
