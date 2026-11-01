# StyleMind Customer Complete UI Design

## Purpose

Hoan chinh UI customer cua StyleMind theo functional requirements moi, truoc khi lam admin. Phase nay bien app tu MVP mua sam co ban thanh trai nghiem customer day du: account, address, catalog, cart, checkout, order, notification, My Wardrobe, outfit, AI stylist, outfit sharing va shared-with-me.

Muc tieu la FE chay duoc doc lap bang local mock store, nhung UI va flow phai du chat cua san pham that. Giao dien hien thi tieng Viet. Ten bien, component, file va code identifiers tiep tuc dung tieng Anh.

## Scope

### In scope

- Hoan thien tat ca customer routes, khong con customer placeholder.
- Hoan thien account/profile/body info/address management.
- Hoan thien orders, order detail, cancellation request va return request o muc FE/customer.
- Hoan thien notification list, unread count va mark read.
- Hoan thien My Wardrobe chinh cua customer, gom nhieu outfit.
- Hoan thien create outfit manually tu product/variant that trong catalog.
- Hoan thien AI stylist UI bang rule-based mock AI chi dung product/variant co that trong store.
- Hoan thien outfit detail: edit owner, ask AI, add/remove/change variant, add item/outfit to cart.
- Hoan thien outfit sharing: share by email, public link, manage/revoke access, shared-with-me, public viewer.
- Cleanup catalog/cart/checkout de dung nghiep vu khong quan ly ton kho.
- Them test cho cac flow customer quan trong va giu `npm test`, `npm run typecheck`, `npm run build` xanh.

### Out of scope for this phase

- Admin dashboard va admin management screens. `/admin` duoc giu la admin entry tam thoi cho phase sau.
- Backend API, JWT thật, email thật, SePay webhook thật, AI/model thật.
- Multi-wardrobe per customer. Moi customer chi co mot My Wardrobe chinh.
- Inventory/warehouse/stock management.
- Accessories commerce.

## Existing State Summary

Repo da co feature structure cho auth, home, catalog, product detail, cart, checkout va wardrobe deferred page. App co local store, demo seed, reducer va tests. Customer routes hien tai da co:

- `/`, `/shop`, `/products/:productId`, `/cart`
- `/checkout`, `/checkout/qr`, `/order-success/:orderId`
- `/orders`, `/notifications`, `/account` dang la placeholder
- `/ai-wardrobe`, `/wardrobes` dang la deferred page

Design nay giu stack hien tai: React, React Router, TypeScript, Vite, Tailwind-style utility classes, Vitest/Testing Library.

## Customer Routes

Customer routes sau can ton tai va co UI/interaction that:

- `/account`
- `/account/addresses`
- `/orders`
- `/orders/:orderId`
- `/notifications`
- `/wardrobes`
- `/wardrobes/new`
- `/wardrobes/new/ai`
- `/outfits/:outfitId`
- `/shared-with-me`
- `/shared/outfits/:token`

Routes hien co duoc giu:

- `/shop`
- `/products/:productId`
- `/cart`
- `/checkout`
- `/checkout/qr`
- `/order-success/:orderId`

Navigation customer can expose cac luong chinh:

- Trang chu
- Cua hang
- My Wardrobe
- Don hang
- Thong bao
- Tai khoan
- Gio hang

Mobile navigation can giu toi gian nhung phai co duong di toi shop, wardrobe, cart va account. Cac muc con nhu orders/notifications/shared-with-me co the nam trong account hub hoac header menu.

## Data Model Extensions

Local mock store can duoc mo rong de FE chay doc lap. Cac entity moi:

### User profile

`User` can co them:

- `heightCm?: number`
- `weightKg?: number`
- `avatarUrl?: string`

Khong them persistent style, occasion, color preference hoac budget preference vao profile. Cac thong tin nay chi thuoc context cua outfit/chat session.

### Wardrobe and outfit

Moi customer co mot logical My Wardrobe chinh. Co the khong can entity `Wardrobe` rieng neu `Outfit.userId` da du bieu dien ownership.

`Outfit`:

