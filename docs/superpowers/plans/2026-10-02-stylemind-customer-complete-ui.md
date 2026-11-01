# StyleMind Customer Complete UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete customer-facing StyleMind UI before the admin phase.

**Architecture:** Extend the existing feature-structured React app and local `DemoStoreProvider` rather than introducing a new state stack. Add customer domain entities for profile/body info, outfits, AI conversations, outfit shares, requests and notifications; then replace customer placeholders route-by-route with tested feature pages. Keep backend-like behavior behind selectors/repository functions so a later API integration can replace local store logic without rewriting screens.

**Tech Stack:** React, TypeScript, React Router, Vite, Vitest, Testing Library, Tailwind-style utility classes, localStorage/sessionStorage demo persistence.

**Spec:** `docs/superpowers/specs/2026-10-02-stylemind-customer-complete-ui-design.md`

## Global Constraints

- Customer phase only; admin screens stay out of scope except existing admin access.
- Visible UI copy is Vietnamese; code identifiers stay English.
- No customer route may render placeholder/deferred/demo copy after this plan.
- No inventory/warehouse behavior in customer UI; purchasing checks only product active and variant active.
- AI stylist is rule-based local mock AI and may only recommend real seeded active products/variants.
- Shared/public outfit views must hide height, weight, AI chat history, address, cart, order and other owner outfits.
- Do not use `window.alert` or `window.confirm`; use inline states or existing modal/toast UI.
- Run and pass `npm test`, `npm run typecheck`, and `npm run build` before declaring the customer phase complete.
- Do not push.

## Review Focus

- **Inactive product or variant:** cart/outfit/AI flows must refuse inactive items without relying on stock. Covered in Task 1 and Task 10.
- **Missing or changed address:** checkout must require a current address and order detail must keep the original address snapshot. Covered in Task 3 and Task 4.
- **AI recommendation integrity:** AI must not save recommendations before confirmation or invent product/variant data. Covered in Task 7 and Task 8.
- **Outfit access isolation:** viewer/public routes must expose exactly one outfit and no owner-private data. Covered in Task 9.
- **Mobile overflow on dense customer pages:** 390px routes must not horizontally scroll or hide primary actions. Covered in Task 10.

---

## File Structure

Create these new feature areas:

- `src/features/account` for account hub and address management.
- `src/features/orders` for order list/detail and customer requests.
- `src/features/notifications` for notification list/read actions.
- `src/features/wardrobe` for My Wardrobe, outfit detail and outfit selectors.
- `src/features/outfit-builder` for manual outfit creation.
- `src/features/ai-stylist` for create/edit AI stylist screens and local recommendation engine.
- `src/features/sharing` for share panel, shared-with-me and public outfit viewer.

Create these new entity models:

- `src/entities/outfit/model/types.ts`
- `src/entities/ai/model/types.ts`
- `src/entities/share/model/types.ts`

Modify the existing store:

- `src/app/store/types.ts`
- `src/app/store/demoReducer.ts`
- `src/app/data/demoSeed.ts`
- `src/shared/storage/demoStorage.ts` only if schema migration needs a version bump.

---

### Task 1: Customer Domain Foundation and No-Inventory Commerce

**Files:**
- Create: `src/entities/outfit/model/types.ts`
- Create: `src/entities/ai/model/types.ts`
- Create: `src/entities/share/model/types.ts`
- Create: `src/features/wardrobe/model/outfitSelectors.ts`
- Create: `src/features/ai-stylist/model/recommendOutfit.ts`
- Create: `src/features/customer-domain/CustomerDomain.test.ts`
- Modify: `src/entities/user/model/types.ts`
- Modify: `src/entities/cart/model/types.ts`
- Modify: `src/app/store/types.ts`
- Modify: `src/app/store/demoReducer.ts`
- Modify: `src/app/data/demoSeed.ts`
- Modify: `src/features/cart/model/cartSelectors.ts`
- Modify: `src/features/product-detail/model/productSelection.ts`
- Modify: `src/app/store/demoReducer.test.ts`
- Modify: `src/features/cart/model/cartSelectors.test.ts`
- Modify: `src/features/product-detail/model/productSelection.test.ts`

