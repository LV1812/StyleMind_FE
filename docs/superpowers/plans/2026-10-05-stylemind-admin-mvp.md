# StyleMind Admin MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable Vietnamese Admin MVP for StyleMind that uses the same persistent mock store as Customer.

**Architecture:** Add a `src/features/admin` feature with focused selectors, labels, panels and a single `/admin` route protected by the existing role guard. Extend the demo reducer with typed admin mutations so UI actions update products, categories, orders, requests, users, notifications and AI metadata in one shared store.

**Tech Stack:** React 19, React Router 7, TypeScript, Tailwind CSS v4, Vitest, React Testing Library, existing Context + typed reducer store.

**Spec:** `docs/superpowers/specs/2026-10-05-stylemind-admin-mvp-design.md`

## Global Constraints

- Visible UI text must be Vietnamese; source identifiers, routes, types, action names and component names remain English.
- Admin MVP excludes inventory, warehouse, stock-in/out, low stock and inventory transaction UI.
- Admin and Customer must read/write the same mock database persisted in `DEMO_STORAGE_KEY`.
- Use existing shared UI (`Button`, `Modal`, `TextField`, `SelectField`, `ToastProvider`) where it fits.
- No `window.alert()` or `window.confirm()` in active admin flows.
- Keep active imports feature-first through `src/features/admin/index.ts`.
- Do not push; commits are local only.

## Review Focus

- Existing checkout tests assume an empty `orders` seed; Task 1 adds admin demo orders and must update affected checkout/customer fixtures to set `orders: []` explicitly.
- Admin cannot lock the currently signed-in admin; Task 1 reducer tests must cover this guard.
- Approving cancellation/return must update both request state and customer-visible notification; Task 1 reducer tests and Task 4 UI tests must assert both.
- Product/variant ACTIVE toggles must affect customer-facing eligibility through existing normalization/catalog logic; Task 1 tests must cover at least cart normalization for inactive variant/product.
- Mobile admin tables must degrade to structured lists without overlapping text; Task 5 final verification must include visual/manual checks at desktop and mobile widths.

---

## File Structure

- Modify `src/app/store/types.ts`: add admin action payloads and reviewed request fields.
- Modify `src/app/store/demoReducer.ts`: implement admin mutations and normalization interactions.
- Modify `src/app/store/demoReducer.test.ts`: reducer tests for admin actions.
- Modify `src/app/data/demoSeed.ts`: add minimal admin demo orders/requests and update tests for prior empty-order assumptions.
- Modify `src/app/data/demoSeed.test.ts`: assert no unsupported categories/accessories and no inventory management seed requirement.
- Create `src/features/admin/model/adminTypes.ts`: admin view-model and filter types.
- Create `src/features/admin/model/adminLabels.ts`: Vietnamese status/payment/metadata labels.
- Create `src/features/admin/model/adminSelectors.ts`: derived dashboard, product, category, order, request, customer and AI rows.
- Create `src/features/admin/components/AdminShell.tsx`: sidebar/topbar and section navigation.
- Create `src/features/admin/components/AdminCommon.tsx`: local table/list, status badge, metric card helpers.
- Create `src/features/admin/pages/AdminPage.tsx`: page state, store wiring and panel composition.
- Create `src/features/admin/pages/AdminPage.test.tsx`: route/dashboard and multi-section UI tests.
- Create panel components as needed under `src/features/admin/components/`: `AdminOverviewPanel.tsx`, `AdminProductsPanel.tsx`, `AdminCategoriesPanel.tsx`, `AdminOrdersPanel.tsx`, `AdminRequestsPanel.tsx`, `AdminCustomersPanel.tsx`, `AdminAiPanel.tsx`.
- Create `src/features/admin/index.ts`: public export for `AdminPage`.
- Modify `src/app/router/AppRouter.tsx`: route `/admin` to `AdminPage`.
- Modify `src/features/auth/AuthFlow.test.tsx`: update admin login assertion from handoff page to real admin dashboard.
- Modify `src/features/auth/index.ts`: stop exporting `AdminAccessPage` after the active route moves to `src/features/admin`.

## Task 1: Admin Store Actions, Selectors And Seed Data

**Files:**
- Modify: `src/app/store/types.ts`
- Modify: `src/app/store/demoReducer.ts`
- Modify: `src/app/store/demoReducer.test.ts`
- Modify: `src/app/data/demoSeed.ts`
- Modify: `src/app/data/demoSeed.test.ts`
- Modify: `src/features/checkout/CheckoutFlow.test.tsx`
- Modify: `src/app/CustomerCompleteFlow.smoke.test.tsx`
- Create: `src/features/admin/model/adminTypes.ts`
- Create: `src/features/admin/model/adminLabels.ts`
- Create: `src/features/admin/model/adminSelectors.ts`

