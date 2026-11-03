> Historical report. Current implementation and limitations: [PAYMENT_FE_IMPLEMENTATION.md](./PAYMENT_FE_IMPLEMENTATION.md).

# Guest checkout

> Initial implementation report. The local-cart and unknown-pricing limitations below are superseded by [GUEST_CART_INTEGRATION.md](GUEST_CART_INTEGRATION.md), which records the real catalog/cart integration and approved BE header support.

## Behavior

- `/checkout` waits for Identity initialization, then renders the existing account checkout or the guest form.
- Cart and guest checkout share `guest_session_key`, reusing localStorage or an existing sessionStorage value. New keys use `crypto.randomUUID()` and localStorage. Keys are retained after ordering and never sent in URLs or logged.
- Guest requests use the configured `VITE_API_GATEWAY_URL`, falling back to `VITE_API_BASE_URL` or the same-origin proxy. Only `X-Guest-Session-Key` authenticates these requests; Identity tokens and refresh behavior are untouched.
- A localStorage checkout draft retains form data, one checkout UUID, and the exact submitted body. Network/timeout/409 retries retain that body. A 400 permits correcting the input with the same UUID. An in-flight guard blocks repeated submissions.
- Accepted orders store `order_id` and clear the local cart. `/guest/orders/:orderId` always uses guest APIs, including after login. The cart links to the latest guest order.
- The result page restores SePay payment with a bodyless POST, displays `qrPayload` as an image, and never confirms payment locally. COD pending orders expose payment recovery on the same order.
- GET-only polling is serialized at five-second intervals while `PENDING_PAYMENT`; it stops on another status, errors, navigation, or unmount. Payment recovery is manual after failure. Requests time out after 20 seconds.
- The result page does not generate a replacement guest session. Missing keys and guest HTTP 401 do not trigger login.

## Files changed for this task

Added:

- `src/features/cart/model/guestSession.ts`: shared guest session storage.
- `src/features/checkout/data/guestCheckoutApi.ts`: four Gateway guest endpoints, timeout, and guest errors.
- `src/features/checkout/model/guestCheckout.ts`: durable checkout draft and trimmed validation.
- `src/features/checkout/pages/GuestCheckoutPage.tsx`: guest shipping/payment form and submission.
- `src/features/checkout/pages/GuestOrderPage.tsx`: result, recovery, QR, and order polling.
- `src/features/checkout/GuestCheckout.test.tsx`: 15 guest tests.

Updated:

- `src/app/router/AppRouter.tsx`, `src/app/router/routes.ts`: public checkout and dedicated guest result route; existing account order routes remain guarded.
- `src/app/store/types.ts`, `src/app/store/demoReducer.ts`: clear the local cart after guest order acceptance without inserting guest orders into account orders.
- `src/features/cart/pages/CartPage.tsx`: initialize/reuse the cart guest key and link to the latest guest order.
- `src/features/product-detail/pages/ProductDetailPage.tsx`: initialize the same guest key when adding a product.
- `src/features/checkout/pages/CheckoutPage.tsx`: select guest versus existing account checkout.
- `src/features/auth/AuthFlow.test.tsx`: locked-account guard regression uses `/account`, since checkout now allows guests.

Existing uncommitted payment, Admin, header, environment typing, and Vite changes were preserved.

## Verification

70 tests pass across these 11 files:

- `GuestCheckout.test.tsx` (15): session reuse, validation boundaries, COD, exact request body/header, no guest Identity address calls, repeated clicks, network failure and remount, 400/401/404/409, SePay QR, result refresh after login, COD pending recovery, missing session, timeout, polling limits and cleanup.
- `CheckoutFlow.test.tsx`, `CartPage.test.tsx`, `ProductDetailPage.test.tsx`.
- `paymentApi.test.ts`, `identityApi.test.ts`.
- `AuthFlow.test.tsx`, `PaymentRoutes.test.tsx`, `PaymentPages.test.tsx`.
- `CustomerCommerce.smoke.test.tsx`, `CustomerCompleteFlow.smoke.test.tsx`.

`npm.cmd run typecheck`, `npm.cmd run build`, and `git diff --check` pass. Build reports a bundle-size warning above 500 kB.

A full-suite run was attempted and stopped after failures, including 16 Admin tests. A separate Admin test run reproduces `filters products and toggles a product inactive` failing because it cannot find `prd-blouse-01`. No Admin implementation or Admin tests were changed for this task. The full suite is not green or fully verified.

## Integration still needed

The repository currently stores catalog/cart lines in the local demo database. There is no existing Commerce cart client or guest key implementation to reuse, and no guest cart API contract was supplied. The changes establish one shared key but cannot send existing local cart lines to the backend without that contract. End-to-end checkout requires a server cart populated under the same key. Local cart clearing reflects an accepted order; there is no cart-fetch contract available for a server refresh.

The response schema of `GET /commerce/api/v1/guest/checkout/prices` was not supplied. The current optional display adapter expects `items: [{ variant_id, unit_price_vnd }]` and `total_vnd`; these field names need confirmation. It does not substitute demo totals when absent. Accepted totals on the result come from the order response.

Tests use mocked Gateway responses. Real COD, SePay callbacks, pricing, and cart consistency must still be checked against the running Gateway/backend. No backend or catalog access permissions were changed.