**Interfaces:**
- Produces:
  - `Outfit`, `OutfitItem`, `OutfitSource`, `OutfitVisibility`.
  - `AiConversation`, `AiMessage`, `OutfitRequirement`, `OutfitRecommendation`.
  - `OutfitShare`.
  - `selectOwnedOutfits(database: DemoDatabase, userId: string): Outfit[]`.
  - `selectOutfitDetail(database: DemoDatabase, outfitId: string): OutfitDetail | null`.
  - `recommendOutfit(database: DemoDatabase, input: RecommendOutfitInput): OutfitRecommendation`.
  - Reducer actions listed below.
- Consumes:
  - Existing `DemoDatabase`, products, variants, users, addresses, orders, notifications.

- [ ] **Step 1: Write failing customer domain tests**

Add `src/features/customer-domain/CustomerDomain.test.ts` with tests:

```ts
it('stores customer body info without persistent style preferences')
it('keeps outfit items linked to real product variants')
it('recommends only active products and active variants from the catalog')
it('allows cart quantities without capping them by stock')
it('does not expose stock-based purchase errors in product selection')
```

The tests must assert exact state fields: `heightCm`, `weightKg`, no `stylePreference`, outfit item `productId`/`variantId`, and cart quantity `999` remaining `999` when product and variant are active.

- [ ] **Step 2: Run tests to verify RED**

Run: `cmd /c npm test -- CustomerDomain cartSelectors productSelection demoReducer`

Expected: FAIL because outfit/AI/share types, actions and no-inventory behavior do not exist yet.

- [ ] **Step 3: Add entity models**

Implement:

- `OutfitSource = 'manual' | 'ai'`
- `OutfitVisibility = 'private' | 'public'`
- `OutfitItem = { id: string; productId: string; variantId: string; addedBy: 'owner' | 'ai'; note?: string }`
- `Outfit = { id: string; ownerId: string; name: string; description?: string; source: OutfitSource; items: OutfitItem[]; visibility: OutfitVisibility; publicToken?: string; createdAt: string; updatedAt: string }`
- `OutfitRequirement` with optional `occasion`, `style`, `preferredColors`, `excludedColors`, `budget`, `desiredCategories`, `fit`, `additionalNotes`.
- `AiConversation` and `OutfitRecommendation` per spec.
- `OutfitShare = { id: string; outfitId: string; ownerId: string; viewerEmail: string; permission: 'view'; active: boolean; createdAt: string }`

- [ ] **Step 4: Extend `DemoDatabase` and `DemoAction`**

Add arrays `outfits`, `outfitShares`, `aiConversations` to `DemoDatabase`. Add actions:

- `user/profileUpdated`
- `address/deleted`
- `outfit/created`
- `outfit/updated`
- `outfit/deleted`
- `outfit/itemAdded`
- `outfit/itemUpdated`
- `outfit/itemRemoved`
- `outfit/publicToggled`
- `share/granted`
- `share/revoked`
- `notification/read`
- `notification/readAll`
- `cancellation/submitted`
- `return/submitted`
- `ai/conversationUpserted`

- [ ] **Step 5: Seed realistic customer data**

Update `createDemoSeed()` with:

- Customer `heightCm: 160`, `weightKg: 52`.
- 2-3 outfits for `usr-customer-01`, including one AI outfit and one manual outfit.
- One inactive share and one active share for future shared-with-me tests.
- Notifications with categories `system`, `order`, `share`, `wardrobe`.
- No accessories products.

- [ ] **Step 6: Remove stock as purchase behavior**

Update selectors and selection logic so active product + active variant is sufficient. Keep `stock` property if removing it is too invasive, but stop using it to cap quantity, hide variants, or emit "out of stock" errors.

- [ ] **Step 7: Run GREEN verification**

