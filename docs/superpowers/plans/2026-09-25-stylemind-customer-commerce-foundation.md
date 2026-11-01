# Kế hoạch triển khai nền tảng và luồng mua sắm Customer của StyleMind

> **Dành cho agent triển khai:** BẮT BUỘC dùng `superpowers:subagent-driven-development` (khuyến nghị) hoặc `superpowers:executing-plans` để thực hiện từng task trong kế hoạch. Mỗi bước dùng checkbox (`- [ ]`) để theo dõi.

**Mục tiêu:** Chuyển StyleMind sang kiến trúc feature-first và hoàn thiện luồng demo từ đăng nhập, duyệt sản phẩm, xem chi tiết, giỏ hàng đến thanh toán COD/VietQR bằng dữ liệu mock lưu trong `localStorage`.

**Kiến trúc:** React Router cung cấp URL thật và route guard; `DemoStoreProvider` dùng typed reducer làm nguồn dữ liệu chung, còn feature repository mô phỏng tác vụ bất đồng bộ. UI dùng Tailwind CSS hiện có, shared component có public API, và toàn bộ dữ liệu được lưu qua storage adapter có version.

**Tech stack:** React 19, TypeScript 5.7, Vite 8, Tailwind CSS 4, React Router DOM, Lucide React, Vitest, React Testing Library, jsdom.

**Tài liệu thiết kế:** `docs/superpowers/specs/2026-09-25-stylemind-non-wardrobe-demo-design.md`

## Ràng buộc chung

- Tên file, thư mục, component, type, interface, biến, hàm, action, route, model value và storage key dùng tiếng Anh.
- Toàn bộ nội dung người dùng nhìn thấy dùng tiếng Việt.
- Route URL dùng tiếng Anh và phải mở trực tiếp hoặc reload được.
- Dữ liệu demo phải tồn tại sau reload bằng `localStorage` có `schemaVersion`.
- Chỉ hiển thị áo, quần, chân váy, đầm và áo khoác; không hiển thị giày, túi hoặc phụ kiện.
- Không dùng `window.alert()` hoặc `window.confirm()`.
- Không mở rộng nghiệp vụ Wardrobe, Outfit hoặc AI Stylist trong kế hoạch này.
- Travel Planner và Visual Studio không được có route hoặc navigation đang hoạt động.
- Mỗi task phải kết thúc bằng test liên quan và `npm run build` thành công.

## Ranh giới đợt triển khai

Kế hoạch này là đợt độc lập đầu tiên của tài liệu thiết kế tổng thể. Kết quả cuối đợt là một luồng mua sắm Customer chạy hoàn chỉnh từ authentication đến tạo đơn hàng. Các đợt tiếp theo có ranh giới riêng:

1. Customer account, order history, cancellation, return và notifications.
2. Admin dashboard và các màn hình quản trị.
3. Tích hợp cuối, di chuyển Wardrobe không đổi hành vi, dọn legacy và kiểm tra toàn hệ thống.

## Bản đồ file

```text
src/
  App.tsx                              # Chỉ mount AppProviders và AppRouter
  app/
    router/AppRouter.tsx               # Browser router và route tree
    router/routes.ts                   # Hằng số URL
    router/guards/AuthGuard.tsx        # Bảo vệ checkout
    layouts/CustomerLayout.tsx         # Header, main, mobile navigation
    providers/AppProviders.tsx         # Demo store và toast provider
    store/DemoStoreProvider.tsx        # Context API
    store/demoReducer.ts               # Pure reducer
    store/types.ts                     # DemoDatabase và DemoAction
    data/demoSeed.ts                   # Seed có version
  entities/
    user/model/types.ts
    product/model/types.ts
    cart/model/types.ts
    address/model/types.ts
    order/model/types.ts
    notification/model/types.ts
  features/
    auth/                              # Login, register, OTP, password recovery
    home/                              # Trang chủ tiếng Việt
    catalog/                           # Shop, search và filters
    product-detail/                    # Gallery theo màu và chọn variant
    cart/                              # Cart page và cart calculations
    checkout/                          # Address, COD, VietQR, success
    wardrobe/                          # Re-export màn hình hiện có, không sửa nghiệp vụ
  shared/
    ui/                                # Button, Input, Modal, Toast, EmptyState...
    lib/                               # wait, formatCurrency, formatDate
    storage/demoStorage.ts             # Load/save/reset database
    constants/demoAccounts.ts          # Thông tin tài khoản trình diễn
```

## Trọng tâm review

1. `localStorage` chứa JSON hỏng hoặc schema không hỗ trợ phải phục hồi seed và báo cho người dùng, không làm trắng trang.
2. Session trỏ đến user đã bị khóa hoặc không còn tồn tại phải bị xóa và chuyển về `/login`.
3. Số lượng giỏ hàng vượt tồn kho phải bị chặn, không tạo tổng tiền sai hoặc stock âm.
4. Truy cập trực tiếp `/checkout` khi giỏ trống phải chuyển về `/cart` và hiển thị hướng dẫn tiếng Việt.
5. Xác nhận QR sau khi hết hạn hoặc bấm lặp nhiều lần không được tạo hai đơn hàng.

---

### Task 1: Thiết lập test, dependency và router shell

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Track: `.figma/make/site.json`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Create: `src/app/router/routes.ts`
- Create: `src/app/router/AppRouter.tsx`
- Create: `src/app/router/AppRouter.test.tsx`
- Create: `src/app/providers/AppProviders.tsx`
- Create: `src/shared/ui/NotFoundPage.tsx`
- Create: `src/test/setup.ts`

**Interfaces:**
- Produces: `ROUTES`, `appRoutes`, `AppRouter`, `AppProviders`, test environment `jsdom`.
- Consumes: Không có interface mới từ task trước.

- [ ] **Step 1: Cài dependency runtime và test**

Run:

