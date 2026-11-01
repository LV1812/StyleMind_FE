import type { DemoDatabase } from '@/app/store/types'
import type { AiConversation } from '@/entities/ai/model/types'
import type { ChatMessage, ChatSession } from '@/entities/chat/model/types'
import type { Order, OrderItemSnapshot } from '@/entities/order/model/types'
import type { Outfit } from '@/entities/outfit/model/types'
import type { Product, ProductImage, ProductSize, ProductVariant } from '@/entities/product/model/types'
import type { OutfitShare, WardrobeSettings, WardrobeShare } from '@/entities/share/model/types'
import { DEMO_ADMIN, DEMO_CUSTOMER } from '@/shared/constants/demoAccounts'

const PRODUCT_IMAGE_BASE = 'https://images.unsplash.com'
const DEFAULT_SIZES: ProductSize[] = ['S', 'M', 'L']

interface ColorSeed {
  id: string
  color: string
  colorHex: string
  image: string
  alt: string
  stockBySize?: Partial<Record<ProductSize, number>>
}

interface ProductSeedInput {
  id: string
  categoryId: string
  name: string
  brand: string
  description: string
  basePrice: number
  material: string
  fit: string
  pattern: string
  styleIds: string[]
  occasionIds: string[]
  tags: string[]
  featured?: boolean
  createdAt: string
  colors: ColorSeed[]
  extraVariants?: ProductVariant[]
}

function image(id: string, url: string, alt: string, isPrimary: boolean): ProductImage {
  return { id, url, alt, isPrimary, order: 1 }
}

function createVariants(productId: string, colors: ColorSeed[]): ProductVariant[] {
  const key = productId.replace('prd-', '')

  return colors.flatMap(color =>
    DEFAULT_SIZES.map(size => ({
      id: productId === 'prd-blouse-01' && color.id === 'white' && size === 'M'
        ? 'var-blouse-white-m'
        : `var-${key}-${color.id}-${size.toLowerCase()}`,
      color: color.color,
      colorHex: color.colorHex,
      size,
      stock: color.stockBySize?.[size] ?? 6,
      active: true,
      images: [
        image(
          `img-${key}-${color.id}-${size.toLowerCase()}`,
          `${PRODUCT_IMAGE_BASE}/${color.image}?w=900&h=1200&fit=crop&auto=format`,
          color.alt,
          size === 'M',
        ),
      ],
    })),
  )
}

function product(input: ProductSeedInput): Product {
  return {
    id: input.id,
    categoryId: input.categoryId,
    name: input.name,
    brand: input.brand,
    description: input.description,
    basePrice: input.basePrice,
    material: input.material,
    fit: input.fit,
    pattern: input.pattern,
    styleIds: input.styleIds,
    occasionIds: input.occasionIds,
    tags: input.tags,
    featured: input.featured ?? false,
    active: true,
    createdAt: input.createdAt,
    variants: [...createVariants(input.id, input.colors), ...(input.extraVariants ?? [])],
  }
}