Run: `cmd /c npm test -- CustomerDomain cartSelectors productSelection demoReducer`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/entities src/features/customer-domain src/features/wardrobe/model src/features/ai-stylist/model src/app src/features/cart/model src/features/product-detail/model
git commit -m "feat: add customer domain foundation"
```

---

### Task 2: Customer Routing Shell and Navigation

**Files:**
- Create: `src/features/account/index.ts`
- Create: `src/features/account/pages/AccountPage.tsx`
- Create: `src/features/account/pages/AddressBookPage.tsx`
- Create: `src/features/orders/index.ts`
- Create: `src/features/orders/pages/OrdersPage.tsx`
- Create: `src/features/orders/pages/OrderDetailPage.tsx`
- Create: `src/features/notifications/index.ts`
- Create: `src/features/notifications/pages/NotificationsPage.tsx`
- Create: `src/features/sharing/index.ts`
- Create: `src/features/sharing/pages/SharedWithMePage.tsx`
- Create: `src/features/sharing/pages/PublicOutfitPage.tsx`
- Create: `src/app/router/CustomerRoutes.test.tsx`
- Modify: `src/app/router/routes.ts`
- Modify: `src/app/router/AppRouter.tsx`
- Modify: `src/app/layouts/components/CustomerHeader.tsx`
- Modify: `src/app/layouts/components/MobileNavigation.tsx`
- Modify: `src/app/layouts/CustomerLayout.test.tsx`

**Interfaces:**
- Consumes:
  - Store additions from Task 1.
- Produces:
  - Route constants: `addresses`, `orderDetail`, `outfitDetail`, `outfitNew`, `outfitNewAi`, `sharedWithMe`, `publicOutfit`.
  - Page components exported from feature index files.

- [ ] **Step 1: Write failing route tests**

Add `CustomerRoutes.test.tsx` with tests:

```ts
it('routes every customer surface to a non-placeholder page')
it('keeps public outfit route accessible without auth')
it('shows customer navigation to wardrobe, orders, notifications, account and cart')
```

Assert the text does not include `đang được hoàn thiện`, `demo`, or "placeholder" on customer routes.

- [ ] **Step 2: Run tests to verify RED**

Run: `cmd /c npm test -- CustomerRoutes CustomerLayout`

Expected: FAIL because routes/pages are missing or placeholder pages still render.

- [ ] **Step 3: Add route constants**

Extend `ROUTES` with:

- `addresses: '/account/addresses'`
- `orderDetail: '/orders/:orderId'`
- `outfitDetail: '/outfits/:outfitId'`
- `outfitNew: '/wardrobes/new'`
- `outfitNewAi: '/wardrobes/new/ai'`
- `sharedWithMe: '/shared-with-me'`
- `publicOutfit: '/shared/outfits/:token'`

- [ ] **Step 4: Replace `PlaceholderPage` usage**

Remove customer placeholder usage from `AppRouter.tsx`. Wire authenticated routes for account, addresses, orders, order detail, notifications, wardrobes, outfit builder, AI create, outfit detail and shared-with-me. Wire public outfit route outside `AuthGuard`.

- [ ] **Step 5: Add minimal real page shells**

Create page components with real Vietnamese headings and data-backed empty states. These shells may be simple in this task but must not say demo/deferred/placeholder.

- [ ] **Step 6: Update navigation**

Customer header must expose shop, wardrobe, orders, notifications, account and cart. Mobile navigation must expose shop, wardrobe, cart and account at minimum. Unread notification count still comes from store.

- [ ] **Step 7: Run GREEN verification**

Run: `cmd /c npm test -- CustomerRoutes CustomerLayout`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/router src/app/layouts src/features/account src/features/orders src/features/notifications src/features/sharing
git commit -m "feat: wire complete customer routes"
```

---

### Task 3: Account and Address Management

