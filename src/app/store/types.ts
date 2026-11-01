import type { Address } from '@/entities/address/model/types'
import type { AiConversation } from '@/entities/ai/model/types'
import type { AddCartLineInput, CartLine } from '@/entities/cart/model/types'
import type { ChatMessage, ChatSession } from '@/entities/chat/model/types'
import type { Notification } from '@/entities/notification/model/types'
import type { CancellationRequest, Order, OrderStatus, ReturnRequest } from '@/entities/order/model/types'
import type { Outfit, OutfitItem } from '@/entities/outfit/model/types'
import type {
  CompatibilityRule,
  FashionMetadata,
  FashionMetadataOption,
  Product,
  ProductCategory,
} from '@/entities/product/model/types'
import type { OutfitShare, WardrobePublicLink, WardrobeSettings, WardrobeShare, WardrobeVisibility } from '@/entities/share/model/types'
import type { DemoSession, User, UserStatus } from '@/entities/user/model/types'

export interface AiMetrics {
  wardrobeCount: number
  generatedOutfits: number
  aiAddedToCart: number
  aiOrderCount: number
  popularStyles: { styleId: string; count: number }[]
}

export interface DemoDatabase {
  schemaVersion: 1
  users: User[]
  session: DemoSession | null
  products: Product[]
  categories: ProductCategory[]
  cartLines: CartLine[]
  addresses: Address[]
  orders: Order[]
  notifications: Notification[]
  outfits: Outfit[]
  outfitShares: OutfitShare[]
  wardrobeShares: WardrobeShare[]
  wardrobeSettings: WardrobeSettings[]
  wardrobePublicLinks: WardrobePublicLink[]
  chatSessions: ChatSession[]
  chatMessages: ChatMessage[]
  aiConversations: AiConversation[]
  cancellationRequests: CancellationRequest[]
  returnRequests: ReturnRequest[]
  fashionMetadata: FashionMetadata
  compatibilityRules: CompatibilityRule[]
  aiMetrics: AiMetrics
}

export type DemoAction =
  | { type: 'database/replaced'; payload: DemoDatabase }
  | { type: 'session/loggedIn'; payload: { userId: string; persistent: boolean } }
  | { type: 'session/loggedOut' }
  | { type: 'user/registered'; payload: User }
  | { type: 'user/profileUpdated'; payload: Partial<Pick<User, 'fullName' | 'phone' | 'heightCm' | 'weightKg' | 'avatarUrl' | 'avatarInitials'>> & { userId: string } }
  | { type: 'user/passwordChanged'; payload: { userId: string; password: string } }
  | { type: 'cart/lineAdded'; payload: AddCartLineInput }
  | { type: 'cart/quantityChanged'; payload: { lineId: string; quantity: number } }
  | { type: 'cart/lineRemoved'; payload: { lineId: string } }
  | { type: 'address/upserted'; payload: Address }
  | { type: 'address/deleted'; payload: { addressId: string } }
  | { type: 'address/defaultChanged'; payload: { addressId: string } }
  | { type: 'order/placed'; payload: Order }
  | { type: 'outfit/created'; payload: Outfit }
  | { type: 'outfit/updated'; payload: Outfit }
  | { type: 'outfit/deleted'; payload: { outfitId: string } }
  | { type: 'outfit/itemAdded'; payload: { outfitId: string; item: OutfitItem } }
  | { type: 'outfit/itemUpdated'; payload: { outfitId: string; itemId: string; item: Partial<OutfitItem> } }
  | { type: 'outfit/itemRemoved'; payload: { outfitId: string; itemId: string } }
  | { type: 'outfit/publicToggled'; payload: { outfitId: string; enabled: boolean; publicToken?: string } }
  | { type: 'share/granted'; payload: OutfitShare }
  | { type: 'share/revoked'; payload: { shareId: string } }
  | { type: 'wardrobeShare/granted'; payload: WardrobeShare }
  | { type: 'wardrobeShare/revoked'; payload: { shareId: string } }
  | { type: 'wardrobeShare/restored'; payload: { shareId: string; restoredAt: string } }
  | { type: 'wardrobe/visibilityChanged'; payload: { ownerId: string; visibility: WardrobeVisibility; publicToken?: string } }
  | { type: 'wardrobe/publicToggled'; payload: { ownerId: string; enabled: boolean; token?: string } }
  | { type: 'chat/sessionUpserted'; payload: ChatSession }
  | { type: 'chat/messageSent'; payload: ChatMessage }
  | { type: 'notification/read'; payload: { notificationId: string; readAt: string } }
  | { type: 'notification/readAll'; payload: { userId: string; readAt: string } }
  | { type: 'cancellation/submitted'; payload: CancellationRequest }
  | { type: 'return/submitted'; payload: ReturnRequest }
  | { type: 'ai/conversationUpserted'; payload: AiConversation }
  | { type: 'admin/userStatusChanged'; payload: { userId: string; status: UserStatus; actorId: string } }
  | { type: 'admin/categoryUpserted'; payload: ProductCategory }
  | { type: 'admin/categoryStatusChanged'; payload: { categoryId: string; active: boolean } }
  | { type: 'admin/productUpserted'; payload: Product }
  | { type: 'admin/productStatusChanged'; payload: { productId: string; active: boolean } }
  | { type: 'admin/variantStatusChanged'; payload: { productId: string; variantId: string; active: boolean } }
  | { type: 'admin/orderStatusChanged'; payload: { orderId: string; status: OrderStatus; at: string } }
  | { type: 'admin/cancellationReviewed'; payload: { requestId: string; decision: 'approved' | 'rejected'; reviewerId: string; reviewedAt: string; note?: string } }
  | { type: 'admin/returnReviewed'; payload: { requestId: string; decision: 'approved' | 'rejected' | 'refunded'; reviewerId: string; reviewedAt: string; note?: string } }
  | { type: 'admin/fashionMetadataOptionUpserted'; payload: { group: keyof FashionMetadata; option: FashionMetadataOption } }
  | { type: 'admin/fashionMetadataOptionStatusChanged'; payload: { group: keyof FashionMetadata; optionId: string; active: boolean } }
  | { type: 'admin/compatibilityRuleUpserted'; payload: CompatibilityRule }
  | { type: 'admin/compatibilityRuleStatusChanged'; payload: { ruleId: string; active: boolean } }