```powershell
cmd /c npm install react-router-dom lucide-react qrcode.react
cmd /c npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: `package.json` và `package-lock.json` chứa dependency mới, không có audit vulnerability mức cao.

- [ ] **Step 2: Thêm script test và cấu hình Vitest**

Đặt scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit"
}
```

Tạo `vitest.config.ts` để test có alias giống ứng dụng mà không thay đổi plugin Figma trong `vite.config.ts`:

```ts
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

Và `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Viết test router thất bại trước**

```tsx
it('renders a Vietnamese not-found page for an unknown route', async () => {
  const router = createMemoryRouter(appRoutes, { initialEntries: ['/khong-ton-tai'] })
  render(<RouterProvider router={router} />)
  expect(await screen.findByRole('heading', { name: 'Không tìm thấy trang' })).toBeInTheDocument()
})
```

Run: `cmd /c npm test -- src/app/router/AppRouter.test.tsx`

Expected: FAIL vì `appRoutes` và trang 404 chưa tồn tại.

- [ ] **Step 4: Tạo route constants và router shell tối thiểu**

`routes.ts` xuất chính xác:

```ts
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  verifyOtp: '/verify-otp',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  shop: '/shop',
  product: '/products/:productId',
  cart: '/cart',
  checkout: '/checkout',
  checkoutQr: '/checkout/qr',
  orderSuccess: '/order-success/:orderId',
  orders: '/orders',
  notifications: '/notifications',
  account: '/account',
  aiWardrobe: '/ai-wardrobe',
  wardrobes: '/wardrobes',
  admin: '/admin',
} as const
```

`App.tsx` chỉ còn:

```tsx
export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
```

`NotFoundPage` hiển thị heading `Không tìm thấy trang`, mô tả ngắn và link `Về trang chủ`.

- [ ] **Step 5: Chạy test và build**

Run:

```powershell
cmd /c npm test -- src/app/router/AppRouter.test.tsx
cmd /c npm run build
```

Expected: Router test PASS; build PASS và Vite đọc được `.figma/make/site.json`.

- [ ] **Step 6: Commit task**

```powershell
git add package.json package-lock.json vitest.config.ts .figma/make/site.json src/App.tsx src/main.tsx src/app src/shared/ui/NotFoundPage.tsx src/test/setup.ts
git commit -m "chore: establish app router and test harness"
```

### Task 2: Domain model, versioned storage và DemoStore

**Files:**
- Create: `src/entities/user/model/types.ts`
- Create: `src/entities/product/model/types.ts`
- Create: `src/entities/cart/model/types.ts`
- Create: `src/entities/address/model/types.ts`
- Create: `src/entities/order/model/types.ts`
- Create: `src/entities/notification/model/types.ts`
- Create: `src/app/store/types.ts`
- Create: `src/app/store/demoReducer.ts`
- Create: `src/app/store/demoReducer.test.ts`
- Create: `src/app/store/DemoStoreProvider.tsx`
- Create: `src/app/data/demoSeed.ts`
- Create: `src/shared/storage/demoStorage.ts`
- Create: `src/shared/storage/demoStorage.test.ts`
- Create: `src/shared/constants/demoAccounts.ts`
- Modify: `src/app/providers/AppProviders.tsx`

**Interfaces:**
- Produces: `DemoDatabase`, `DemoAction`, `demoReducer`, `useDemoStore()`, `loadDemoDatabase()`, `saveDemoDatabase()`, `resetDemoDatabase()`.
- Consumes: `AppProviders` từ Task 1.

- [ ] **Step 1: Khai báo domain types bằng discriminated unions**

Các type chính phải có chữ ký:

```ts
export type UserRole = 'customer' | 'admin'
export type UserStatus = 'active' | 'locked'

export interface ProductImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  order: number
}

export interface ProductVariant {
  id: string
  color: string
  colorHex: string
  size: 'XS' | 'S' | 'M' | 'L' | 'XL'
  stock: number
  priceOverride?: number
  images: ProductImage[]
  active: boolean
}

export interface CartLine {
  id: string
  productId: string
  variantId: string
  quantity: number
  source: 'shop' | 'ai'
}

export type PaymentMethod = 'cod' | 'vietqr'
export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'failed'
export type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled'

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentReference: string | null
  items: OrderItemSnapshot[]
  shippingAddress: AddressSnapshot
  subtotal: number
  discount: number
  shipping: number
  total: number
  createdAt: string
}
```

`DemoDatabase` có `schemaVersion: 1` và các collection: `users`, `session`, `products`, `categories`, `cartLines`, `addresses`, `orders`, `notifications`, `cancellationRequests`, `returnRequests`, `fashionMetadata`, `compatibilityRules`, `aiMetrics`.

- [ ] **Step 2: Viết storage tests trước**

```ts
it('recovers from malformed JSON with a fresh seed', () => {
  storage.setItem(DEMO_STORAGE_KEY, '{broken')
  const result = loadDemoDatabase(storage)
  expect(result.database.schemaVersion).toBe(1)
  expect(result.recovered).toBe(true)
})

it('recovers from an unsupported schema version', () => {
  storage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ schemaVersion: 99 }))
  const result = loadDemoDatabase(storage)
  expect(result.database).toEqual(createDemoSeed())
  expect(result.recovered).toBe(true)
})
```

Run: `cmd /c npm test -- src/shared/storage/demoStorage.test.ts`

Expected: FAIL vì storage adapter chưa tồn tại.

- [ ] **Step 3: Triển khai versioned storage adapter**

```ts
export const DEMO_STORAGE_KEY = 'stylemind.demo.database'

export interface LoadDatabaseResult {
  database: DemoDatabase
  recovered: boolean
}

export function loadDemoDatabase(storage: Storage): LoadDatabaseResult
export function saveDemoDatabase(storage: Storage, database: DemoDatabase): void
export function resetDemoDatabase(storage: Storage): DemoDatabase
```

