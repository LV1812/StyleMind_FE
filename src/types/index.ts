export type ScreenName =
  | 'home'
  | 'shop'
  | 'product-detail'
  | 'ai-stylist'
  | 'outfit-result'
  | 'wardrobe'
  | 'travel'
  | 'studio'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'profile'
  | 'admin'

export interface NavigationOptions {
  productId?: string
  occasion?: string
  outfitId?: string
  returnTo?: ScreenName
  [key: string]: unknown
}

export interface ColorVariant {
  name: string
  hex: string
}

export interface Product {
  id: string
  name: string
  brand: string
  price: number
  image: string
  images: string[]
  colors: ColorVariant[]
  sizes: string[]
  availableSizes: string[]
  category: string
  material: string
  fit: string
  description: string
  wardrobeMatches: number
  aiHint: string
  recommendedSize: string
  recommendedSizeReason: string
  tags: string[]
  inStock?: boolean
  variants?: Array<{
    id: string
    size: string
    color: string
    material: string
    price: number
    availableQuantity: number
    active: boolean
    image: string
  }>
}

export interface WardrobeItem {
  id: string
  name: string
  brand: string
  category: string
  color: string
  colorName: string
  size: string
  image: string
  outfitCount: number
  material: string
  notes?: string
  favorite: boolean
}

export type ItemOwnershipStatus = 'owned' | 'shop' | 'unavailable' | 'size_unavailable'

export interface OutfitPiece {
  id?: string
  productId?: string
  wardrobeId?: string
  slot?: string
  name: string
  brand: string
  status: ItemOwnershipStatus
  price?: number
  image: string
  color?: string
  colorHex?: string
  size?: string
  availableSizes?: string[]
  reused?: boolean
  unavailableReason?: string
}

export interface OutfitSuggestion {
  id: string
  title: string
  occasion: string
  items: OutfitPiece[]
  palette: string[]
  notes: string
  whyItWorks?: string
  totalNew: number
  wardrobeReusedCount: number
}

export interface TravelDay {
  day: number
  label: string
  weather: string
  ownedItems: Array<{ name: string; id: string; image: string; brand?: string }>
  shopItems: Array<{ name: string; brand: string; price: number; id: string; image: string; available?: boolean }>
  colorStory: string[]
  note: string
  aiNote: string
}

export interface OrderItem {
  id?: string
  productId?: string
  name: string
  brand: string
  size: string
  color: string
  qty: number
  price: number
  image: string
}

export interface OrderTimelineStep {
  status: string
  date: string
  done: boolean
  active?: boolean
}

export interface Order {
  id: string
  apiId?: string
  apiStatus?: string
  date: string
  status: 'PENDING' | 'PAYMENT_PENDING' | 'PAID' | 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  statusLabel: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  paymentMethod: 'SePay' | 'COD' | 'Card'
  address: string
  tracking?: string
  timeline: OrderTimelineStep[]
}

export interface CartItem {
  id: string
  variantId?: string
  productId: string
  name: string
  brand: string
  size: string
  color: string
  colorHex?: string
  price: number
  qty: number
  image: string
  available: boolean
  aiRec?: string
}

export interface NotificationItem {
  id: string
  type: 'order' | 'ai' | 'system'
  title: string
  body: string
  time: string
  read: boolean
  link?: ScreenName
}

export interface AppState {
  currentScreen: ScreenName
  navigate: (screen: ScreenName | string, opts?: NavigationOptions) => void
  opts?: NavigationOptions
  cartCount: number
  setCartCount: (n: number | ((prev: number) => number)) => void
  cartItems: CartItem[]
  addToCart: (item: Omit<CartItem, 'id' | 'qty'> & { id?: string; qty?: number }) => void
  removeFromCart: (id: string) => void
  updateCartQty: (id: string, delta: number) => void
  notifications: NotificationItem[]
  markNotificationRead: (id: string) => void
  loggedIn: boolean
  isLoggedIn?: boolean
  setLoggedIn: (b: boolean) => void
}