const clothingProducts: Product[] = [
  product({
    id: 'prd-blouse-01',
    categoryId: 'tops',
    name: 'Áo blouse cổ vuông',
    brand: 'Lam Trà',
    description: 'Áo blouse cotton modal, cổ vuông mềm và tay phồng nhẹ cho ngày đi làm.',
    basePrice: 620000,
    material: 'Cotton modal',
    fit: 'Dáng vừa',
    pattern: 'Trơn',
    styleIds: ['minimal', 'feminine'],
    occasionIds: ['work', 'weekend'],
    tags: ['áo blouse', 'đi làm', 'tối giản', 'nữ tính'],
    featured: true,
    createdAt: '2026-09-10T09:00:00.000Z',
    colors: [
      { id: 'white', color: 'Trắng', colorHex: '#F8F4EF', image: 'photo-1629511565591-a1d494ad6c58', alt: 'Áo blouse cổ vuông màu trắng trên nền sáng', stockBySize: { M: 8 } },
      { id: 'black', color: 'Đen', colorHex: '#242124', image: 'photo-1594633312681-425c7b97ccd1', alt: 'Áo blouse cổ vuông màu đen phối cùng quần sáng màu', stockBySize: { M: 5 } },
    ],
    extraVariants: [
      {
        id: 'var-blouse-black-xl',
        color: 'Đen',
        colorHex: '#242124',
        size: 'XL',
        stock: 0,
        active: true,
        images: [image('img-blouse-black-xl', `${PRODUCT_IMAGE_BASE}/photo-1594633312681-425c7b97ccd1?w=900&h=1200&fit=crop&auto=format`, 'Áo blouse cổ vuông màu đen cận chất liệu', false)],
      },
    ],
  }),
  product({
    id: 'prd-knit-top-02',
    categoryId: 'tops',
    name: 'Áo dệt kim cổ lọ',
    brand: 'Mộc Studio',
    description: 'Áo cổ lọ mỏng, mềm và dễ phối dưới blazer hoặc áo khoác nhẹ.',
    basePrice: 780000,
    material: 'Len merino pha',
    fit: 'Ôm nhẹ',
    pattern: 'Dệt gân',
    styleIds: ['minimal'],
    occasionIds: ['work', 'weekend'],
    tags: ['áo dệt kim', 'cổ lọ', 'giữ ấm'],
    createdAt: '2026-09-12T09:00:00.000Z',
    colors: [
      { id: 'ivory', color: 'Ngà', colorHex: '#F3EEE6', image: 'photo-1576566588028-4147f3842f27', alt: 'Áo dệt kim cổ lọ màu ngà' },
      { id: 'camel', color: 'Camel', colorHex: '#C59A72', image: 'photo-1608234807905-4466023792f5', alt: 'Áo dệt kim màu camel gấp gọn' },
    ],
  }),
  product({
    id: 'prd-shirt-03',
    categoryId: 'tops',
    name: 'Áo sơ mi poplin trắng',
    brand: 'Mây Concept',
    description: 'Sơ mi poplin form hơi rộng, đường may gọn cho phong cách công sở hiện đại.',
    basePrice: 690000,
    material: 'Cotton poplin',
    fit: 'Rộng vừa',
    pattern: 'Trơn',
    styleIds: ['classic', 'minimal'],
    occasionIds: ['work'],
    tags: ['sơ mi', 'poplin', 'công sở'],
    createdAt: '2026-09-14T09:00:00.000Z',
    colors: [
      { id: 'white', color: 'Trắng', colorHex: '#FFFFFF', image: 'photo-1598032895397-b9472444bf93', alt: 'Áo sơ mi trắng dáng rộng' },
      { id: 'blue', color: 'Xanh nhạt', colorHex: '#C8D8E8', image: 'photo-1603252109303-2751441dd157', alt: 'Áo sơ mi xanh nhạt chất poplin' },
    ],
  }),
  product({
    id: 'prd-trousers-01',
    categoryId: 'pants',
    name: 'Quần tây ống suông',
    brand: 'An Linen',
    description: 'Quần tây lưng cao, ống suông thẳng và ly trước sắc nét.',
    basePrice: 920000,
    material: 'Twill pha viscose',
    fit: 'Lưng cao',
    pattern: 'Trơn',
    styleIds: ['classic', 'minimal'],
    occasionIds: ['work'],
    tags: ['quần tây', 'ống suông', 'đi làm'],
    featured: true,
    createdAt: '2026-09-11T09:00:00.000Z',
    colors: [
      { id: 'black', color: 'Đen', colorHex: '#202020', image: 'photo-1594633313593-bab3825d0caf', alt: 'Quần tây ống suông màu đen' },
      { id: 'sand', color: 'Be cát', colorHex: '#D8C6AF', image: 'photo-1506629082955-511b1aa562c8', alt: 'Quần tây màu be cát trên nền sáng' },
    ],
  }),
  product({
    id: 'prd-wide-pants-02',
    categoryId: 'pants',
    name: 'Quần ống rộng linen',
    brand: 'Nâu Atelier',
    description: 'Quần ống rộng từ linen pha cotton, thoáng và đứng phom.',
    basePrice: 990000,
    material: 'Linen cotton',
    fit: 'Ống rộng',
    pattern: 'Trơn',
    styleIds: ['relaxed', 'minimal'],
    occasionIds: ['weekend', 'work'],
    tags: ['linen', 'quần ống rộng', 'mùa hè'],
    createdAt: '2026-09-13T09:00:00.000Z',
    colors: [
      { id: 'ecru', color: 'Ecru', colorHex: '#EFE6D6', image: 'photo-1645996830718-127f7e4f74fc', alt: 'Quần linen ống rộng màu ecru' },
      { id: 'brown', color: 'Nâu', colorHex: '#725747', image: 'photo-1584370848010-d7fe6bc767ec', alt: 'Quần ống rộng màu nâu' },
    ],
  }),
  product({
    id: 'prd-denim-03',
    categoryId: 'pants',
    name: 'Quần denim ống đứng',
    brand: 'Rue Denim',
    description: 'Denim ống đứng lưng vừa, wash xanh nhạt dễ mặc hằng ngày.',
    basePrice: 860000,
    material: 'Cotton denim',
    fit: 'Ống đứng',
    pattern: 'Denim wash',
    styleIds: ['casual'],
    occasionIds: ['weekend'],
    tags: ['denim', 'quần jean', 'cuối tuần'],
    createdAt: '2026-09-15T09:00:00.000Z',
    colors: [
      { id: 'blue', color: 'Xanh denim', colorHex: '#6F8BAA', image: 'photo-1541099649105-f69ad21f3246', alt: 'Quần denim xanh ống đứng' },
      { id: 'black', color: 'Đen wash', colorHex: '#303030', image: 'photo-1582418702059-97ebafb35d09', alt: 'Quần denim đen wash' },
    ],
  }),
  product({
    id: 'prd-midi-skirt-01',
    categoryId: 'skirts',
    name: 'Chân váy midi crepe',
    brand: 'COS Việt',
    description: 'Chân váy midi dáng chữ A, rơi mềm và dễ phối cùng áo sơ mi.',
    basePrice: 740000,
    material: 'Crepe tái chế',
    fit: 'Chữ A',
    pattern: 'Trơn',
    styleIds: ['feminine', 'classic'],
    occasionIds: ['work', 'weekend'],
    tags: ['chân váy midi', 'crepe', 'nữ tính'],
    featured: true,
    createdAt: '2026-09-09T09:00:00.000Z',
    colors: [
      { id: 'camel', color: 'Camel', colorHex: '#C4956A', image: 'photo-1583496661160-fb5218a5c09b', alt: 'Chân váy midi màu camel' },
      { id: 'plum', color: 'Mận', colorHex: '#684B5A', image: 'photo-1664076458686-3449062080ac', alt: 'Chân váy midi màu mận' },
    ],
  }),
  product({
    id: 'prd-pleated-skirt-02',
    categoryId: 'skirts',
    name: 'Chân váy xếp ly nhẹ',
    brand: 'Tơ House',
    description: 'Chân váy xếp ly nhỏ, độ dài qua gối và chuyển động mềm khi đi lại.',
    basePrice: 680000,
    material: 'Poly chiffon',
    fit: 'Xếp ly',
    pattern: 'Trơn',
    styleIds: ['feminine'],
    occasionIds: ['weekend', 'date'],
    tags: ['xếp ly', 'chân váy', 'nhẹ'],
    createdAt: '2026-09-16T09:00:00.000Z',
    colors: [
      { id: 'cream', color: 'Kem', colorHex: '#F1E5D6', image: 'photo-1583496661160-fb5218a5c09b', alt: 'Chân váy xếp ly màu kem' },
      { id: 'navy', color: 'Xanh navy', colorHex: '#24344D', image: 'photo-1583846717393-dc2412c95ed7', alt: 'Chân váy xếp ly màu navy' },
    ],
  }),
  product({
    id: 'prd-slip-dress-01',
    categoryId: 'dresses',
    name: 'Đầm slip satin midi',
    brand: 'Lụa Sài Gòn',
    description: 'Đầm slip satin midi cắt xéo, ánh nhẹ và phù hợp buổi tối.',
    basePrice: 1450000,
    material: 'Satin viscose',
    fit: 'Dáng ôm rơi',
    pattern: 'Trơn',
    styleIds: ['feminine', 'evening'],
    occasionIds: ['date', 'party'],
    tags: ['đầm satin', 'midi', 'buổi tối'],
    featured: true,
    createdAt: '2026-09-17T09:00:00.000Z',
    colors: [
      { id: 'champagne', color: 'Champagne', colorHex: '#E8D5C4', image: 'photo-1515372039744-b8f02a3ae446', alt: 'Đầm slip satin màu champagne' },
      { id: 'emerald', color: 'Xanh ngọc', colorHex: '#2A5C45', image: 'photo-1539008835657-9e8e9680c956', alt: 'Đầm slip satin màu xanh ngọc' },
    ],
  }),
  product({
    id: 'prd-wrap-dress-02',
    categoryId: 'dresses',
    name: 'Đầm wrap tay lửng',
    brand: 'Hoa May',
    description: 'Đầm wrap tay lửng, thắt eo linh hoạt và họa tiết nhỏ thanh lịch.',
    basePrice: 1180000,
    material: 'Viscose mềm',
    fit: 'Thắt eo',
    pattern: 'Hoa nhí',
    styleIds: ['feminine', 'classic'],
    occasionIds: ['work', 'date'],
    tags: ['đầm wrap', 'hoa nhí', 'thắt eo'],
    createdAt: '2026-09-18T09:00:00.000Z',
    colors: [
      { id: 'rose', color: 'Hồng đất', colorHex: '#B98791', image: 'photo-1496747611176-843222e1e57c', alt: 'Đầm wrap màu hồng đất' },
      { id: 'black', color: 'Đen', colorHex: '#202020', image: 'photo-1529139574466-a303027c1d8b', alt: 'Đầm wrap màu đen họa tiết nhỏ' },
    ],
  }),
  product({
    id: 'prd-linen-blazer-01',
    categoryId: 'outerwear',
    name: 'Blazer linen vai mềm',
    brand: 'TOTEME Studio',
    description: 'Blazer linen vai mềm, dáng hơi rộng để khoác ngoài áo blouse hoặc áo dệt kim.',
    basePrice: 1850000,
    material: 'Linen Bỉ',
    fit: 'Rộng nhẹ',
    pattern: 'Trơn',
    styleIds: ['classic', 'minimal'],
    occasionIds: ['work', 'weekend'],
    tags: ['blazer', 'linen', 'áo khoác'],
    featured: true,
    createdAt: '2026-09-08T09:00:00.000Z',
    colors: [
      { id: 'oat', color: 'Yến mạch', colorHex: '#E8DDD2', image: 'photo-1619603364853-c92ff1fca11f', alt: 'Blazer linen màu yến mạch' },
      { id: 'charcoal', color: 'Than', colorHex: '#3A3A3A', image: 'photo-1594938298603-c8148c4b69e9', alt: 'Blazer linen màu than' },
    ],
  }),
  product({
    id: 'prd-cropped-jacket-02',
    categoryId: 'outerwear',
    name: 'Áo khoác cropped tweed',
    brand: 'Maison Nhi',
    description: 'Áo khoác cropped chất tweed mỏng, form gọn cho những ngày cần điểm nhấn.',
    basePrice: 1320000,
    material: 'Tweed cotton pha',
    fit: 'Cropped',
    pattern: 'Tweed',
    styleIds: ['feminine', 'classic'],
    occasionIds: ['work', 'date'],
    tags: ['áo khoác', 'cropped', 'tweed'],
    createdAt: '2026-09-19T09:00:00.000Z',
    colors: [
      { id: 'cream', color: 'Kem', colorHex: '#F2E8DA', image: 'photo-1601762603339-fd61e28b698a', alt: 'Áo khoác cropped tweed màu kem' },
      { id: 'black', color: 'Đen', colorHex: '#222222', image: 'photo-1548624149-f9b1857aa7a2', alt: 'Áo khoác cropped tweed màu đen' },
    ],
  }),
]