Chỉ chấp nhận object có `schemaVersion === 1` và đủ các collection cấp cao. Khi JSON lỗi hoặc schema không hợp lệ, ghi seed mới và trả `recovered: true`. Khi `session.persistent === false`, `saveDemoDatabase` ghi `session: null` vào `localStorage` nhưng vẫn giữ session trong state hiện tại; reload sẽ đăng xuất đúng hành vi “không ghi nhớ”.

- [ ] **Step 4: Viết reducer tests trước**

```ts
it('caps cart quantity at variant stock', () => {
  const state = createDemoSeed()
  const next = demoReducer(state, {
    type: 'cart/lineAdded',
    payload: { productId: 'prd-blouse-01', variantId: 'var-blouse-white-m', quantity: 999, source: 'shop' },
  })
  expect(next.cartLines[0]?.quantity).toBe(8)
})

it('clears a session whose user no longer exists', () => {
  const state = { ...createDemoSeed(), session: { userId: 'missing-user', persistent: true } }
  expect(normalizeDemoDatabase(state).session).toBeNull()
})
```

Run: `cmd /c npm test -- src/app/store/demoReducer.test.ts`

Expected: FAIL vì reducer và normalization chưa tồn tại.

- [ ] **Step 5: Triển khai reducer và provider**

`DemoAction` tối thiểu của đợt này:

```ts
export type DemoAction =
  | { type: 'database/replaced'; payload: DemoDatabase }
  | { type: 'session/loggedIn'; payload: { userId: string; persistent: boolean } }
  | { type: 'session/loggedOut' }
  | { type: 'user/registered'; payload: User }
  | { type: 'user/passwordChanged'; payload: { userId: string; password: string } }
  | { type: 'cart/lineAdded'; payload: AddCartLineInput }
  | { type: 'cart/quantityChanged'; payload: { lineId: string; quantity: number } }
  | { type: 'cart/lineRemoved'; payload: { lineId: string } }
  | { type: 'address/upserted'; payload: Address }
  | { type: 'address/defaultChanged'; payload: { addressId: string } }
  | { type: 'order/placed'; payload: Order }
```

`DemoStoreProvider` load một lần khi mount, persist sau mỗi state change, và cung cấp:

```ts
export interface DemoStoreValue {
  state: DemoDatabase
  dispatch: React.Dispatch<DemoAction>
  storageRecovered: boolean
  resetDatabase: () => void
}

export function useDemoStore(): DemoStoreValue
```

- [ ] **Step 6: Tạo seed hợp lệ và tài khoản demo**

Tài khoản cố định:

```ts
export const DEMO_CUSTOMER = {
  email: 'customer@stylemind.vn',
  password: 'StyleMind123!',
} as const

export const DEMO_ADMIN = {
  email: 'admin@stylemind.vn',
  password: 'Admin123!',
} as const
```

Seed phải có một Customer hoạt động, một Admin hoạt động, hai địa chỉ của Customer, thông báo mẫu và collection còn lại đúng schema. Product seed được bổ sung đầy đủ ở Task 5 nhưng mảng `products` phải tồn tại ngay từ task này.

- [ ] **Step 7: Chạy test và build**

Run:

```powershell
cmd /c npm test -- src/shared/storage/demoStorage.test.ts src/app/store/demoReducer.test.ts
cmd /c npm run build
```

Expected: Tất cả PASS; reload provider không mất state.

- [ ] **Step 8: Commit task**

```powershell
git add src/entities src/app/store src/app/data src/app/providers src/shared/storage src/shared/constants
git commit -m "feat: add persistent demo data store"
```

### Task 3: Shared UI và Customer layout tiếng Việt

**Files:**
- Create: `src/shared/ui/Button.tsx`
- Create: `src/shared/ui/TextField.tsx`
- Create: `src/shared/ui/SelectField.tsx`
- Create: `src/shared/ui/Modal.tsx`
- Create: `src/shared/ui/Modal.test.tsx`
- Create: `src/shared/ui/ToastProvider.tsx`
- Create: `src/shared/ui/EmptyState.tsx`
- Create: `src/shared/ui/LoadingSkeleton.tsx`
- Create: `src/shared/ui/index.ts`
- Create: `src/shared/lib/formatCurrency.ts`
- Create: `src/shared/lib/formatDate.ts`
- Create: `src/shared/lib/wait.ts`
- Create: `src/app/layouts/CustomerLayout.tsx`
- Create: `src/app/layouts/components/CustomerHeader.tsx`
- Create: `src/app/layouts/components/MobileNavigation.tsx`
- Create: `src/app/layouts/CustomerLayout.test.tsx`
- Create: `src/features/wardrobe/pages/DeferredWardrobePage.tsx`
- Create: `src/features/wardrobe/index.ts`
- Modify: `src/app/router/AppRouter.tsx`
- Modify: `src/app/providers/AppProviders.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces: shared UI public API, `useToast()`, `CustomerLayout` dùng `<Outlet />`, formatter VND/ngày Việt Nam.
- Consumes: `ROUTES`, `useDemoStore()`.

- [ ] **Step 1: Viết accessibility tests cho Modal và layout**

```tsx
it('closes the modal with Escape and returns focus to the trigger', async () => {
  const user = userEvent.setup()
  render(<ModalHarness />)
  await user.click(screen.getByRole('button', { name: 'Mở hộp thoại' }))
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Mở hộp thoại' })).toHaveFocus()
})

it('does not expose Travel Planner or Visual Studio navigation', () => {
  renderCustomerLayout('/')
  expect(screen.queryByText('Travel Planner')).not.toBeInTheDocument()
  expect(screen.queryByText('Visual Studio')).not.toBeInTheDocument()
})

it('keeps deferred wardrobe navigation reachable without changing its domain behavior', async () => {
  renderCustomerLayout('/wardrobes')
  expect(await screen.findByRole('heading', { name: 'Tủ đồ AI đang được hoàn thiện' })).toBeInTheDocument()
})
```

Run: `cmd /c npm test -- src/shared/ui/Modal.test.tsx src/app/layouts/CustomerLayout.test.tsx`

Expected: FAIL vì component chưa tồn tại.

- [ ] **Step 2: Triển khai shared UI API**

Public props tối thiểu:

```ts
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  icon?: React.ReactNode
}

export interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}
```

Modal dùng `role="dialog"`, `aria-modal="true"`, đóng bằng Escape, khóa scroll và trả focus. Toast có `success`, `error`, `info`, tự đóng sau 3.5 giây và có nút đóng bằng icon.

- [ ] **Step 3: Triển khai formatters và wait helper**

```ts
export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))

export const wait = (milliseconds = 350) =>
  new Promise<void>(resolve => window.setTimeout(resolve, milliseconds))
```

- [ ] **Step 4: Triển khai Customer layout**

Desktop navigation hiển thị đúng `Trang chủ`, `Cửa hàng`, `AI Wardrobe`, `Tủ đồ của tôi`; vùng phải có icon tìm kiếm, thông báo, giỏ hàng và tài khoản. Mobile dùng menu hoặc bottom navigation ổn định cao tối thiểu 48px. Không có nút Admin, Travel Planner hay Visual Studio. Hai route `/ai-wardrobe` và `/wardrobes` dùng cùng `DeferredWardrobePage`, giải thích ngắn bằng tiếng Việt rằng phần này đang được tách thiết kế và cung cấp CTA về cửa hàng; màn hình không tạo, sửa hoặc mô phỏng dữ liệu tủ đồ.

- [ ] **Step 5: Chuẩn hóa CSS nền tảng**

Giữ Fraunces/DM Sans và palette hiện tại, thêm token cho container, focus ring, overlay, z-index, safe-area mobile và reduced motion. Không thay font bằng font hệ thống và không thêm gradient tím/xanh kiểu AI.

- [ ] **Step 6: Chạy test và build**

Run:

```powershell
cmd /c npm test -- src/shared/ui/Modal.test.tsx src/app/layouts/CustomerLayout.test.tsx
cmd /c npm run build
```

Expected: PASS; layout không chứa navigation ngoài phạm vi.

- [ ] **Step 7: Commit task**

```powershell
git add src/shared src/app/layouts src/app/providers src/app/router src/features/wardrobe src/index.css
git commit -m "feat: add shared UI and customer shell"
```

### Task 4: Authentication dùng chung cho Customer và Admin

**Files:**
- Create: `src/features/auth/data/authRepository.ts`
- Create: `src/features/auth/model/validators.ts`
- Create: `src/features/auth/model/useAuth.ts`
- Create: `src/features/auth/pages/LoginPage.tsx`
- Create: `src/features/auth/pages/RegisterPage.tsx`
- Create: `src/features/auth/pages/VerifyOtpPage.tsx`
- Create: `src/features/auth/pages/ForgotPasswordPage.tsx`
- Create: `src/features/auth/pages/ResetPasswordPage.tsx`
- Create: `src/features/auth/pages/AdminAccessPage.tsx`
- Create: `src/features/auth/components/AuthLayout.tsx`
- Create: `src/features/auth/AuthFlow.test.tsx`
- Create: `src/features/auth/index.ts`
- Create: `src/app/router/guards/AuthGuard.tsx`
- Create: `src/app/router/guards/GuestGuard.tsx`
- Modify: `src/app/router/AppRouter.tsx`

**Interfaces:**
- Produces: `useAuth()`, auth pages, `AuthGuard`, `GuestGuard`.
- Consumes: `useDemoStore()`, `ROUTES`, shared form controls và toast.

- [ ] **Step 1: Viết tests cho login, role redirect và session không hợp lệ**

```tsx
it('redirects the demo customer to the shop after login', async () => {
  renderAuthAt('/login')
  await loginWith('customer@stylemind.vn', 'StyleMind123!')
  expect(currentPath()).toBe('/shop')
})

it('redirects the demo admin to the admin area after login', async () => {
  renderAuthAt('/login')
  await loginWith('admin@stylemind.vn', 'Admin123!')
  expect(currentPath()).toBe('/admin')
  expect(await screen.findByRole('heading', { name: 'Khu vực quản trị' })).toBeInTheDocument()
})

it('clears a session for a locked user and returns to login', async () => {
  renderProtectedRouteWithLockedSession('/checkout')
  expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
})
```

Run: `cmd /c npm test -- src/features/auth/AuthFlow.test.tsx`

Expected: FAIL vì auth feature chưa tồn tại.

- [ ] **Step 2: Triển khai validators và auth repository**

```ts
export interface LoginInput { email: string; password: string; remember: boolean }
export interface RegisterInput { fullName: string; email: string; password: string; confirmPassword: string }

