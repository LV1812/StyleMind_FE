import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { ROUTES } from '@/app/router/routes'
import { readOrderReferences } from '@/features/payments/model/orderReferences'

export default function LegacyCheckoutRedirect() {
  const { orderId } = useParams()
  const { currentUser } = useAuth()
  const latest = orderId ?? readOrderReferences().find(item => item.owner === 'account' && item.accountId === currentUser?.id)?.orderId
  return <Navigate replace to={latest ? ROUTES.paymentOrder.replace(':orderId', encodeURIComponent(latest)) : ROUTES.payments} />
}