**Files:**
- Create: `src/features/account/AccountFlow.test.tsx`
- Create: `src/features/account/components/ProfileForm.tsx`
- Create: `src/features/account/components/BodyInfoForm.tsx`
- Create: `src/features/account/components/AddressForm.tsx`
- Create: `src/features/account/components/AddressCard.tsx`
- Create: `src/features/account/model/validators.ts`
- Modify: `src/features/account/pages/AccountPage.tsx`
- Modify: `src/features/account/pages/AddressBookPage.tsx`
- Modify: `src/app/store/demoReducer.ts`
- Modify: `src/features/checkout/components/AddressSection.tsx`
- Modify: `src/features/checkout/pages/CheckoutPage.tsx`
- Modify: `src/features/checkout/CheckoutFlow.test.tsx`

**Interfaces:**
- Consumes:
  - `user/profileUpdated`, `address/upserted`, `address/deleted`, `address/defaultChanged`.
- Produces:
  - `validateProfileInput(input: ProfileInput): FieldErrors`.
  - `validateAddressInput(input: AddressInput): FieldErrors`.
  - Address management UI used by checkout links.

- [ ] **Step 1: Write failing account/address tests**

Add `AccountFlow.test.tsx` with tests:

```ts
it('updates profile and body info without storing style preferences')
it('adds edits deletes and sets a default address')
it('does not allow deleting the last address without showing a checkout-safe empty state')
```

Extend `CheckoutFlow.test.tsx`:

```ts
it('stores the selected shipping address snapshot on the order')
```

- [ ] **Step 2: Run tests to verify RED**

Run: `cmd /c npm test -- AccountFlow CheckoutFlow`

Expected: FAIL because forms and address deletion/snapshot assertions are not implemented.

- [ ] **Step 3: Implement account profile UI**

`AccountPage` renders profile summary, editable profile form, body info form and links to addresses, orders, notifications, wardrobe and shared-with-me.

- [ ] **Step 4: Implement address book UI**

`AddressBookPage` renders address cards, add/edit form, delete modal, and set-default action. Use reducer actions only; no alert/confirm.

- [ ] **Step 5: Update checkout address section**

Address section links to `/account/addresses`, handles no-address state with a visible message, and keeps selected address snapshots when placing orders.

- [ ] **Step 6: Run GREEN verification**

Run: `cmd /c npm test -- AccountFlow CheckoutFlow`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/account src/features/checkout src/app/store src/entities/user
git commit -m "feat: add customer account and address management"
```

---

### Task 4: Orders and Notifications

**Files:**
- Create: `src/features/orders/OrdersFlow.test.tsx`
- Create: `src/features/orders/components/OrderCard.tsx`
- Create: `src/features/orders/components/OrderTimeline.tsx`
- Create: `src/features/orders/components/CancellationRequestForm.tsx`
- Create: `src/features/orders/components/ReturnRequestForm.tsx`
- Create: `src/features/orders/model/orderSelectors.ts`
- Create: `src/features/notifications/NotificationsFlow.test.tsx`
- Create: `src/features/notifications/components/NotificationCard.tsx`
- Create: `src/features/notifications/model/notificationSelectors.ts`
- Modify: `src/features/orders/pages/OrdersPage.tsx`
- Modify: `src/features/orders/pages/OrderDetailPage.tsx`
- Modify: `src/features/notifications/pages/NotificationsPage.tsx`
- Modify: `src/app/store/demoReducer.ts`
- Modify: `src/app/layouts/components/CustomerHeader.tsx`
- Modify: `src/features/checkout/pages/OrderSuccessPage.tsx`

**Interfaces:**
- Consumes:
  - Orders, cancellation requests, return requests and notifications from store.
- Produces:
  - `selectOrdersForUser(database, userId): Order[]`.
  - `selectOrderDetail(database, userId, orderId): OrderDetail | null`.
  - `selectNotificationsForUser(database, userId): Notification[]`.
  - `selectUnreadNotificationCount(database, userId): number`.

- [ ] **Step 1: Write failing tests**

`OrdersFlow.test.tsx`:

```ts
it('lists current customer orders and opens an order detail')
it('submits a cancellation request with a reason for an eligible order')
it('submits a return request for selected order items')
it('keeps address snapshot unchanged after the address book changes')
```

`NotificationsFlow.test.tsx`:

```ts
it('marks one notification as read and updates the header unread count')
it('marks all notifications as read')
it('follows a notification link to its destination')
```

- [ ] **Step 2: Run tests to verify RED**

Run: `cmd /c npm test -- OrdersFlow NotificationsFlow`

Expected: FAIL because order/notification pages are shells.

- [ ] **Step 3: Implement orders list and detail**

Orders list shows filters by status group. Detail shows timeline, items, address snapshot, payment, totals, and request forms when eligible.

- [ ] **Step 4: Implement notification list**

Notifications page shows read/unread state, mark one read, mark all read, and link navigation. Header count uses `selectUnreadNotificationCount`.

- [ ] **Step 5: Run GREEN verification**

Run: `cmd /c npm test -- OrdersFlow NotificationsFlow`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/orders src/features/notifications src/app/store src/app/layouts src/features/checkout
git commit -m "feat: add customer orders and notifications"
```