export async function login(database: DemoDatabase, input: LoginInput): Promise<User>
export async function register(database: DemoDatabase, input: RegisterInput): Promise<User>
export async function verifyOtp(code: string): Promise<void>
export async function requestPasswordReset(email: string): Promise<void>
```

Repository dùng `wait(350)`. OTP demo là `123456`. Email được `trim().toLowerCase()`. Lỗi trả message tiếng Việt: sai thông tin, tài khoản bị khóa, email đã tồn tại, OTP không đúng.

- [ ] **Step 3: Triển khai auth pages và đầy đủ state form**

Login có email, password, hiện/ẩn password, ghi nhớ, nút đăng nhập, quên mật khẩu và link đăng ký. Register có bốn trường yêu cầu. OTP có sáu ô, countdown 60 giây và resend. Forgot/reset nối đúng flow và hiển thị success state trước khi quay lại login. `AdminAccessPage` là màn hình role handoff tiếng Việt có tên tài khoản, role, nút đăng xuất và route `/admin`; kế hoạch Admin kế tiếp thay route này bằng `AdminLayout` mà không đổi login contract.

- [ ] **Step 4: Triển khai route guards**

`GuestGuard` chuyển user đang đăng nhập sang `/shop` hoặc `/admin`. `AuthGuard` kiểm tra session và trạng thái user; user không hợp lệ dispatch logout rồi chuyển `/login` với `state.from`.

- [ ] **Step 5: Chạy test và build**

Run:

```powershell
cmd /c npm test -- src/features/auth/AuthFlow.test.tsx
cmd /c npm run build
```

Expected: Customer, Admin và invalid-session tests PASS.

- [ ] **Step 6: Commit task**

```powershell
git add src/features/auth src/app/router
git commit -m "feat: add Vietnamese authentication flows"
```

### Task 5: Trang chủ và product seed chỉ gồm quần áo nữ

**Files:**
- Create: `src/features/home/pages/HomePage.tsx`
- Create: `src/features/home/components/HeroSection.tsx`
- Create: `src/features/home/components/WardrobeIntro.tsx`
- Create: `src/features/home/components/ProductRail.tsx`
- Create: `src/features/home/index.ts`
- Modify: `src/app/data/demoSeed.ts`
- Create: `src/app/data/demoSeed.test.ts`
- Modify: `src/app/router/AppRouter.tsx`

**Interfaces:**
- Produces: `HomePage`; seed có tối thiểu 12 sản phẩm quần áo nữ và ảnh theo màu.
- Consumes: `ROUTES`, `Product`, `formatCurrency()`.

- [ ] **Step 1: Viết test phạm vi sản phẩm trước**

```ts
it('seeds only supported womenswear categories', () => {
  const allowed = new Set(['tops', 'pants', 'skirts', 'dresses', 'outerwear'])
  const seed = createDemoSeed()
  expect(seed.products.length).toBeGreaterThanOrEqual(12)
  expect(seed.products.every(product => allowed.has(product.categoryId))).toBe(true)
})

it('provides a separate primary gallery for every active product color', () => {
  for (const product of createDemoSeed().products) {
    for (const color of new Set(product.variants.filter(v => v.active).map(v => v.color))) {
      const images = product.variants.filter(v => v.color === color).flatMap(v => v.images)
      expect(images.some(image => image.isPrimary)).toBe(true)
    }
  }
})
```

Run: `cmd /c npm test -- src/app/data/demoSeed.test.ts`

Expected: FAIL vì product seed chưa đầy đủ.

- [ ] **Step 2: Chuyển dữ liệu quần áo hợp lệ từ mock hiện tại sang seed mới**

Seed 12 sản phẩm tiếng Việt, phân bổ tối thiểu hai sản phẩm mỗi nhóm: áo, quần, chân váy, đầm, áo khoác. Mỗi sản phẩm có `style`, `occasions`, `material`, `fit`, `pattern`, từ hai màu và ba size. Tái sử dụng URL ảnh quần áo đang hoạt động trong `src/data/mockData.ts`; không chuyển record Shoes, Bags hoặc Accessories.

- [ ] **Step 3: Triển khai Home tiếng Việt**

Hero hiển thị tên StyleMind, mô tả AI có thể xây dựng tủ đồ từ sản phẩm thật, CTA `Tạo tủ đồ của tôi` đến `/ai-wardrobe`, CTA `Mua sắm ngay` đến `/shop`. Phần giới thiệu AI có bốn bước và các rail `Sản phẩm mới`, `Được yêu thích`, `Mua theo danh mục`.

- [ ] **Step 4: Chạy test và build**

Run:

```powershell
cmd /c npm test -- src/app/data/demoSeed.test.ts
cmd /c npm run build
```

Expected: Seed test PASS; `/` render Home tiếng Việt.

- [ ] **Step 5: Commit task**

```powershell
git add src/features/home src/app/data src/app/router
git commit -m "feat: add Vietnamese home and clothing catalog seed"
```

### Task 6: Shop, search, sort và responsive filters

**Files:**
- Create: `src/features/catalog/model/types.ts`
- Create: `src/features/catalog/model/filterProducts.ts`
- Create: `src/features/catalog/model/filterProducts.test.ts`
- Create: `src/features/catalog/components/ProductCard.tsx`
- Create: `src/features/catalog/components/FilterPanel.tsx`
- Create: `src/features/catalog/components/MobileFilterSheet.tsx`
- Create: `src/features/catalog/pages/ShopPage.tsx`
- Create: `src/features/catalog/ShopPage.test.tsx`
- Create: `src/features/catalog/index.ts`
- Modify: `src/app/router/AppRouter.tsx`
- Modify: `src/app/layouts/components/CustomerHeader.tsx`

**Interfaces:**
- Produces: `CatalogFilters`, `filterProducts(products, filters)`, `ProductCard`, `ShopPage`.
- Consumes: `Product[]`, `ROUTES`, shared UI và formatter.

- [ ] **Step 1: Viết pure filter tests trước**

```ts
const filters: CatalogFilters = {
  query: 'đi làm',
  categoryIds: ['tops'],
  colors: ['Trắng'],
  sizes: ['M'],
  styles: ['minimal'],
  occasions: ['work'],
  price: { min: 300_000, max: 900_000 },
  sort: 'price-asc',
}

it('combines search, filters and sort without mutating products', () => {
  const original = structuredClone(products)
  const result = filterProducts(products, filters)
  expect(result.every(product => product.categoryId === 'tops')).toBe(true)
  expect(result.map(product => product.basePrice)).toEqual([...result.map(p => p.basePrice)].sort((a, b) => a - b))
  expect(products).toEqual(original)
})
```

Run: `cmd /c npm test -- src/features/catalog/model/filterProducts.test.ts`

Expected: FAIL vì filter function chưa tồn tại.

- [ ] **Step 2: Triển khai filter model**

Search normalize Unicode về lowercase, trim và tìm trong `name`, category label, style label, occasion label, material và tags. Filter variant chỉ tính variant active còn stock. Sort hỗ trợ `featured`, `newest`, `price-asc`, `price-desc`.

- [ ] **Step 3: Viết interaction tests cho Shop**

```tsx
it('clears all active filters and restores the catalog', async () => {
  const user = userEvent.setup()
  renderShop()
  await user.click(screen.getByRole('checkbox', { name: 'Áo' }))
  await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))
  expect(screen.getAllByRole('article')).toHaveLength(createDemoSeed().products.length)
})