- `id`
- `ownerId`
- `name`
- `description?: string`
- `source: 'manual' | 'ai'`
- `items: OutfitItem[]`
- `visibility: 'private' | 'public'`
- `publicToken?: string`
- `createdAt`
- `updatedAt`

`OutfitItem`:

- `id`
- `productId`
- `variantId`
- `addedBy: 'owner' | 'ai'`
- `note?: string`

Outfit item always references real products and variants from store. Khi product/variant inactive, item van co the hien thi nhu unavailable snapshot nhe neu can, nhung khong cho add to cart.

### AI stylist

`AiConversation`:

- `id`
- `ownerId`
- `outfitId?: string`
- `mode: 'create' | 'edit'`
- `messages: AiMessage[]`
- `requirement: OutfitRequirement`
- `recommendation?: OutfitRecommendation`
- `createdAt`
- `updatedAt`

`OutfitRequirement` is session/outfit context only:

- `occasion?: string`
- `style?: string`
- `preferredColors?: string[]`
- `excludedColors?: string[]`
- `budget?: number`
- `desiredCategories?: string[]`
- `fit?: string`
- `additionalNotes?: string`

`AiMessage`:

- `id`
- `role: 'assistant' | 'user'`
- `body`
- `createdAt`

Rule-based AI phai lay product/variant tu catalog hien co va validate product active + variant active truoc khi de xuat.

### Sharing

`OutfitShare`:

- `id`
- `outfitId`
- `ownerId`
- `viewerEmail`
- `permission: 'view'`
- `active`
- `createdAt`

Public link duoc quan ly tren outfit bang `visibility` va `publicToken`. Public link chi mo duoc mot outfit cu the.

### Notifications

Notifications can them:

- `category: 'system' | 'order' | 'share' | 'wardrobe'`
- `readAt?: string`

Existing `read: boolean` co the giu de don gian, mien UI update nhat quan.

### Cancellation and return requests

Customer co the tao request:

- cancellation: `orderId`, `reason`, `status`
- return: `orderId`, `items`, `reason`, `description`, `status`

Admin review khong nam trong customer phase; UI chi hien trang thai da gui/dang xu ly/da duyet/tu choi neu data co.

## Business Rule Corrections

### No inventory management

Functional requirements moi noi StyleMind khong quan ly ton kho. FE khong hien thi:

- "Con X san pham"
- "Het hang"
- Low stock
- Quantity capped by stock

Purchase validation chi kiem tra:

- Product active
- Variant active

Field `stock` co the tam thoi giu trong seed/types neu viec xoa gay blast radius lon, nhung UI va selectors khong duoc dung `stock` lam nghiep vu mua hang. Sau phase nay co the migrate field trong refactor rieng.

### Product image by color

Product detail tiep tuc doi gallery theo color da chon. Moi color can co anh rieng; card/catalog dung anh primary cua variant active dau tien.

### Outfit privacy

Shared/public outfit khong hien thi:

- Height
- Weight
- AI chat history
- User feedback trong AI chat
- Address
- Cart
- Order
- Cac outfit khac cua owner

Viewer chi co VIEW permission.

## Feature Design

### Account

`/account` la account hub gom:

- Profile summary: name, email, phone, avatar initials/avatar image.
- Editable profile form: full name, phone, avatar URL/initials.
- Body info form: height cm va weight kg.
- Address summary: default address, count, link den address management.
- Quick links: orders, notifications, wardrobe, shared-with-me.

Validation:

- Name required.
- Phone optional but if present must look like phone text.
- Height/weight optional, positive numbers in reasonable range.

Height/weight updates should affect future AI recommendation only, khong tu sua outfit cu.

### Address management

`/account/addresses` supports:

- List addresses of current user.
- Add address.
- Edit address.
- Delete address.
- Set default address.

Use inline form or modal based on existing UI pattern, but avoid browser alert/confirm. Deleting default address should either pick another address as default or leave no default with clear UI; checkout must ask user to select/add address if none exists.

Checkout address section should link to address management and use latest addresses. Order creation must snapshot selected address.

### Orders

`/orders`:

- List current user's orders.
- Filter by status group: all, pending/payment, processing, shipped/completed, cancelled/returns.
- Show order id, date, status, payment method/status, item thumbnails, total.

`/orders/:orderId`:

- Show timeline/status.
- Show product items with image, product name, variant color/size, quantity, unit price at purchase, line total.
- Show shipping address snapshot.
- Show payment and totals.
- Actions:
  - Request cancellation when status allows: pending, payment_pending, paid, confirmed.
  - Request return when status allows: shipped, completed.

Cancellation/return requests are customer-submitted records. Customer can see request status. Admin review remains for later.

### Notifications

`/notifications`:

- List current user's notifications.
- Show unread state.
- Mark one read.
- Mark all read.
- Follow notification link if present.

Header unread count uses same source. Share, order and wardrobe actions should create local notifications where it helps the customer flow.

### My Wardrobe

`/wardrobes`:

- Page title "My Wardrobe" / "Tu do cua toi" in Vietnamese UI.
- Outfit cards like folders/cards, not a plain table.
- Filters: all, AI, manual, public/shared.
- Empty state with actions: create with AI, create manually.
- Each outfit card shows collage from outfit item images, name, item count, total price, source, updated date, share/public badges.

Actions:

- Create outfit manually.
- Create with AI.
- Open outfit detail.
- Optional card-level share indicator only; editing happens in detail.

### Create outfit manually

`/wardrobes/new`:

- Two-pane responsive builder.
- Catalog search/filter left side reuses catalog product data.
- Outfit draft right side shows selected items.
- User selects product, color, size active variant, then adds to draft.
- User can remove item, change variant, change quantity not needed because outfit item is a clothing item reference, not cart line.
- User names outfit and saves.

Save creates outfit with `source: 'manual'` and navigates to `/outfits/:outfitId`.

### AI stylist create

`/wardrobes/new/ai`:

- Chat panel + recommendation panel.
- Assistant starts conversation.
- User can enter natural text. Mock AI extracts simple requirement signals from text or uses quick chips.
- If height/weight missing, assistant asks for it and UI provides small body info capture.
- Mock AI searches active products/variants by category/style/occasion/color/budget from store.
- Recommendation panel shows outfit item cards, total price, short explanation, suggested sizes.
- User can:
  - accept recommendation
  - regenerate outfit
  - request replacing one item
  - provide feedback text

Only after accept does UI ask for outfit name. Save creates outfit with `source: 'ai'`.

The mock AI must not create product names, prices, images, colors or sizes not in store.

### Outfit detail

`/outfits/:outfitId`:

- Owner view shows title, source, last updated, total price, share/public status.
- Item grid/list shows real product image, name, brand, color, size, price and link to product detail.
- Owner actions:
  - Rename outfit.
  - Add product manually.
  - Remove product.
  - Change variant color/size if active.
  - Ask AI.
  - Add item to cart.
  - Buy item now.
  - Add entire outfit to cart.
  - Share.
  - Delete outfit.

Ask AI opens an edit-mode AI panel that loads current outfit context, including user-added manual products. AI proposed changes are previewed and only applied after owner confirms.

### Purchase from outfit

For an outfit item:

- View product detail.
- Add to cart.
- Buy now.

For entire outfit:

- Add all valid active product/variant items to cart.
- Skip inactive items with inline message naming skipped items.

Cart line source can include `source: 'outfit'` plus optional `outfitId` if model update is worth it. If current cart type is narrow, use existing source in first pass and preserve item correctness.

### Sharing

Share panel in outfit detail:

- Share by email with VIEW permission.
- Show people with access.
- Revoke access.
- Enable public link.
- Disable public link.
- Copy/display public link.

`/shared-with-me`:

- Lists active outfit shares for current user's email.
- Opening shared outfit uses viewer mode.

`/shared/outfits/:token`:

- Public viewer route.
- Shows only one outfit associated with token.
- Allows product detail and add item to viewer cart if viewer chooses to shop.
- Does not expose owner private data.

Viewer mode disables edit, AI, rename, delete, share management and access management.

## UI Direction

StyleMind should feel like a polished womenswear commerce app with an intelligent wardrobe workspace, not a generic SaaS dashboard.

Guidelines:

- Keep palette refined and not one-note. Current plum accent can remain, balanced with warm neutrals, muted green success, amber notice and restrained red danger.
- Use product images and outfit collages as primary visual assets.
- Avoid large marketing-only hero sections inside functional pages.
- Keep operational pages scannable: clear section headers, compact controls, predictable navigation.
- Use cards only for repeated items, modals and framed tools. Avoid cards inside cards.
- Buttons and tool actions should use icons when helpful.
- All visible copy in Vietnamese, no "demo", no "dang hoan thien" customer copy.
- Responsive layouts must avoid horizontal overflow at 390px width.

## State and Data Flow

The customer phase continues using the local `DemoStoreProvider` pattern:

- Seed data provides users, products, categories, addresses, orders, notifications, outfits, shares, AI conversations and requests.
- Reducer actions mutate local state for customer interactions.
- Feature-specific selectors and repositories keep large UI pages from owning business rules.
- UI routes use `AuthGuard` where the route needs a signed-in customer.
- Public shared outfit route does not require auth.

Suggested boundaries:

- `src/features/account`
- `src/features/orders`
- `src/features/notifications`
- `src/features/wardrobe`
- `src/features/outfit-builder`
- `src/features/ai-stylist`
- `src/features/sharing`

Existing `src/features/wardrobe` can absorb outfit detail/builder if that keeps the implementation simpler. The implementation plan should choose the smallest clear split.

## Error, Empty and Loading States

Every new customer page needs:

- Empty state with useful next action.
- Inline form validation.
- Not-found or no-access state where applicable.
- Pending/loading states for async mock operations.
- No `window.alert` or `window.confirm`.

Access states:

- Owner sees full outfit controls.
- Viewer sees read-only controls plus shopping actions.
- Unknown private outfit shows a no-access/not-found page.
- Invalid public token shows a public not-found state.

## Testing Strategy

Add focused tests in the existing Vitest/Testing Library style.

Core tests:

- Account profile/body info update persists in store.
- Address add/edit/delete/default flows work.
- Checkout uses selected address snapshot.
- Orders list and detail render placed orders.
- Cancellation and return request can be submitted from eligible statuses.
- Notifications mark one/all read and header count updates.
- Manual outfit builder saves an outfit from real product variants.
- AI stylist creates recommendation only from seeded products and saves after confirm.
- AI edit from existing outfit includes manual items before proposing changes.
- Outfit detail can add item and entire outfit to cart.
- Share by email creates outfit-level access only.
- Public link opens exactly one outfit and hides private data.
- Shared-with-me lists only outfits shared to current user's email.
- Catalog/cart/product purchase logic no longer depends on stock.

Keep existing smoke flow and extend or add a second customer smoke test:

login -> update profile/body info -> create manual outfit -> add outfit to cart -> checkout -> view order.

## Acceptance Criteria

Customer phase is complete when:

- No customer route renders placeholder/deferred copy.
- Customer can manage profile, body info and addresses.
- Customer can browse catalog, cart, checkout and then view order history/detail.
- Customer can view and mark notifications.
- Customer can create manual outfit, create AI outfit, edit outfit and ask AI from existing outfit.
- Customer can add outfit items or entire outfit to cart.
- Customer can share one outfit by email and public link.
- Shared/public viewers only see the intended outfit and no private owner data.
- UI visible text is Vietnamese and product/customer copy no longer says demo.
- Customer UI respects the no-inventory scope.
- `npm test`, `npm run typecheck` and `npm run build` pass.

## Implementation Phasing

Recommended task order:

1. Data model and reducer foundation for customer entities.
2. Customer shell route cleanup and no-inventory commerce correction.
3. Account and address management.
4. Orders and notifications.
5. Wardrobe list and outfit detail foundation.
6. Manual outfit builder.
7. AI stylist create flow.
8. AI edit existing outfit flow.
9. Sharing, public outfit and shared-with-me.
10. Customer smoke tests, responsive pass and copy cleanup.

Admin phase starts only after this customer phase is verified.

## Self-Review

- No placeholders remain in this spec.
- Scope is customer-only; admin is explicitly out of scope.
- The design preserves the approved customer-first direction.
- The no-inventory business rule is called out as a correction.
- Shared/public privacy behavior is explicit.
- The spec is broad enough for the customer phase and narrow enough to leave admin for a later spec/plan.