---

### Task 5: Wardrobe List and Outfit Detail Foundation

**Files:**
- Create: `src/features/wardrobe/WardrobeFlow.test.tsx`
- Create: `src/features/wardrobe/components/OutfitCard.tsx`
- Create: `src/features/wardrobe/components/OutfitItemCard.tsx`
- Create: `src/features/wardrobe/components/OutfitShareSummary.tsx`
- Create: `src/features/wardrobe/pages/WardrobePage.tsx`
- Create: `src/features/wardrobe/pages/OutfitDetailPage.tsx`
- Modify: `src/features/wardrobe/index.ts`
- Modify: `src/app/router/AppRouter.tsx`
- Modify: `src/app/store/demoReducer.ts`
- Delete or stop routing to: `src/features/wardrobe/pages/DeferredWardrobePage.tsx`

**Interfaces:**
- Consumes:
  - Outfit selectors from Task 1.
  - Route constants from Task 2.
- Produces:
  - Owner outfit detail UI.
  - Reducer-backed outfit rename/delete/item update/remove actions.

- [ ] **Step 1: Write failing wardrobe tests**

`WardrobeFlow.test.tsx`:

```ts
it('lists the current customers outfits as wardrobe cards')
it('opens an owner outfit detail with product-linked items')
it('renames an outfit and removes an item')
it('changes an outfit item variant only to an active variant')
it('adds one item and the entire outfit to cart')
it('shows a no-access state for a private outfit owned by someone else')
```

- [ ] **Step 2: Run tests to verify RED**

Run: `cmd /c npm test -- WardrobeFlow`

Expected: FAIL because wardrobe pages are deferred or missing.

- [ ] **Step 3: Implement wardrobe list**

`WardrobePage` shows outfit cards, filters all/AI/manual/public/shared, empty state and create actions.

- [ ] **Step 4: Implement owner outfit detail**

`OutfitDetailPage` shows owner controls: rename, remove item, change variant, add item to cart, add entire outfit to cart, delete outfit. Product links go to product detail.

- [ ] **Step 5: Run GREEN verification**