**Interfaces:**
- Produces `AdminSection = 'overview' | 'products' | 'categories' | 'orders' | 'requests' | 'customers' | 'ai'`.
- Produces `selectAdminDashboard(database: DemoDatabase): AdminDashboardSummary`.
- Produces `selectAdminProducts(database: DemoDatabase, filters: AdminProductFilters): AdminProductRow[]`.
- Produces `selectAdminOrders(database: DemoDatabase, filters: AdminOrderFilters): AdminOrderRow[]`.
- Produces `selectAdminRequests(database: DemoDatabase): AdminRequestSummary`.
- Produces `selectAdminCustomers(database: DemoDatabase, filters: AdminCustomerFilters): AdminCustomerRow[]`.
- Extends `DemoAction` with:
  - `{ type: 'admin/userStatusChanged'; payload: { userId: string; status: UserStatus; actorId: string } }`
  - `{ type: 'admin/categoryUpserted'; payload: ProductCategory }`
  - `{ type: 'admin/categoryStatusChanged'; payload: { categoryId: string; active: boolean } }`
  - `{ type: 'admin/productUpserted'; payload: Product }`
  - `{ type: 'admin/productStatusChanged'; payload: { productId: string; active: boolean } }`
  - `{ type: 'admin/variantStatusChanged'; payload: { productId: string; variantId: string; active: boolean } }`
  - `{ type: 'admin/orderStatusChanged'; payload: { orderId: string; status: OrderStatus; at: string } }`
  - `{ type: 'admin/cancellationReviewed'; payload: { requestId: string; decision: 'approved' | 'rejected'; reviewerId: string; reviewedAt: string; note?: string } }`
  - `{ type: 'admin/returnReviewed'; payload: { requestId: string; decision: 'approved' | 'rejected' | 'refunded'; reviewerId: string; reviewedAt: string; note?: string } }`
  - `{ type: 'admin/fashionMetadataOptionUpserted'; payload: { group: keyof FashionMetadata; option: FashionMetadataOption } }`
  - `{ type: 'admin/fashionMetadataOptionStatusChanged'; payload: { group: keyof FashionMetadata; optionId: string; active: boolean } }`
  - `{ type: 'admin/compatibilityRuleUpserted'; payload: CompatibilityRule }`
  - `{ type: 'admin/compatibilityRuleStatusChanged'; payload: { ruleId: string; active: boolean } }`

- [ ] **Step 1: Write failing reducer and selector tests**

Add tests named:

```ts
it('prevents an admin from locking the current admin account', () => {})
it('toggles products and variants for customer eligibility', () => {})
it('reviews a cancellation request and notifies the customer', () => {})
it('reviews a return request and records refund state', () => {})
it('summarizes admin dashboard metrics from the demo database', () => {})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cmd /c npm test -- src/app/store/demoReducer.test.ts src/app/data/demoSeed.test.ts`

Expected: FAIL because admin actions/selectors do not exist.

- [ ] **Step 3: Implement typed actions and reducer logic**

Implement the interfaces above. Cancellation approval sets the matching order to `cancelled`, appends a timeline item, marks request `approved`, and creates an unread `order` notification linked to `/orders/<orderId>`. Rejection leaves the order status unchanged and creates a notification. Return approval/rejection/refund updates the request status and creates a notification.

- [ ] **Step 4: Implement admin labels/selectors**

Selectors must tolerate empty `orders`, `cancellationRequests`, `returnRequests` and `compatibilityRules`. Dashboard metrics must derive from actual arrays where possible and use `aiMetrics` only for AI aggregate seed.

- [ ] **Step 5: Add minimal admin demo data and update empty-order fixtures**

Add at least two seeded orders for `usr-customer-01`: one cancellable order with a submitted cancellation request and one returnable order with a submitted return request. Update checkout/customer test helpers that expect a fresh cart-to-order flow by passing `orders: []`, `cancellationRequests: []`, and `returnRequests: []` explicitly. Do not add any accessory categories or inventory-specific seed fields.

- [ ] **Step 6: Run tests to verify they pass**

Run: `cmd /c npm test -- src/app/store/demoReducer.test.ts src/app/data/demoSeed.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/store src/app/data src/features/admin/model src/features/checkout src/app/CustomerCompleteFlow.smoke.test.tsx
git commit -m "feat: add admin store model"
```

## Task 2: Admin Route, Shell And Dashboard