const seededOutfits: Outfit[] = [
  {
    id: 'outfit-work-minimal',
    ownerId: 'usr-customer-01',
    name: 'Di lam toi gian',
    description: 'Set do cong so gon gang voi blouse va quan ong suong.',
    source: 'manual',
    visibility: 'private',
    createdAt: '2026-09-21T09:00:00.000Z',
    updatedAt: '2026-09-24T09:00:00.000Z',
    items: [
      { id: 'outfit-item-blouse-white', productId: 'prd-blouse-01', variantId: 'var-blouse-white-m', addedBy: 'owner' },
      { id: 'outfit-item-trousers-black', productId: 'prd-trousers-01', variantId: 'var-trousers-01-black-m', addedBy: 'owner' },
      { id: 'outfit-item-blazer-oat', productId: 'prd-linen-blazer-01', variantId: 'var-linen-blazer-01-oat-m', addedBy: 'owner' },
    ],
  },
  {
    id: 'outfit-ai-cafe',
    ownerId: 'usr-customer-01',
    name: 'Cafe cuoi tuan',
    description: 'Outfit AI goi y cho buoi cafe nhe nhaang.',
    source: 'ai',
    visibility: 'public',
    publicToken: 'pub-cafe-cuoi-tuan',
    createdAt: '2026-09-22T09:00:00.000Z',
    updatedAt: '2026-09-25T09:00:00.000Z',
    items: [
      { id: 'outfit-item-knit-ivory', productId: 'prd-knit-top-02', variantId: 'var-knit-top-02-ivory-m', addedBy: 'ai' },
      { id: 'outfit-item-skirt-camel', productId: 'prd-midi-skirt-01', variantId: 'var-midi-skirt-01-camel-m', addedBy: 'ai' },
    ],
  },
]