Run: `cmd /c npm test -- WardrobeFlow`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/wardrobe src/app/router src/app/store
git commit -m "feat: add wardrobe list and outfit detail"
```

---

### Task 6: Manual Outfit Builder

**Files:**
- Create: `src/features/outfit-builder/ManualOutfitBuilder.test.tsx`
- Create: `src/features/outfit-builder/index.ts`
- Create: `src/features/outfit-builder/components/BuilderCatalogPanel.tsx`
- Create: `src/features/outfit-builder/components/BuilderDraftPanel.tsx`
- Create: `src/features/outfit-builder/pages/ManualOutfitBuilderPage.tsx`
- Create: `src/features/outfit-builder/model/draftOutfit.ts`
- Modify: `src/app/router/AppRouter.tsx`
- Modify: `src/features/wardrobe/pages/OutfitDetailPage.tsx`

**Interfaces:**
- Consumes:
  - Products, variants and `outfit/created`.
- Produces:
  - `createManualOutfitDraft(ownerId: string): OutfitDraft`.
  - `draftToOutfit(draft: OutfitDraft, now: string): Outfit`.

- [ ] **Step 1: Write failing manual builder tests**

`ManualOutfitBuilder.test.tsx`:

```ts
it('searches products and adds active variants to an outfit draft')
it('removes and changes variants inside the draft')
it('requires an outfit name before saving')
it('saves a manual outfit and navigates to its detail page')
```

- [ ] **Step 2: Run tests to verify RED**

Run: `cmd /c npm test -- ManualOutfitBuilder`

Expected: FAIL because builder page does not exist.

- [ ] **Step 3: Implement draft model**

`OutfitDraft` stores `ownerId`, `name`, `items`, and draft validation. `draftToOutfit` returns `source: 'manual'`, `visibility: 'private'`.

- [ ] **Step 4: Implement builder page**

Two-pane layout with product search/filter and draft panel. Save dispatches `outfit/created` and navigates to detail.

- [ ] **Step 5: Run GREEN verification**

Run: `cmd /c npm test -- ManualOutfitBuilder`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/outfit-builder src/app/router src/features/wardrobe
git commit -m "feat: add manual outfit builder"
```

---

### Task 7: AI Stylist Create Flow

**Files:**
- Create: `src/features/ai-stylist/AiStylistCreate.test.tsx`
- Create: `src/features/ai-stylist/index.ts`
- Create: `src/features/ai-stylist/components/AiChatPanel.tsx`
- Create: `src/features/ai-stylist/components/AiRecommendationPanel.tsx`
- Create: `src/features/ai-stylist/components/BodyInfoCapture.tsx`
- Create: `src/features/ai-stylist/pages/AiStylistCreatePage.tsx`
- Create: `src/features/ai-stylist/model/aiConversation.ts`
- Modify: `src/features/ai-stylist/model/recommendOutfit.ts`
- Modify: `src/app/router/AppRouter.tsx`
- Modify: `src/app/store/demoReducer.ts`
- Modify: `src/features/wardrobe/pages/WardrobePage.tsx`

**Interfaces:**
- Consumes:
  - `recommendOutfit`, `ai/conversationUpserted`, `outfit/created`, `user/profileUpdated`.
- Produces:
  - `createInitialAiConversation(ownerId: string): AiConversation`.
  - `appendUserMessage(conversation: AiConversation, body: string, now: string): AiConversation`.
  - `createAssistantReply(database: DemoDatabase, conversation: AiConversation, now: string): AiConversation`.

- [ ] **Step 1: Write failing AI create tests**

`AiStylistCreate.test.tsx`:

```ts
it('starts with an assistant first message')
it('asks for height and weight when profile body info is missing')
it('generates recommendations from real active catalog variants only')
it('does not save a recommendation until the customer confirms and names it')
it('regenerates an outfit after customer feedback')
```

- [ ] **Step 2: Run tests to verify RED**

Run: `cmd /c npm test -- AiStylistCreate`

Expected: FAIL because AI create page and conversation model do not exist.

- [ ] **Step 3: Implement conversation model**

Conversation stores user/assistant messages, requirement context and optional recommendation. Requirement fields stay inside conversation/outfit context, not user profile.

- [ ] **Step 4: Implement recommendation engine**

`recommendOutfit` selects active products and active variants by occasion/style/color/category/budget, returns real item references and explanation text. It must not fabricate IDs or prices.

- [ ] **Step 5: Implement AI create UI**

Chat panel, quick requirement chips, body info capture, recommendation panel, regenerate, confirm, name and save.

- [ ] **Step 6: Run GREEN verification**