**Files:**
- Create: `src/features/admin/index.ts`
- Create: `src/features/admin/components/AdminShell.tsx`
- Create: `src/features/admin/components/AdminCommon.tsx`
- Create: `src/features/admin/components/AdminOverviewPanel.tsx`
- Create: `src/features/admin/pages/AdminPage.tsx`
- Create: `src/features/admin/pages/AdminPage.test.tsx`
- Modify: `src/app/router/AppRouter.tsx`
- Modify: `src/features/auth/AuthFlow.test.tsx`
- Modify: `src/features/auth/index.ts`

**Interfaces:**
- Consumes selectors and `AdminSection` from Task 1.
- Produces `AdminPage` exported from `src/features/admin/index.ts`.
- `AdminPage` uses `useSearchParams` with `section`; invalid/missing values resolve to `overview`.

- [ ] **Step 1: Write failing route/dashboard tests**

Add tests named:

```tsx
it('renders the admin dashboard for an authenticated admin', async () => {})
it('redirects a customer away from the admin route', async () => {})
it('logs out from the admin shell', async () => {})
it('opens the products section from the sidebar query navigation', async () => {})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cmd /c npm test -- src/features/admin/pages/AdminPage.test.tsx src/features/auth/AuthFlow.test.tsx`

Expected: FAIL because `AdminPage` and route are not implemented.

- [ ] **Step 3: Implement `AdminShell`**

Use semantic landmarks: `<aside>`, `<nav>`, `<main>`, `<header>`. Sidebar labels:

```ts
Tổng quan, Sản phẩm, Danh mục, Đơn hàng, Yêu cầu, Khách hàng, AI
```

Topbar shows current admin name/email, `Xem cửa hàng`, and `Đăng xuất`. The logout button calls `logout()` and navigates to `/login`.

- [ ] **Step 4: Implement `AdminOverviewPanel`**

Show Vietnamese KPI cards, AI analytics, recent orders, and pending request summary. Use real selectors. Empty order/request states must be composed and not look broken.

- [ ] **Step 5: Replace the `/admin` route**

Import `AdminPage` from `@/features/admin`, remove the active `AdminAccessPage` import from `AppRouter.tsx`, remove `AdminAccessPage` from `src/features/auth/index.ts`, and keep `AuthGuard roles={['admin']}` unchanged.

- [ ] **Step 6: Run tests to verify they pass**

Run: `cmd /c npm test -- src/features/admin/pages/AdminPage.test.tsx src/features/auth/AuthFlow.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/admin src/app/router/AppRouter.tsx src/features/auth/AuthFlow.test.tsx src/features/auth/index.ts
git commit -m "feat: add admin dashboard shell"
```

## Task 3: Product And Category Management

**Files:**
- Create: `src/features/admin/components/AdminProductsPanel.tsx`
- Create: `src/features/admin/components/AdminCategoriesPanel.tsx`
- Modify: `src/features/admin/pages/AdminPage.tsx`
- Modify: `src/features/admin/pages/AdminPage.test.tsx`

**Interfaces:**
- Consumes `admin/productUpserted`, `admin/productStatusChanged`, `admin/variantStatusChanged`, `admin/categoryUpserted`, `admin/categoryStatusChanged`.
- Product form uses fields: name, brand, categoryId, basePrice, description, material, fit, pattern, styleIds, occasionIds, tags, active, one starter variant with color, colorHex, size, priceOverride optional, active and image URL.
- Category form uses id, label, description, active, order.

- [ ] **Step 1: Write failing product/category UI tests**

Add tests named:

```tsx
it('filters products and toggles a product inactive', async () => {})
it('creates a product with a color image URL', async () => {})
it('toggles a variant active state', async () => {})
it('creates and deactivates a clothing category', async () => {})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cmd /c npm test -- src/features/admin/pages/AdminPage.test.tsx`

Expected: FAIL because product/category panels are missing.

- [ ] **Step 3: Implement `AdminProductsPanel`**

Use desktop table plus mobile list styles. Include search, status filter, category filter, edit/create modal, product active toggle and variant active toggle. All labels and validation messages must be Vietnamese. Do not expose stock/inventory controls.

- [ ] **Step 4: Implement `AdminCategoriesPanel`**