const seededOutfitShares: OutfitShare[] = [
  {
    id: 'share-cafe-friend',
    outfitId: 'outfit-ai-cafe',
    ownerId: 'usr-customer-01',
    viewerEmail: 'friend@stylemind.vn',
    permission: 'view',
    active: true,
    createdAt: '2026-09-25T09:10:00.000Z',
  },
  {
    id: 'share-work-old',
    outfitId: 'outfit-work-minimal',
    ownerId: 'usr-customer-01',
    viewerEmail: 'old-friend@stylemind.vn',
    permission: 'view',
    active: false,
    createdAt: '2026-09-23T09:10:00.000Z',
  },
]

const seededWardrobeSettings: WardrobeSettings[] = [
  {
    ownerId: 'usr-customer-01',
    visibility: 'protected',
    publicToken: 'pub-wardrobe-usr-customer-01',
    updatedAt: '2026-09-25T09:10:00.000Z',
  },
]

const seededWardrobeShares: WardrobeShare[] = [
  {
    id: 'wardrobe-share-friend',
    ownerId: 'usr-customer-01',
    viewerEmail: 'friend@stylemind.vn',
    permission: 'view',
    active: true,
    createdAt: '2026-09-25T09:10:00.000Z',
  },
  {
    id: 'wardrobe-share-old-friend',
    ownerId: 'usr-customer-01',
    viewerEmail: 'old-friend@stylemind.vn',
    permission: 'view',
    active: false,
    createdAt: '2026-09-23T09:10:00.000Z',
    revokedAt: '2026-09-24T09:10:00.000Z',
  },
]