Run: `cmd /c npm test -- AiStylistCreate`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/ai-stylist src/app/router src/app/store src/features/wardrobe
git commit -m "feat: add AI stylist outfit creation"
```

---

### Task 8: AI Assistant for Existing Outfit

**Files:**
- Create: `src/features/ai-stylist/AiStylistEdit.test.tsx`
- Create: `src/features/ai-stylist/components/AiEditPanel.tsx`
- Create: `src/features/ai-stylist/model/editOutfitWithAi.ts`
- Modify: `src/features/wardrobe/pages/OutfitDetailPage.tsx`
- Modify: `src/features/ai-stylist/model/aiConversation.ts`
- Modify: `src/app/store/demoReducer.ts`

**Interfaces:**
- Consumes:
  - Existing outfit detail, AI conversation and recommendation engine.
- Produces:
  - `createEditConversation(database: DemoDatabase, ownerId: string, outfitId: string): AiConversation`.
  - `proposeOutfitChange(database: DemoDatabase, conversation: AiConversation): OutfitChangeProposal`.
  - `applyOutfitChange(outfit: Outfit, proposal: OutfitChangeProposal, now: string): Outfit`.

- [ ] **Step 1: Write failing AI edit tests**

`AiStylistEdit.test.tsx`:

```ts
it('loads current outfit context including manually added items')
it('proposes a complementary product without mutating the outfit')
it('replaces one product only after owner confirmation')
it('does not expose AI edit controls to a viewer')
```

- [ ] **Step 2: Run tests to verify RED**

Run: `cmd /c npm test -- AiStylistEdit`

Expected: FAIL because AI edit panel does not exist.

- [ ] **Step 3: Implement edit proposal model**

Model supports proposal types `add-item`, `replace-item`, and `regenerate`. Proposal contains real product/variant references and a short explanation.

- [ ] **Step 4: Wire Ask AI in outfit detail**

Owner can open AI panel, submit request, preview proposed changes and confirm. Confirm dispatches `outfit/updated`.

- [ ] **Step 5: Run GREEN verification**

Run: `cmd /c npm test -- AiStylistEdit`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/ai-stylist src/features/wardrobe src/app/store
git commit -m "feat: add AI outfit editing"
```

---

### Task 9: Outfit Sharing, Shared With Me and Public Outfit

**Files:**
- Create: `src/features/sharing/SharingFlow.test.tsx`
- Create: `src/features/sharing/components/SharePanel.tsx`
- Create: `src/features/sharing/components/PublicLinkControl.tsx`
- Create: `src/features/sharing/components/AccessList.tsx`
- Create: `src/features/sharing/model/shareSelectors.ts`
- Modify: `src/features/sharing/pages/SharedWithMePage.tsx`
- Modify: `src/features/sharing/pages/PublicOutfitPage.tsx`
- Modify: `src/features/wardrobe/pages/OutfitDetailPage.tsx`
- Modify: `src/app/store/demoReducer.ts`
- Modify: `src/app/router/AppRouter.tsx`

**Interfaces:**
- Consumes:
  - Outfit shares and public token fields.
- Produces:
  - `selectSharesForOutfit(database, outfitId): OutfitShare[]`.
  - `selectOutfitsSharedWithEmail(database, email): SharedOutfitDetail[]`.
  - `selectPublicOutfitByToken(database, token): PublicOutfitDetail | null`.
  - Viewer-mode outfit UI.

- [ ] **Step 1: Write failing sharing tests**

`SharingFlow.test.tsx`:

```ts
it('grants view access to one email for one outfit')
it('revokes access without affecting another outfit share')
it('enables and disables a public link for one outfit')
it('lists only outfits shared to the current customers email')
it('renders a public outfit without height weight address orders cart or AI chat history')
it('prevents viewers from editing sharing renaming deleting or asking AI')
```

- [ ] **Step 2: Run tests to verify RED**

Run: `cmd /c npm test -- SharingFlow`

Expected: FAIL because sharing panel/viewer pages are not implemented.

- [ ] **Step 3: Implement share selectors and reducer actions**

Grant/revoke share by outfit id + viewer email. Public link toggling sets `visibility` and `publicToken`.

- [ ] **Step 4: Implement share panel in owner outfit detail**

Panel supports email share, access list, revoke, enable/disable public link and copy/display link.

- [ ] **Step 5: Implement shared-with-me and public viewer pages**

Shared-with-me lists active shares for current user email. Public viewer uses token and renders read-only outfit plus shopping/product-detail actions only.

