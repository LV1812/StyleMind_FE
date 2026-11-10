import { useAuth } from '@/features/auth'
import { Navigate } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import AccountCheckoutPage from './AccountCheckoutPage'
export default function CheckoutPage() {
 const { currentUser, isInitializing } = useAuth()
 if (isInitializing) return null
 return currentUser ? <AccountCheckoutPage key={currentUser.id} /> : <Navigate to={ROUTES.login} replace state={{ from: { pathname: ROUTES.cart }, checkoutLoginRequired: true }} />
}
export { CheckoutPage }
