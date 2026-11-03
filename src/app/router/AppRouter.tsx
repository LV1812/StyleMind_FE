import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router-dom'

import { CustomerLayout } from '@/app/layouts/CustomerLayout'
import { AuthGuard } from '@/app/router/guards/AuthGuard'
import { GuestGuard } from '@/app/router/guards/GuestGuard'
import { AccountPage, AddressBookPage } from '@/features/account'
import { AdminPage } from '@/features/admin'
import { AiStylistCreatePage } from '@/features/ai-stylist'
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyOtpPage,
} from '@/features/auth'
import { CartPage } from '@/features/cart'
import { ShopPage } from '@/features/catalog'
import { CheckoutPage, OrderSuccessPage, QrPaymentPage } from '@/features/checkout'
import { HomePage } from '@/features/home'
import { MessagesPage } from '@/features/messages'
import FriendsPage from '@/features/friends/pages/FriendsPage'
import ApiFriendsPage from '@/features/friends/pages/ApiFriendsPage'
import InvitationPage from '@/features/friends/pages/InvitationPage'
import ApiMessagesPage from '@/features/messages/pages/ApiMessagesPage'
import { apiMode } from '@/shared/api/http'
import { ApiWardrobePage, ApiSharedWithMePage, ApiFriendWardrobePage, ApiOutfitDetailPage } from '@/features/sharing/pages/ApiOutfitPages'
import { NotificationsPage } from '@/features/notifications'
import { ManualOutfitBuilderPage } from '@/features/outfit-builder'
import { OrderDetailPage, OrdersPage } from '@/features/orders'
import { ProductDetailPage } from '@/features/product-detail'
import { PublicOutfitPage, PublicWardrobePage, SharedWardrobePage, SharedWithMePage, WardrobeAccessPage } from '@/features/sharing'
import { OutfitDetailPage, WardrobePage } from '@/features/wardrobe'
import { NotFoundPage } from '@/shared/ui/NotFoundPage'

import { ROUTES } from './routes'

function CommunityScreen({ demo, live }: { demo: React.ReactNode; live: React.ReactNode }) { return apiMode() ? live : demo }

export const appRoutes: RouteObject[] = [
  { path: '/friend-invitations/accept', element: <InvitationPage /> },
  { path: ROUTES.login, element: <GuestGuard><LoginPage /></GuestGuard> },
  { path: ROUTES.register, element: <GuestGuard><RegisterPage /></GuestGuard> },
  { path: ROUTES.verifyOtp, element: <GuestGuard><VerifyOtpPage /></GuestGuard> },
  { path: ROUTES.forgotPassword, element: <GuestGuard><ForgotPasswordPage /></GuestGuard> },
  { path: ROUTES.resetPassword, element: <GuestGuard><ResetPasswordPage /></GuestGuard> },
  { path: ROUTES.publicOutfit, element: <CommunityScreen demo={<PublicOutfitPage />} live={<ApiOutfitDetailPage kind="public" />} /> },
  { path: ROUTES.publicWardrobe, element: <CommunityScreen demo={<PublicWardrobePage />} live={<main className="p-8"><h1>Liên kết tủ đồ không còn hỗ trợ</h1><p>Vui lòng sử dụng liên kết của từng Outfit.</p></main>} /> },
  {
    path: ROUTES.home,
    element: <CustomerLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'products/:productId', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <AuthGuard><CheckoutPage /></AuthGuard> },
      { path: 'checkout/qr', element: <AuthGuard><QrPaymentPage /></AuthGuard> },
      { path: 'order-success/:orderId', element: <AuthGuard><OrderSuccessPage /></AuthGuard> },
      { path: 'orders', element: <AuthGuard><OrdersPage /></AuthGuard> },
      { path: 'orders/:orderId', element: <AuthGuard><OrderDetailPage /></AuthGuard> },
      { path: 'notifications', element: <AuthGuard><NotificationsPage /></AuthGuard> },
      { path: 'account', element: <AuthGuard><AccountPage /></AuthGuard> },
      { path: 'account/addresses', element: <AuthGuard><AddressBookPage /></AuthGuard> },
      { path: 'ai-wardrobe', element: <AuthGuard><AiStylistCreatePage /></AuthGuard> },
      { path: 'wardrobes', element: <AuthGuard><CommunityScreen demo={<WardrobePage />} live={<ApiWardrobePage />} /></AuthGuard> },
      { path: 'wardrobes/access', element: <AuthGuard><WardrobeAccessPage /></AuthGuard> },
      { path: 'wardrobes/new', element: <AuthGuard><ManualOutfitBuilderPage /></AuthGuard> },
      { path: 'wardrobes/new/ai', element: <AuthGuard><AiStylistCreatePage /></AuthGuard> },
      { path: 'outfits/:outfitId', element: <AuthGuard><CommunityScreen demo={<OutfitDetailPage />} live={<ApiOutfitDetailPage kind="owner" />} /></AuthGuard> },
      { path: 'shared-with-me', element: <AuthGuard><CommunityScreen demo={<SharedWithMePage />} live={<ApiSharedWithMePage />} /></AuthGuard> },
      { path: 'shared-with-me/:ownerId', element: <AuthGuard><CommunityScreen demo={<SharedWardrobePage />} live={<ApiFriendWardrobePage />} /></AuthGuard> },
      { path: 'shared-with-me/:ownerId/outfits/:outfitId', element: <AuthGuard><CommunityScreen demo={<NotFoundPage />} live={<ApiOutfitDetailPage kind="friend" />} /></AuthGuard> },
      { path: 'messages', element: <AuthGuard><CommunityScreen demo={<MessagesPage />} live={<ApiMessagesPage />} /></AuthGuard> },
      { path: 'friends', element: <AuthGuard roles={['customer']}><CommunityScreen demo={<FriendsPage />} live={<ApiFriendsPage />} /></AuthGuard> },
    ],
  },
  { path: ROUTES.admin, element: <AuthGuard roles={['admin']}><AdminPage /></AuthGuard> },
  { path: '*', element: <NotFoundPage /> },
]

export function AppRouter() {
  return <RouterProvider router={createBrowserRouter(appRoutes)} />
}