it('shows the empty-search state in Vietnamese', async () => {
  renderShop('/shop?q=khongcosanpham')
  expect(await screen.findByText('Không tìm thấy sản phẩm phù hợp')).toBeInTheDocument()
})
```

- [ ] **Step 4: Triển khai Shop desktop/mobile**

Desktop có sidebar cố định theo luồng trang, product grid responsive và sort select. Mobile có nút icon Filter mở bottom sheet; lựa chọn chỉ áp dụng khi bấm `Áp dụng`, nút `Xóa bộ lọc` reset draft và active filters. Query tìm kiếm đồng bộ với URL `?q=` để reload giữ kết quả.

- [ ] **Step 5: Kết nối tìm kiếm header**

Enter từ ô tìm kiếm điều hướng đến `/shop?q=<encoded query>`. Không giữ search state trong `CustomerHeader` sau khi navigation hoàn tất.

- [ ] **Step 6: Chạy test và build**

Run:

```powershell
cmd /c npm test -- src/features/catalog
cmd /c npm run build
```

Expected: Pure model và UI tests PASS; query URL hoạt động khi reload.

- [ ] **Step 7: Commit task**

```powershell
git add src/features/catalog src/app/router src/app/layouts/components/CustomerHeader.tsx
git commit -m "feat: add searchable filtered clothing catalog"
```

### Task 7: Product detail với gallery theo màu và variant selection

**Files:**
- Create: `src/features/product-detail/model/productSelection.ts`
- Create: `src/features/product-detail/model/productSelection.test.ts`
- Create: `src/features/product-detail/components/ProductGallery.tsx`
- Create: `src/features/product-detail/components/ColorSelector.tsx`
- Create: `src/features/product-detail/components/SizeSelector.tsx`
- Create: `src/features/product-detail/pages/ProductDetailPage.tsx`
- Create: `src/features/product-detail/ProductDetailPage.test.tsx`
- Create: `src/features/product-detail/index.ts`
- Modify: `src/app/router/AppRouter.tsx`

**Interfaces:**
- Produces: `getProductSelection()`, `ProductDetailPage`.
- Consumes: product seed, `useDemoStore()`, cart action, `ROUTES`.

- [ ] **Step 1: Viết selection tests trước**

```ts
it('switches the visible gallery when color changes', () => {
  const white = getProductSelection(product, { color: 'Trắng', size: 'M' })
  const black = getProductSelection(product, { color: 'Đen', size: 'M' })
  expect(white.images[0]?.url).not.toBe(black.images[0]?.url)
})

it('marks an out-of-stock size as unavailable', () => {
  const result = getProductSelection(product, { color: 'Đen', size: 'XL' })
  expect(result.canPurchase).toBe(false)
  expect(result.error).toBe('Kích thước này hiện đã hết hàng')
})
```

Run: `cmd /c npm test -- src/features/product-detail/model/productSelection.test.ts`

Expected: FAIL vì selection model chưa tồn tại.

- [ ] **Step 2: Triển khai selection model và gallery**

Chọn màu sẽ chọn variant cùng màu đầu tiên còn hàng, reset thumbnail và giữ size cũ nếu size đó còn hàng. Gallery chỉ nhận ảnh của màu hiện tại, có main image, thumbnail, alt tiếng Việt và controls không làm layout nhảy.

- [ ] **Step 3: Viết page interaction test**

```tsx
it('requires a size before adding a product to the cart', async () => {
  const user = userEvent.setup()
  renderProductDetail('prd-blouse-01')
  await user.click(screen.getByRole('button', { name: 'Thêm vào giỏ' }))
  expect(screen.getByText('Vui lòng chọn kích thước')).toBeInTheDocument()
})

it('buy now adds the selected variant and navigates to checkout', async () => {
  const user = userEvent.setup()
  renderProductDetail('prd-blouse-01')
  await user.click(screen.getByRole('button', { name: 'Kích thước M' }))
  await user.click(screen.getByRole('button', { name: 'Mua ngay' }))
  expect(currentPath()).toBe('/checkout')
})
```

- [ ] **Step 4: Triển khai Product Detail tiếng Việt**

Hiển thị tên, giá hiện hành, mô tả, phong cách, dịp, chất liệu, phom, họa tiết, selector màu/size, quantity stepper, `Thêm vào giỏ` và `Mua ngay`. Quantity tối đa bằng stock variant; route product không tồn tại hiển thị empty state và link về shop.

- [ ] **Step 5: Chạy test và build**

Run:

```powershell
cmd /c npm test -- src/features/product-detail
cmd /c npm run build
```

Expected: Dynamic gallery, size validation và buy-now tests PASS.

- [ ] **Step 6: Commit task**

```powershell
git add src/features/product-detail src/app/router
git commit -m "feat: add variant-aware product details"
```

### Task 8: Cart calculations, persistence và confirmation

**Files:**
- Create: `src/features/cart/model/cartSelectors.ts`
- Create: `src/features/cart/model/cartSelectors.test.ts`
- Create: `src/features/cart/components/CartLineItem.tsx`
- Create: `src/features/cart/components/CartSummary.tsx`
- Create: `src/features/cart/pages/CartPage.tsx`
- Create: `src/features/cart/CartPage.test.tsx`
- Create: `src/features/cart/index.ts`
- Modify: `src/app/router/AppRouter.tsx`

**Interfaces:**
- Produces: `selectCartDetails()`, `selectCartTotals()`, `CartPage`.
- Consumes: `DemoDatabase`, cart actions, Modal, EmptyState, formatCurrency.

- [ ] **Step 1: Viết calculation tests trước**

```ts
it('calculates subtotal, discount, shipping and total in VND integers', () => {
  const totals = selectCartTotals(database, { discountCode: 'STYLE10' })
  expect(totals.discount).toBe(Math.round(totals.subtotal * 0.1))
  expect(totals.shipping).toBe(totals.subtotal >= 1_500_000 ? 0 : 30_000)
  expect(totals.total).toBe(totals.subtotal - totals.discount + totals.shipping)
})