- [ ] **Step 6: Run GREEN verification**

Run: `cmd /c npm test -- SharingFlow`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/sharing src/features/wardrobe src/app/store src/app/router
git commit -m "feat: add outfit sharing"
```

---

### Task 10: Customer Smoke, Copy Cleanup and Responsive Verification

**Files:**
- Create: `src/app/CustomerCompleteFlow.smoke.test.tsx`
- Modify: `src/app/CustomerCommerce.smoke.test.tsx`
- Modify: `src/features/catalog/pages/ShopPage.tsx`
- Modify: `src/features/product-detail/pages/ProductDetailPage.tsx`
- Modify: `src/features/cart/pages/CartPage.tsx`
- Modify: `src/features/checkout/pages/CheckoutPage.tsx`
- Modify: `src/features/checkout/pages/QrPaymentPage.tsx`
- Modify: `src/features/checkout/pages/OrderSuccessPage.tsx`
- Modify: `src/app/layouts/components/CustomerHeader.tsx`
- Modify: `src/app/layouts/components/MobileNavigation.tsx`
- Modify: any customer page with remaining demo/deferred/stock copy.

**Interfaces:**
- Consumes:
  - All previous customer features.
- Produces:
  - End-to-end verified customer phase.

- [ ] **Step 1: Write failing complete smoke tests**

`CustomerCompleteFlow.smoke.test.tsx`:

```ts
it('updates body info creates a manual outfit adds it to cart checks out and views the order')
it('creates an AI outfit shares it publicly and opens the public viewer')
```

Extend existing commerce smoke to assert no visible stock language appears during product selection.

- [ ] **Step 2: Run tests to verify RED if cleanup is incomplete**

Run: `cmd /c npm test -- CustomerCompleteFlow CustomerCommerce`

Expected: FAIL until all routes and copy cleanup are wired.

- [ ] **Step 3: Remove customer demo/deferred/stock copy**

Search active customer code:

```bash
rg -n --glob '!src/screens/**' --glob '!src/imports/**' "demo|đang được hoàn thiện|dang hoan thien|placeholder|Còn|hết hàng|stock|tồn kho" src
```

Update visible customer copy so it reads as production UI. Keep technical tests or internal variable names only where not visible.

- [ ] **Step 4: Run full verification**

Run:

```bash
cmd /c npm test
cmd /c npm run typecheck
cmd /c npm run build
```

Expected: all exit 0.

- [ ] **Step 5: Browser responsive verification**

Start dev server if needed:

```bash
cmd /c npm run dev -- --host 127.0.0.1
```

Check 390px, 768px and 1440px for:

- `/account`
- `/account/addresses`
- `/orders`
- `/notifications`
- `/wardrobes`
- `/wardrobes/new`
- `/wardrobes/new/ai`
- `/outfits/<seeded-outfit-id>`
- `/shared-with-me`
- `/shared/outfits/<seeded-public-token>`

Use Edge/Chrome screenshots if Playwright is unavailable. Fix horizontal overflow and hidden primary actions.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "test: verify complete customer flow"
```

---

## Whole-Branch Final Verification

- [ ] Run `git status --short` and confirm no unintended files are staged or dirty.
- [ ] Run `cmd /c npm test`.
- [ ] Run `cmd /c npm run typecheck`.
- [ ] Run `cmd /c npm run build`.
- [ ] Search active customer code for forbidden copy:

```bash
rg -n --glob '!src/screens/**' --glob '!src/imports/**' "Travel Planner|Visual Studio|demo|đang được hoàn thiện|dang hoan thien|placeholder|hết hàng|tồn kho|stock" src
```

- [ ] Manually verify the primary customer routes in the browser.

## Self-Review

- Spec coverage: all spec sections map to Tasks 1-10; admin is intentionally out of scope.
- Step scan: every task has a concrete failing test, implementation target, verification command and commit step.
- Type consistency: outfit, AI, share and route names are introduced before use.
- Review Focus: each risk maps to a task test.
- Proportion: plan is shorter than implementation and avoids full component bodies.
