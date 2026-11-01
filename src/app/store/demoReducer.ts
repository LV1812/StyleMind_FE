import type { Address } from '@/entities/address/model/types'
import type { CartLine } from '@/entities/cart/model/types'
import type { ChatSession } from '@/entities/chat/model/types'
import type { Notification } from '@/entities/notification/model/types'
import type { Order } from '@/entities/order/model/types'
import type { Outfit } from '@/entities/outfit/model/types'
import type { OutfitShare, WardrobePublicLink, WardrobeSettings, WardrobeShare } from '@/entities/share/model/types'

import type { DemoAction, DemoDatabase } from './types'

function findVariant(database: DemoDatabase, variantId: string) {
  for (const product of database.products) {
    const variant = product.variants.find(item => item.id === variantId)
    if (variant) return { product, variant }
  }
  return null
}

function normalizeQuantity(database: DemoDatabase, variantId: string, quantity: number) {
  const result = findVariant(database, variantId)
  if (!result || !result.product.active || !result.variant.active) return 0
  return Math.max(0, quantity)
}

function upsertAddress(addresses: Address[], address: Address) {
  const withoutDuplicate = addresses.filter(item => item.id !== address.id)
  if (!address.isDefault) return [...withoutDuplicate, address]

  return [
    ...withoutDuplicate.map(item => (item.userId === address.userId ? { ...item, isDefault: false } : item)),
    address,
  ]
}

function withPlacedOrder(state: DemoDatabase, order: Order): DemoDatabase {
  const duplicate = state.orders.some(
    item => item.id === order.id || (order.paymentReference && item.paymentReference === order.paymentReference),
  )
  if (duplicate) return state

  const purchasedVariantIds = new Set(order.items.map(item => item.variantId))

  return {
    ...state,
    orders: [...state.orders, order],
    cartLines: state.cartLines.filter(line => !purchasedVariantIds.has(line.variantId)),
  }
}

function updateOutfit(outfits: Outfit[], outfitId: string, update: (outfit: Outfit) => Outfit) {
  return outfits.map(outfit => (outfit.id === outfitId ? update(outfit) : outfit))
}

function upsertShare(shares: OutfitShare[], share: OutfitShare) {
  const withoutDuplicate = shares.filter(
    item => !(item.outfitId === share.outfitId && item.viewerEmail.toLowerCase() === share.viewerEmail.toLowerCase()),
  )
  return [...withoutDuplicate, share]
}

function upsertWardrobePublicLink(links: WardrobePublicLink[], link: WardrobePublicLink) {
  const withoutOwnerLink = links.filter(item => item.ownerId !== link.ownerId)
  return [...withoutOwnerLink, link]
}

function upsertWardrobeShare(shares: WardrobeShare[], share: WardrobeShare) {
  const withoutDuplicate = shares.filter(
    item => !(item.ownerId === share.ownerId && item.viewerEmail.toLowerCase() === share.viewerEmail.toLowerCase()),
  )
  return [...withoutDuplicate, share]
}

function upsertWardrobeSettings(settings: WardrobeSettings[], nextSettings: WardrobeSettings) {
  return [...settings.filter(item => item.ownerId !== nextSettings.ownerId), nextSettings]
}

function upsertChatSession(sessions: ChatSession[], session: ChatSession) {
  return [...sessions.filter(item => item.id !== session.id), session]
}

function orderNotification(input: {
  id: string
  userId: string
  orderId: string
  title: string
  body: string
  createdAt: string
}): Notification {
  return {
    id: input.id,
    userId: input.userId,
    type: 'order',
    title: input.title,
    body: input.body,
    read: false,
    createdAt: input.createdAt,
    link: `/orders/${input.orderId}`,
  }
}

function appendOrderTimeline(order: Order, label: string, at: string): Order {
  return {
    ...order,
    timeline: [...order.timeline, { id: `timeline-${order.id}-${Date.parse(at) || Date.now()}`, label, at }],
  }
}

