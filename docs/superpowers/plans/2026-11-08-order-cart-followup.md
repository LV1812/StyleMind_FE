# Order and cart follow-up implementation plan

**Goal:** Improve real account orders, cancellation, cart and product administration while preserving current APIs and business rules.

**Architecture:** Use the existing Identity-authenticated payment client for account order reads and writes. Reuse actual BE order history and cancellation results; never treat a request as cancellation. Cart selection and independent buy-now require a new Commerce contract and must not pretend that a whole-cart checkout is selective.

**Tech stack:** React, TypeScript, Vitest, Commerce and Identity APIs.

**Constraints:** Keep existing data and user changes; only implement the selected-checkout and buy-now BE scope requested by the user. No synthetic order/payment status. The user paused the inactive-product decision; existing BE behavior remains unchanged.

## Tasks

- [x] Add real account order list, pagination, status filter and error states; test authenticated requests and page behavior.
- [x] Show order detail, backend history and cancellation request status; add authenticated cancellation with idempotent UI and tests.
- [x] Clarify payment recovery and preserve existing payment behavior and tests.
- [ ] Verify cart availability and guest merge, including failed merge and existing cart preservation. Automated FE tests pass; real backend end-to-end still required.
- [x] Add real file upload for admin product variants, preserve saved-product state if upload fails, and test.
- [x] Document BE contract changes needed for displaying inactive products, selected checkout and independent buy-now; never perform unsupported mutations.
- [ ] Complete selected-checkout/buy-now BE and FE verification, including recovery, owner isolation and concurrent requests. The inactive-product business rule remains paused for user discussion.
- [ ] The full FE suite run reported failures including legacy demo/admin tests; 62 focused tests and typecheck pass. Record runtime verification after BE integration.