const seededChatSessions: ChatSession[] = [
  {
    id: 'chat-usr-customer-01-friend-stylemind-vn',
    wardrobeOwnerId: 'usr-customer-01',
    participantEmail: 'friend@stylemind.vn',
    createdAt: '2026-09-25T09:30:00.000Z',
    updatedAt: '2026-09-25T09:45:00.000Z',
  },
]

const seededChatMessages: ChatMessage[] = [
  {
    id: 'msg-friend-01',
    sessionId: 'chat-usr-customer-01-friend-stylemind-vn',
    senderId: 'usr-friend-01',
    body: 'Bộ đồ đi cafe của bạn nhẹ nhàng lắm, áo dệt kim nhìn rất hợp.',
    createdAt: '2026-09-25T09:30:00.000Z',
  },
  {
    id: 'msg-owner-01',
    sessionId: 'chat-usr-customer-01-friend-stylemind-vn',
    senderId: 'usr-customer-01',
    body: 'Cảm ơn Mai, mình đang thử thêm một phiên bản đi làm nữa.',
    createdAt: '2026-09-25T09:36:00.000Z',
  },
  {
    id: 'msg-friend-02',
    sessionId: 'chat-usr-customer-01-friend-stylemind-vn',
    senderId: 'usr-friend-01',
    body: 'Bạn thử phối blouse trắng với quần đen trong outfit công sở xem sao.',
    createdAt: '2026-09-25T09:45:00.000Z',
  },
]