Use a compact table/list with add/edit and active toggle. Categories remain clothing-only; validation rejects empty label and duplicate id.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cmd /c npm test -- src/features/admin/pages/AdminPage.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/admin
git commit -m "feat: add admin catalog management"
```

## Task 4: Order, Cancellation And Return Management

**Files:**
- Create: `src/features/admin/components/AdminOrdersPanel.tsx`
- Create: `src/features/admin/components/AdminRequestsPanel.tsx`
- Modify: `src/features/admin/pages/AdminPage.tsx`
- Modify: `src/features/admin/pages/AdminPage.test.tsx`

**Interfaces:**
- Consumes `admin/orderStatusChanged`, `admin/cancellationReviewed`, `admin/returnReviewed`.
- Valid admin order next statuses:
  - `pending` -> `confirmed` or `cancelled`
  - `payment_pending` -> `paid` or `cancelled`
  - `paid` -> `confirmed`
  - `confirmed` -> `processing`
  - `processing` -> `shipped`
  - `shipped` -> `completed`
  - terminal: `completed`, `cancelled`

- [ ] **Step 1: Write failing order/request UI tests**

Add tests named:

```tsx
it('filters orders and advances an order status', async () => {})
it('opens order detail with timeline and address snapshot', async () => {})
it('approves a cancellation request and creates a customer notification', async () => {})
it('refunds an approved return request and creates a customer notification', async () => {})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cmd /c npm test -- src/features/admin/pages/AdminPage.test.tsx`

Expected: FAIL because order/request panels are missing.

- [ ] **Step 3: Implement `AdminOrdersPanel`**

Show order ID, customer, date, total, payment method/status, order status and actions. Detail panel shows products, shipping snapshot, timeline and next status buttons. Disable invalid transitions with Vietnamese helper text.

- [ ] **Step 4: Implement `AdminRequestsPanel`**

Use tabs `Hủy đơn` and `Đổi/trả`. Each row shows request id, order, customer, reason, date, status and decision actions. Approval/rejection/refund buttons dispatch reducer actions and show toast.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cmd /c npm test -- src/features/admin/pages/AdminPage.test.tsx src/app/store/demoReducer.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/admin src/app/store
git commit -m "feat: add admin order operations"
```

## Task 5: Customer, AI Management, Polish And Verification

**Files:**
- Create: `src/features/admin/components/AdminCustomersPanel.tsx`
- Create: `src/features/admin/components/AdminAiPanel.tsx`
- Modify: `src/features/admin/pages/AdminPage.tsx`
- Modify: `src/features/admin/pages/AdminPage.test.tsx`
- Modify: `src/index.css` only if admin needs small responsive helpers not expressible cleanly in Tailwind classes

**Interfaces:**
- Consumes `admin/userStatusChanged`, `admin/fashionMetadataOptionUpserted`, `admin/fashionMetadataOptionStatusChanged`, `admin/compatibilityRuleUpserted`, `admin/compatibilityRuleStatusChanged`.
- AI metadata groups are keys of `FashionMetadata`: `styles`, `occasions`, `colors`, `materials`, `fits`, `patterns`.

- [ ] **Step 1: Write failing customer/AI UI tests**

Add tests named:

```tsx
it('locks and unlocks a customer but not the current admin', async () => {})
it('adds and deactivates an AI metadata option', async () => {})
it('adds and deactivates a compatibility rule', async () => {})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cmd /c npm test -- src/features/admin/pages/AdminPage.test.tsx`

Expected: FAIL because customer/AI panels are missing.

- [ ] **Step 3: Implement `AdminCustomersPanel`**

Show user name, email, role, status, order count, outfit count and body info when available. Provide search/filter and lock/unlock. The current admin row shows disabled action text `Không thể tự khóa`.

- [ ] **Step 4: Implement `AdminAiPanel`**

Use tabs for metadata and compatibility rules. Add/edit/toggle rows. Keep copy clear that these settings feed AI recommendation data; do not create fake products or modify wardrobe behavior.

- [ ] **Step 5: Polish responsive/admin copy**

Check active admin UI for English visible text. Replace generic labels with Vietnamese. Ensure tables become scrollable or card lists on narrow widths, text wraps inside controls, and no inventory/warehouse words appear in active admin UI.

- [ ] **Step 6: Run focused tests**

Run: `cmd /c npm test -- src/features/admin/pages/AdminPage.test.tsx`

Expected: PASS.

- [ ] **Step 7: Run full verification**

Run:

```bash
cmd /c npm test
cmd /c npm run typecheck
cmd /c npm run build
```

Expected: all pass. Build may keep the existing Vite chunk-size warning only.

- [ ] **Step 8: Commit**

```bash
git add src/features/admin src/index.css
git commit -m "feat: complete admin mvp"
```

## Final Review

After Task 5 passes, run a whole-branch review using `superpowers:requesting-code-review`. The review should focus on admin/customer shared-store consistency, Vietnamese UI copy, missing admin actions, inactive product behavior and tests that were weakened while adapting fixtures.