it('never returns a purchasable quantity above stock', () => {
  const detail = selectCartDetails(database).find(line => line.variant.id === 'var-blouse-white-m')
  expect(detail?.quantity).toBeLessThanOrEqual(detail?.variant.stock ?? 0)
})
```

Run: `cmd /c npm test -- src/features/cart/model/cartSelectors.test.ts`

Expected: FAIL vì selectors chưa tồn tại.

- [ ] **Step 2: Triển khai selectors**

Selector join cart line với product và variant, loại record mồ côi khỏi phần tính tiền nhưng đánh dấu để provider có thể cleanup. `STYLE10` giảm 10%, tối đa 200.000đ. Miễn phí vận chuyển từ 1.500.000đ; còn lại 30.000đ.

- [ ] **Step 3: Viết Cart interaction tests**

```tsx
it('requires confirmation before removing a line', async () => {
  const user = userEvent.setup()
  renderCartWithOneLine()
  await user.click(screen.getByRole('button', { name: 'Xóa Áo blouse cổ vuông' }))
  expect(screen.getByRole('dialog', { name: 'Xóa sản phẩm khỏi giỏ?' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Xóa sản phẩm' }))
  expect(screen.getByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument()
})
```

- [ ] **Step 4: Triển khai Cart page**

Mỗi dòng hiển thị ảnh đúng màu, tên, màu, size, giá, quantity stepper và nút icon xóa có tooltip/aria-label. Summary hiển thị tạm tính, giảm giá, vận chuyển và tổng; CTA `Tiến hành thanh toán`. Empty state có CTA `Bắt đầu mua sắm`.

- [ ] **Step 5: Chạy test, reload test thủ công và build**

Run:

```powershell
cmd /c npm test -- src/features/cart
cmd /c npm run build
```

Expected: Tests PASS; reload giữ cart line và quantity.

- [ ] **Step 6: Commit task**

```powershell
git add src/features/cart src/app/router
git commit -m "feat: add persistent cart experience"
```

### Task 9: Checkout COD, VietQR và tạo đơn chống trùng

**Files:**
- Create: `src/features/checkout/model/checkoutMachine.ts`
- Create: `src/features/checkout/model/checkoutMachine.test.ts`
- Create: `src/features/checkout/data/checkoutRepository.ts`
- Create: `src/features/checkout/components/AddressSection.tsx`
- Create: `src/features/checkout/components/OrderItemsSection.tsx`
- Create: `src/features/checkout/components/PaymentMethodSection.tsx`
- Create: `src/features/checkout/components/OrderSummarySection.tsx`
- Create: `src/features/checkout/pages/CheckoutPage.tsx`
- Create: `src/features/checkout/pages/QrPaymentPage.tsx`
- Create: `src/features/checkout/pages/OrderSuccessPage.tsx`
- Create: `src/features/checkout/CheckoutFlow.test.tsx`
- Create: `src/features/checkout/index.ts`
- Modify: `src/app/router/AppRouter.tsx`
- Modify: `src/app/router/guards/AuthGuard.tsx`

**Interfaces:**
- Produces: `CheckoutState`, `checkoutReducer`, `placeCodOrder()`, `createQrSession()`, `confirmQrPayment()`.
- Consumes: cart selectors, `DemoStore`, Address/Order types, AuthGuard, shared UI.

- [ ] **Step 1: Viết state-machine tests trước**

```ts
it('expires a pending QR session at its deadline', () => {
  const state = createQrState({ expiresAt: '2026-09-25T06:00:00.000Z' })
  const next = checkoutReducer(state, { type: 'clock/ticked', payload: { now: '2026-09-25T06:00:01.000Z' } })
  expect(next.status).toBe('expired')
})

it('ignores repeated payment confirmation for an already-created order', () => {
  const paid = createPaidQrState({ orderId: 'ORD-20260925-001' })
  const next = checkoutReducer(paid, { type: 'payment/confirmed', payload: { orderId: 'ORD-20260925-002' } })
  expect(next.orderId).toBe('ORD-20260925-001')
})
```

Run: `cmd /c npm test -- src/features/checkout/model/checkoutMachine.test.ts`

Expected: FAIL vì checkout machine chưa tồn tại.

- [ ] **Step 2: Triển khai checkout state machine và repository**

```ts
export type CheckoutStatus = 'editing' | 'placing' | 'waiting_payment' | 'verifying' | 'expired' | 'succeeded' | 'failed'

export interface QrSession {
  id: string
  amount: number
  transferContent: string
  expiresAt: string
  orderId: string | null
}

export async function placeCodOrder(input: PlaceOrderInput): Promise<Order>
export async function createQrSession(input: CreateQrInput): Promise<QrSession>
export async function confirmQrPayment(session: QrSession, database: DemoDatabase): Promise<Order>
```

Repository tạo order ID theo `ORD-YYYYMMDD-NNN`, snapshot sản phẩm/giá/địa chỉ, và dùng `session.id` làm `paymentReference`. Nếu database đã có order cùng `paymentReference`, `confirmQrPayment` trả lại order đó. Reducer `order/placed` bỏ qua payload có `id` hoặc `paymentReference` đã tồn tại, tạo hai lớp bảo vệ chống trùng.

- [ ] **Step 3: Viết integration tests cho guard và hai payment flow**

```tsx
it('redirects an empty cart from checkout to cart', async () => {
  renderAt('/checkout', { cartLines: [] })
  expect(await screen.findByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument()
  expect(currentPath()).toBe('/cart')
})

it('places one COD order and clears purchased cart lines', async () => {
  const user = userEvent.setup()
  renderCheckoutWithCustomerAndCart()
  await user.click(screen.getByLabelText('Thanh toán khi nhận hàng'))
  await user.click(screen.getByRole('button', { name: 'Đặt hàng' }))
  expect(await screen.findByText('Đặt hàng thành công')).toBeInTheDocument()
  expect(getDatabase().orders).toHaveLength(1)
  expect(getDatabase().cartLines).toHaveLength(0)
})

it('does not create an order when an expired QR is confirmed', async () => {
  renderExpiredQrSession()
  expect(screen.getByText('Thanh toán đã hết hạn')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Tôi đã thanh toán' })).not.toBeInTheDocument()
  expect(getDatabase().orders).toHaveLength(0)
})

it('creates only one order when the same QR session is confirmed twice', async () => {
  const session = createActiveQrSession({ id: 'qr-idempotent-01' })
  const first = await confirmQrPayment(session, getDatabase())
  dispatch({ type: 'order/placed', payload: first })
  const second = await confirmQrPayment(session, getDatabase())
  dispatch({ type: 'order/placed', payload: second })
  expect(getDatabase().orders.filter(order => order.paymentReference === session.id)).toHaveLength(1)
})
```

- [ ] **Step 4: Triển khai Checkout page**

Checkout hiển thị địa chỉ đang chọn, nút đổi/thêm địa chỉ, sản phẩm, COD/VietQR, discount và tổng tiền. Form địa chỉ yêu cầu tên, điện thoại Việt Nam 10 số và địa chỉ đầy đủ. CTA bị disable khi thiếu địa chỉ hoặc cart line không còn stock.

- [ ] **Step 5: Triển khai QR và Order Success pages**

QR page hiển thị QR demo, số tiền, nội dung chuyển khoản, hướng dẫn, countdown và trạng thái. `Tôi đã thanh toán` chờ 900ms ở trạng thái `Đang xác minh thanh toán`, sau đó tạo đúng một order. Hết hạn có nút `Tạo mã QR mới`. Success page hiển thị mã đơn, tổng, phương thức, `Xem đơn hàng` và `Tiếp tục mua sắm`.

- [ ] **Step 6: Chạy test và build**

Run:

```powershell
cmd /c npm test -- src/features/checkout
cmd /c npm run build
```

Expected: Empty-cart, COD, QR expiry và idempotency tests PASS.

- [ ] **Step 7: Commit task**

```powershell
git add src/features/checkout src/app/router src/app/store src/entities/order
git commit -m "feat: add COD and VietQR checkout flows"
```

### Task 10: Xác minh tích hợp đợt Customer commerce

**Files:**
- Create: `src/app/CustomerCommerce.smoke.test.tsx`
- Modify: `src/index.css`
- Modify: các file feature phát hiện lỗi khi verification

**Interfaces:**
- Produces: bằng chứng test/build cho toàn bộ đợt.
- Consumes: tất cả public API từ Task 1-9.

- [ ] **Step 1: Viết smoke test xuyên feature**

```tsx
it('completes login, search, product selection, cart and COD checkout', async () => {
  const user = userEvent.setup()
  renderApplication('/login')
  await loginWith('customer@stylemind.vn', 'StyleMind123!')
  await searchFor('áo blouse')
  await user.click(await screen.findByRole('link', { name: /Áo blouse cổ vuông/ }))
  await user.click(screen.getByRole('button', { name: 'Kích thước M' }))
  await user.click(screen.getByRole('button', { name: 'Thêm vào giỏ' }))
  await navigateToCartAndCheckout()
  await user.click(screen.getByLabelText('Thanh toán khi nhận hàng'))
  await user.click(screen.getByRole('button', { name: 'Đặt hàng' }))
  expect(await screen.findByText('Đặt hàng thành công')).toBeInTheDocument()
})
```

- [ ] **Step 2: Chạy toàn bộ test suite**

Run: `cmd /c npm test`

Expected: Tất cả test PASS, không có unhandled rejection hoặc React act warning.

- [ ] **Step 3: Chạy typecheck và production build**

Run:

```powershell
cmd /c npm run typecheck
cmd /c npm run build
```

Expected: Hai lệnh exit code 0.

- [ ] **Step 4: Khởi động dev server và kiểm tra route trực tiếp**

Run: `cmd /c npm run dev`

Kiểm tra HTTP 200 và render đúng tại `/`, `/login`, `/shop`, `/products/prd-blouse-01`, `/cart`, `/checkout` và một route 404. Reload từng route không được quay về Home ngoài ý muốn.

- [ ] **Step 5: Kiểm tra responsive và nội dung**

Kiểm tra tại 390x844, 768x1024 và 1440x900. Xác nhận không có text chồng lấn, filter mobile mở/đóng được, sticky action không che nội dung, dialog nằm trong viewport và header không có Admin/Travel/Studio. Dùng `rg` để tìm `window.alert`, `window.confirm`, `Travel Planner`, `Visual Studio`, `Shoes`, `Bags`, `Accessories` trong active imports/UI; kết quả active phải rỗng.

- [ ] **Step 6: Commit verification fixes**

```powershell
git add src
git commit -m "test: verify customer commerce demo flow"
```

## Self-review của kế hoạch

- Phạm vi đợt này bao phủ foundation, routing, persistence, shared UI, authentication, Home, catalog, product detail, cart và checkout trong spec.
- Năm trọng tâm review đều có test cụ thể trong Task 2, 4, 8 và 9.
- Interface `DemoDatabase`, `DemoAction`, `useDemoStore`, `CatalogFilters`, cart selectors và checkout repository được định nghĩa trước khi task sau sử dụng.
- Customer order history, cancellation, return, profile, notifications và Admin được tách thành các kế hoạch độc lập như phần ranh giới đợt triển khai, không bị lẫn vào task hiện tại.
- Không có bước yêu cầu thay đổi nghiệp vụ Wardrobe.