const seededAiConversations: AiConversation[] = []

function orderItem(productId: string, variantId: string, quantity: number): OrderItemSnapshot {
  const product = clothingProducts.find(item => item.id === productId)
  const variant = product?.variants.find(item => item.id === variantId)
  const image = variant?.images.find(item => item.isPrimary) ?? variant?.images[0]
  if (!product || !variant || !image) throw new Error(`Missing seeded order item ${productId}/${variantId}`)

  return {
    productId: product.id,
    variantId: variant.id,
    name: product.name,
    brand: product.brand,
    color: variant.color,
    size: variant.size,
    quantity,
    unitPrice: variant.priceOverride ?? product.basePrice,
    imageUrl: image.url,
  }
}

const seededOrders: Order[] = [
  {
    id: 'ORD-ADM-1001',
    userId: 'usr-customer-01',
    status: 'pending',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    paymentReference: null,
    items: [orderItem('prd-blouse-01', 'var-blouse-white-m', 1)],
    shippingAddress: {
      id: 'adr-customer-home',
      recipientName: 'Nguyễn Thiên An',
      phone: '0912345678',
      line1: '72 Nguyễn Thị Minh Khai',
      ward: 'Phường Võ Thị Sáu',
      district: 'Quận 3',
      province: 'TP. Hồ Chí Minh',
    },
    subtotal: 620_000,
    discount: 0,
    shipping: 30_000,
    total: 650_000,
    createdAt: '2026-09-27T09:00:00.000Z',
    timeline: [{ id: 'timeline-demo-1001-created', label: 'Đã tạo đơn COD', at: '2026-09-27T09:00:00.000Z' }],
  },
  {
    id: 'ORD-ADM-1002',
    userId: 'usr-customer-01',
    status: 'shipped',
    paymentMethod: 'vietqr',
    paymentStatus: 'paid',
    paymentReference: 'QR-DEMO-1002',
    items: [
      orderItem('prd-midi-skirt-01', 'var-midi-skirt-01-camel-m', 1),
      orderItem('prd-linen-blazer-01', 'var-linen-blazer-01-oat-m', 1),
    ],
    shippingAddress: {
      id: 'adr-customer-office',
      recipientName: 'Nguyễn Thiên An',
      phone: '0912345678',
      line1: '18 Lê Thánh Tôn',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      province: 'TP. Hồ Chí Minh',
    },
    subtotal: 2_590_000,
    discount: 120_000,
    shipping: 0,
    total: 2_470_000,
    createdAt: '2026-09-24T09:00:00.000Z',
    timeline: [
      { id: 'timeline-demo-1002-created', label: 'Đã tạo đơn VietQR', at: '2026-09-24T09:00:00.000Z' },
      { id: 'timeline-demo-1002-shipped', label: 'Đơn đang được giao', at: '2026-09-25T09:00:00.000Z' },
    ],
  },
]