export function normalizeDemoDatabase(database: DemoDatabase): DemoDatabase {
  const activeUsers = new Set(database.users.filter(user => user.status === 'active').map(user => user.id))
  const session = database.session && activeUsers.has(database.session.userId) ? database.session : null
  const cartLines = database.cartLines
    .map(line => {
      const quantity = normalizeQuantity(database, line.variantId, line.quantity)
      return quantity > 0 ? { ...line, quantity } : null
    })
    .filter(Boolean) as CartLine[]

  return {
    ...database,
    session,
    cartLines,
    outfits: database.outfits ?? [],
    outfitShares: database.outfitShares ?? [],
    wardrobeShares: database.wardrobeShares ?? [],
    wardrobeSettings: database.wardrobeSettings ?? [],
    wardrobePublicLinks: database.wardrobePublicLinks ?? [],
    chatSessions: database.chatSessions ?? [],
    chatMessages: database.chatMessages ?? [],
    aiConversations: database.aiConversations ?? [],
    cancellationRequests: database.cancellationRequests ?? [],
    returnRequests: database.returnRequests ?? [],
  }
}

export function demoReducer(state: DemoDatabase, action: DemoAction): DemoDatabase {
  switch (action.type) {
    case 'database/replaced':
      return normalizeDemoDatabase(action.payload)
    case 'session/loggedIn': {
      const user = state.users.find(item => item.id === action.payload.userId && item.status === 'active')
      if (!user) return state
      return { ...state, session: action.payload }
    }
    case 'session/loggedOut':
      return { ...state, session: null }
    case 'user/registered':
      return normalizeDemoDatabase({ ...state, users: [...state.users, action.payload] })
    case 'user/profileUpdated':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.userId
            ? {
                ...user,
                ...('fullName' in action.payload ? { fullName: action.payload.fullName ?? user.fullName } : {}),
                ...('phone' in action.payload ? { phone: action.payload.phone } : {}),
                ...('heightCm' in action.payload ? { heightCm: action.payload.heightCm } : {}),
                ...('weightKg' in action.payload ? { weightKg: action.payload.weightKg } : {}),
                ...('avatarUrl' in action.payload ? { avatarUrl: action.payload.avatarUrl } : {}),
                ...('avatarInitials' in action.payload ? { avatarInitials: action.payload.avatarInitials ?? user.avatarInitials } : {}),
              }
            : user,
        ),
      }
    case 'user/passwordChanged':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.userId ? { ...user, password: action.payload.password } : user,
        ),
      }
    case 'cart/lineAdded': {
      const quantity = normalizeQuantity(state, action.payload.variantId, action.payload.quantity)
      if (quantity <= 0) return state

      const existingLine = state.cartLines.find(
        line =>
          line.productId === action.payload.productId &&
          line.variantId === action.payload.variantId &&
          line.source === action.payload.source,
      )

      if (!existingLine) {
        return {
          ...state,
          cartLines: [
            ...state.cartLines,
            {
              id: `cart-${action.payload.variantId}-${Date.now()}`,
              ...action.payload,
              quantity,
            },
          ],
        }
      }

      const nextQuantity = normalizeQuantity(state, action.payload.variantId, existingLine.quantity + action.payload.quantity)
      return {
        ...state,
        cartLines: state.cartLines.map(line => (line.id === existingLine.id ? { ...line, quantity: nextQuantity } : line)),
      }
    }
    case 'cart/quantityChanged':
      return normalizeDemoDatabase({
        ...state,
        cartLines: state.cartLines
          .map(line => (line.id === action.payload.lineId ? { ...line, quantity: action.payload.quantity } : line))
          .filter(line => line.quantity > 0),
      })
    case 'cart/lineRemoved':
      return { ...state, cartLines: state.cartLines.filter(line => line.id !== action.payload.lineId) }
    case 'address/upserted':
      return { ...state, addresses: upsertAddress(state.addresses, action.payload) }
    case 'address/deleted': {
      const removed = state.addresses.find(item => item.id === action.payload.addressId)
      const remaining = state.addresses.filter(item => item.id !== action.payload.addressId)
      if (!removed?.isDefault || remaining.some(item => item.userId === removed.userId && item.isDefault)) {
        return { ...state, addresses: remaining }
      }

      let defaultApplied = false
      return {
        ...state,
        addresses: remaining.map(item => {
          if (item.userId !== removed.userId || defaultApplied) return item
          defaultApplied = true
          return { ...item, isDefault: true }
        }),
      }
    }
    case 'address/defaultChanged': {
      const address = state.addresses.find(item => item.id === action.payload.addressId)
      if (!address) return state
      return {
        ...state,
        addresses: state.addresses.map(item =>
          item.userId === address.userId ? { ...item, isDefault: item.id === action.payload.addressId } : item,
        ),
      }
    }
    case 'order/placed':
      return withPlacedOrder(state, action.payload)
    case 'outfit/created':
      return { ...state, outfits: [...state.outfits, action.payload] }
    case 'outfit/updated':
      return { ...state, outfits: state.outfits.map(outfit => (outfit.id === action.payload.id ? action.payload : outfit)) }
    case 'outfit/deleted':
      return {
        ...state,
        outfits: state.outfits.filter(outfit => outfit.id !== action.payload.outfitId),
        outfitShares: state.outfitShares.filter(share => share.outfitId !== action.payload.outfitId),
      }
    case 'outfit/itemAdded':
      return {
        ...state,
        outfits: updateOutfit(state.outfits, action.payload.outfitId, outfit => ({
          ...outfit,
          items: [...outfit.items, action.payload.item],
          updatedAt: new Date().toISOString(),
        })),
      }
    case 'outfit/itemUpdated':
      return {
        ...state,
        outfits: updateOutfit(state.outfits, action.payload.outfitId, outfit => ({
          ...outfit,
          items: outfit.items.map(item => (item.id === action.payload.itemId ? { ...item, ...action.payload.item } : item)),
          updatedAt: new Date().toISOString(),
        })),
      }
    case 'outfit/itemRemoved':
      return {
        ...state,
        outfits: updateOutfit(state.outfits, action.payload.outfitId, outfit => ({
          ...outfit,
          items: outfit.items.filter(item => item.id !== action.payload.itemId),
          updatedAt: new Date().toISOString(),
        })),
      }
    case 'outfit/publicToggled':
      return {
        ...state,
        outfits: updateOutfit(state.outfits, action.payload.outfitId, outfit => ({
          ...outfit,
          visibility: action.payload.enabled ? 'public' : 'private',
          publicToken: action.payload.enabled ? action.payload.publicToken ?? outfit.publicToken ?? `public-${outfit.id}` : undefined,
          updatedAt: new Date().toISOString(),
        })),
      }
    case 'share/granted':
      return { ...state, outfitShares: upsertShare(state.outfitShares, action.payload) }
    case 'share/revoked':
      return {
        ...state,
        outfitShares: state.outfitShares.map(share => (share.id === action.payload.shareId ? { ...share, active: false } : share)),
      }
    case 'wardrobeShare/granted':
      return { ...state, wardrobeShares: upsertWardrobeShare(state.wardrobeShares, action.payload) }
    case 'wardrobeShare/revoked':
      return {
        ...state,
        wardrobeShares: state.wardrobeShares.map(share =>
          share.id === action.payload.shareId ? { ...share, active: false, revokedAt: new Date().toISOString() } : share,
        ),
      }
    case 'wardrobeShare/restored':
      return {
        ...state,
        wardrobeShares: state.wardrobeShares.map(share =>
          share.id === action.payload.shareId ? { ...share, active: true, revokedAt: undefined } : share,
        ),
      }
    case 'wardrobe/visibilityChanged': {
      const currentSettings = state.wardrobeSettings.find(item => item.ownerId === action.payload.ownerId)
      const token = action.payload.publicToken ?? currentSettings?.publicToken ?? `pub-wardrobe-${action.payload.ownerId}`
      const nextSettings: WardrobeSettings = {
        ownerId: action.payload.ownerId,
        visibility: action.payload.visibility,
        publicToken: action.payload.visibility === 'public' ? token : currentSettings?.publicToken,
        updatedAt: new Date().toISOString(),
      }
      const nextPublicLinks = action.payload.visibility === 'public'
        ? upsertWardrobePublicLink(state.wardrobePublicLinks, {
          id: `wardrobe-public-${action.payload.ownerId}`,
          ownerId: action.payload.ownerId,
          token,
          active: true,
          createdAt: state.wardrobePublicLinks.find(link => link.ownerId === action.payload.ownerId)?.createdAt ?? new Date().toISOString(),
        })
        : state.wardrobePublicLinks.map(link =>
          link.ownerId === action.payload.ownerId && link.active
            ? { ...link, active: false, disabledAt: new Date().toISOString() }
            : link,
        )

      return {
        ...state,
        wardrobeSettings: upsertWardrobeSettings(state.wardrobeSettings, nextSettings),
        wardrobePublicLinks: nextPublicLinks,
      }
    }
    case 'wardrobe/publicToggled': {
      const currentLink = state.wardrobePublicLinks.find(link => link.ownerId === action.payload.ownerId)
      const currentSettings = state.wardrobeSettings.find(item => item.ownerId === action.payload.ownerId)

      if (!action.payload.enabled) {
        return {
          ...state,
          wardrobeSettings: upsertWardrobeSettings(state.wardrobeSettings, {
            ownerId: action.payload.ownerId,
            visibility: 'protected',
            publicToken: currentSettings?.publicToken ?? currentLink?.token,
            updatedAt: new Date().toISOString(),
          }),
          wardrobePublicLinks: state.wardrobePublicLinks.map(link =>
            link.ownerId === action.payload.ownerId && link.active
              ? { ...link, active: false, disabledAt: new Date().toISOString() }
              : link,
          ),
        }
      }

      const link: WardrobePublicLink = {
        id: currentLink?.id ?? `wardrobe-public-${action.payload.ownerId}`,
        ownerId: action.payload.ownerId,
        token: action.payload.token ?? currentLink?.token ?? `pub-wardrobe-${action.payload.ownerId}`,
        active: true,
        createdAt: currentLink?.createdAt ?? new Date().toISOString(),
      }

      return {
        ...state,
        wardrobeSettings: upsertWardrobeSettings(state.wardrobeSettings, {
          ownerId: action.payload.ownerId,
          visibility: 'public',
          publicToken: link.token,
          updatedAt: new Date().toISOString(),
        }),
        wardrobePublicLinks: upsertWardrobePublicLink(state.wardrobePublicLinks, link),
      }
    }
    case 'chat/sessionUpserted':
      return { ...state, chatSessions: upsertChatSession(state.chatSessions, action.payload) }
    case 'chat/messageSent':
      return {
        ...state,
        chatSessions: state.chatSessions.map(session =>
          session.id === action.payload.sessionId ? { ...session, updatedAt: action.payload.createdAt } : session,
        ),
        chatMessages: [...state.chatMessages, action.payload],
      }
    case 'notification/read':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.notificationId
            ? { ...notification, read: true, readAt: action.payload.readAt }
            : notification,
        ),
      }
    case 'notification/readAll':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.userId === action.payload.userId
            ? { ...notification, read: true, readAt: action.payload.readAt }
            : notification,
        ),
      }
    case 'cancellation/submitted':
      return { ...state, cancellationRequests: [...state.cancellationRequests, action.payload] }
    case 'return/submitted':
      return { ...state, returnRequests: [...state.returnRequests, action.payload] }
    case 'ai/conversationUpserted':
      return {
        ...state,
        aiConversations: [
          ...state.aiConversations.filter(conversation => conversation.id !== action.payload.id),
          action.payload,
        ],
      }
    case 'admin/userStatusChanged':
      if (action.payload.userId === action.payload.actorId && action.payload.status === 'locked') return state
      return normalizeDemoDatabase({
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.userId ? { ...user, status: action.payload.status } : user,
        ),
      })
    case 'admin/categoryUpserted':
      return {
        ...state,
        categories: [
          ...state.categories.filter(category => category.id !== action.payload.id),
          action.payload,
        ].sort((a, b) => a.order - b.order),
      }
    case 'admin/categoryStatusChanged':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.categoryId ? { ...category, active: action.payload.active } : category,
        ),
      }
    case 'admin/productUpserted':
      return normalizeDemoDatabase({
        ...state,
        products: [
          ...state.products.filter(product => product.id !== action.payload.id),
          action.payload,
        ],
      })
    case 'admin/productStatusChanged':
      return normalizeDemoDatabase({
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.productId ? { ...product, active: action.payload.active } : product,
        ),
      })
    case 'admin/variantStatusChanged':
      return normalizeDemoDatabase({
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.productId
            ? {
                ...product,
                variants: product.variants.map(variant =>
                  variant.id === action.payload.variantId ? { ...variant, active: action.payload.active } : variant,
                ),
              }
            : product,
        ),
      })
    case 'admin/orderStatusChanged':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.orderId
            ? appendOrderTimeline(
                {
                  ...order,
                  status: action.payload.status,
                  paymentStatus: action.payload.status === 'paid' ? 'paid' : order.paymentStatus,
                },
                `Admin chuyển trạng thái đơn sang ${action.payload.status}`,
                action.payload.at,
              )
            : order,
        ),
      }
    case 'admin/cancellationReviewed': {
      const request = state.cancellationRequests.find(item => item.id === action.payload.requestId)
      if (!request) return state
      const approved = action.payload.decision === 'approved'
      const title = approved ? 'Yêu cầu hủy đơn đã được duyệt' : 'Yêu cầu hủy đơn bị từ chối'
      const body = approved
        ? `Đơn ${request.orderId} đã được hủy theo yêu cầu của bạn.`
        : `Yêu cầu hủy đơn ${request.orderId} chưa đủ điều kiện xử lý.`

      return {
        ...state,
        cancellationRequests: state.cancellationRequests.map(item =>
          item.id === request.id
            ? {
                ...item,
                status: action.payload.decision,
                reviewedBy: action.payload.reviewerId,
                reviewedAt: action.payload.reviewedAt,
                adminNote: action.payload.note,
              }
            : item,
        ),
        orders: state.orders.map(order =>
          order.id === request.orderId && approved
            ? appendOrderTimeline({ ...order, status: 'cancelled' }, 'Admin đã duyệt yêu cầu hủy đơn', action.payload.reviewedAt)
            : order,
        ),
        notifications: [
          ...state.notifications,
          orderNotification({
            id: `noti-${request.id}-${action.payload.decision}`,
            userId: request.userId,
            orderId: request.orderId,
            title,
            body: action.payload.note ? `${body} Ghi chú: ${action.payload.note}` : body,
            createdAt: action.payload.reviewedAt,
          }),
        ],
      }
    }
    case 'admin/returnReviewed': {
      const request = state.returnRequests.find(item => item.id === action.payload.requestId)
      if (!request) return state
      const title =
        action.payload.decision === 'refunded'
          ? 'Yêu cầu hoàn tiền đã xử lý'
          : action.payload.decision === 'approved'
            ? 'Yêu cầu đổi/trả đã được duyệt'
            : 'Yêu cầu đổi/trả bị từ chối'
      const body =
        action.payload.decision === 'refunded'
          ? `Đơn ${request.orderId} đã được xử lý hoàn tiền.`
          : action.payload.decision === 'approved'
            ? `Yêu cầu đổi/trả cho đơn ${request.orderId} đã được duyệt.`
            : `Yêu cầu đổi/trả cho đơn ${request.orderId} chưa đủ điều kiện xử lý.`

      return {
        ...state,
        returnRequests: state.returnRequests.map(item =>
          item.id === request.id
            ? {
                ...item,
                status: action.payload.decision,
                reviewedBy: action.payload.reviewerId,
                reviewedAt: action.payload.reviewedAt,
                adminNote: action.payload.note,
              }
            : item,
        ),
        notifications: [
          ...state.notifications,
          orderNotification({
            id: `noti-${request.id}-${action.payload.decision}`,
            userId: request.userId,
            orderId: request.orderId,
            title,
            body: action.payload.note ? `${body} Ghi chú: ${action.payload.note}` : body,
            createdAt: action.payload.reviewedAt,
          }),
        ],
      }
    }
    case 'admin/fashionMetadataOptionUpserted':
      return {
        ...state,
        fashionMetadata: {
          ...state.fashionMetadata,
          [action.payload.group]: [
            ...state.fashionMetadata[action.payload.group].filter(option => option.id !== action.payload.option.id),
            action.payload.option,
          ],
        },
      }
    case 'admin/fashionMetadataOptionStatusChanged':
      return {
        ...state,
        fashionMetadata: {
          ...state.fashionMetadata,
          [action.payload.group]: state.fashionMetadata[action.payload.group].map(option =>
            option.id === action.payload.optionId ? { ...option, active: action.payload.active } : option,
          ),
        },
      }
    case 'admin/compatibilityRuleUpserted':
      return {
        ...state,
        compatibilityRules: [
          ...state.compatibilityRules.filter(rule => rule.id !== action.payload.id),
          action.payload,
        ],
      }
    case 'admin/compatibilityRuleStatusChanged':
      return {
        ...state,
        compatibilityRules: state.compatibilityRules.map(rule =>
          rule.id === action.payload.ruleId ? { ...rule, active: action.payload.active } : rule,
        ),
      }
    default:
      return state
  }
}