export function createDemoSeed(): DemoDatabase {
  return {
    schemaVersion: 1,
    users: [
      {
        id: 'usr-customer-01',
        role: 'customer',
        status: 'active',
        fullName: 'Nguyễn Thiên An',
        email: DEMO_CUSTOMER.email,
        password: DEMO_CUSTOMER.password,
        phone: '0912345678',
        heightCm: 160,
        weightKg: 52,
        avatarInitials: 'TA',
        createdAt: '2026-09-01T08:00:00.000Z',
      },
      {
        id: 'usr-admin-01',
        role: 'admin',
        status: 'active',
        fullName: 'Trần Minh Quân',
        email: DEMO_ADMIN.email,
        password: DEMO_ADMIN.password,
        phone: '0987654321',
        avatarInitials: 'MQ',
        createdAt: '2026-09-01T08:15:00.000Z',
      },
      {
        id: 'usr-friend-01',
        role: 'customer',
        status: 'active',
        fullName: 'Lê Mai',
        email: 'friend@stylemind.vn',
        password: DEMO_CUSTOMER.password,
        avatarInitials: 'LM',
        createdAt: '2026-09-18T09:00:00.000Z',
      },
    ],
    session: null,
    categories: [
      { id: 'tops', label: 'Áo', description: 'Áo sơ mi, áo blouse và áo dệt kim.', active: true, order: 1 },
      { id: 'pants', label: 'Quần', description: 'Quần tây, denim và quần ống rộng.', active: true, order: 2 },
      { id: 'skirts', label: 'Chân váy', description: 'Chân váy midi và chân váy công sở.', active: true, order: 3 },
      { id: 'dresses', label: 'Đầm', description: 'Đầm liền cho công sở và buổi tối.', active: true, order: 4 },
      { id: 'outerwear', label: 'Áo khoác', description: 'Blazer, áo khoác nhẹ và áo măng tô.', active: true, order: 5 },
    ],
    products: clothingProducts,
    cartLines: [],
    addresses: [
      {
        id: 'adr-customer-home',
        userId: 'usr-customer-01',
        recipientName: 'Nguyễn Thiên An',
        phone: '0912345678',
        line1: '72 Nguyễn Thị Minh Khai',
        ward: 'Phường Võ Thị Sáu',
        district: 'Quận 3',
        province: 'TP. Hồ Chí Minh',
        isDefault: true,
      },
      {
        id: 'adr-customer-office',
        userId: 'usr-customer-01',
        recipientName: 'Nguyễn Thiên An',
        phone: '0912345678',
        line1: '18 Lê Thánh Tôn',
        ward: 'Phường Bến Nghé',
        district: 'Quận 1',
        province: 'TP. Hồ Chí Minh',
        isDefault: false,
      },
    ],
    orders: seededOrders,
    notifications: [
      {
        id: 'noti-welcome-01',
        userId: 'usr-customer-01',
        type: 'system',
        title: 'Tài khoản đã sẵn sàng',
        body: 'Bạn có thể đăng nhập, mua sắm và thanh toán bằng dữ liệu hiện có.',
        read: false,
        createdAt: '2026-09-25T06:00:00.000Z',
        link: '/shop',
      },
      {
        id: 'noti-wardrobe-01',
        userId: 'usr-customer-01',
        type: 'wardrobe',
        title: 'Outfit AI da duoc luu',
        body: 'Outfit Cafe cuoi tuan da nam trong My Wardrobe cua ban.',
        read: true,
        readAt: '2026-09-25T06:30:00.000Z',
        createdAt: '2026-09-25T06:20:00.000Z',
        link: '/outfits/outfit-ai-cafe',
      },
      {
        id: 'noti-share-01',
        userId: 'usr-customer-01',
        type: 'share',
        title: 'Lien ket chia se dang bat',
        body: 'Outfit Cafe cuoi tuan co public link rieng.',
        read: false,
        createdAt: '2026-09-25T06:40:00.000Z',
        link: '/outfits/outfit-ai-cafe',
      },
    ],
    outfits: seededOutfits,
    outfitShares: seededOutfitShares,
    wardrobeShares: seededWardrobeShares,
    wardrobeSettings: seededWardrobeSettings,
    wardrobePublicLinks: [],
    chatSessions: seededChatSessions,
    chatMessages: seededChatMessages,
    aiConversations: seededAiConversations,
    cancellationRequests: [
      {
        id: 'cancel-1001',
        orderId: 'ORD-ADM-1001',
        userId: 'usr-customer-01',
        reason: 'Tôi đặt nhầm size và muốn hủy trước khi xử lý',
        status: 'submitted',
        createdAt: '2026-09-27T09:30:00.000Z',
      },
    ],
    returnRequests: [
      {
        id: 'return-1002',
        orderId: 'ORD-ADM-1002',
        userId: 'usr-customer-01',
        reason: 'Chân váy không vừa như mong muốn',
        items: [{ productId: 'prd-midi-skirt-01', variantId: 'var-midi-skirt-01-camel-m', quantity: 1 }],
        status: 'submitted',
        createdAt: '2026-09-26T10:15:00.000Z',
      },
    ],
    fashionMetadata: {
      styles: [
        { id: 'minimal', label: 'Tối giản', active: true },
        { id: 'feminine', label: 'Nữ tính', active: true },
        { id: 'classic', label: 'Thanh lịch', active: true },
        { id: 'casual', label: 'Năng động', active: true },
        { id: 'relaxed', label: 'Thoải mái', active: true },
        { id: 'evening', label: 'Buổi tối', active: true },
      ],
      occasions: [
        { id: 'work', label: 'Đi làm', active: true },
        { id: 'weekend', label: 'Cuối tuần', active: true },
        { id: 'date', label: 'Hẹn hò', active: true },
        { id: 'party', label: 'Tiệc nhẹ', active: true },
      ],
      colors: [
        { id: 'white', label: 'Trắng', active: true },
        { id: 'black', label: 'Đen', active: true },
        { id: 'cream', label: 'Kem', active: true },
        { id: 'camel', label: 'Camel', active: true },
        { id: 'blue', label: 'Xanh', active: true },
      ],
      materials: [
        { id: 'cotton-modal', label: 'Cotton modal', active: true },
        { id: 'linen', label: 'Linen', active: true },
        { id: 'denim', label: 'Denim', active: true },
        { id: 'satin', label: 'Satin', active: true },
      ],
      fits: [
        { id: 'regular', label: 'Dáng vừa', active: true },
        { id: 'relaxed', label: 'Rộng nhẹ', active: true },
        { id: 'high-waist', label: 'Lưng cao', active: true },
      ],
      patterns: [
        { id: 'solid', label: 'Trơn', active: true },
        { id: 'ribbed', label: 'Dệt gân', active: true },
        { id: 'floral', label: 'Hoa nhí', active: true },
        { id: 'tweed', label: 'Tweed', active: true },
      ],
    },
    compatibilityRules: [],
    aiMetrics: {
      wardrobeCount: 18,
      generatedOutfits: 42,
      aiAddedToCart: 7,
      aiOrderCount: 3,
      popularStyles: [{ styleId: 'minimal', count: 24 }],
    },
  }
}
