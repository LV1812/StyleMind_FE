# Commerce API integration

The frontend uses the typed client in `src/api/commerce.ts` for every browser-facing
`commerce-service` endpoint under `/api/v1/**`:

- categories and brands (public reads and Admin CRUD);
- products, variants, batch lookup, image upload/reorder/delete and legacy image content;
- branches (authenticated reads and Admin CRUD);
- guest/authenticated cart and cart merge;
- checkout, customer orders, cancellation requests, payment-attempt recovery;
- Admin order reads, status updates and cancellation reviews.

`/internal/**` endpoints are intentionally excluded. They require service credentials and
are only for Payment/Commerce service-to-service traffic; exposing them in browser code would
violate the backend security boundary.

## Local configuration

All Commerce requests go through the API Gateway route `/commerce/**`. The Gateway strips the
`/commerce` prefix and forwards the remaining `/api/v1/**` path to `commerce-service`.

By default Vite proxies both `/api/**` and `/commerce/**` to the local Gateway at
`http://localhost:8080` while preserving each path. Override the shared Gateway target in
`.env.local` when needed:

```dotenv
VITE_API_PROXY_TARGET=http://localhost:8080
```

For a deployed frontend, set the shared public Gateway origin (without `/commerce`):

```dotenv
VITE_API_BASE_URL=https://api.example.com
```

The HTTP client reuses the active Identity session from `stylemind.identity.session`, so
authenticated Commerce calls receive the same Bearer token. Tests or non-Identity hosts can
also inject a token with `setCommerceAccessToken()` from `src/api/http.ts`.

Anonymous carts use a cryptographically random `guest_session_key` stored under
`stylemind_commerce_guest_session_key`. `CommerceProvider` automatically merges that cart after
Identity authentication succeeds, then discards the guest key.

Checkout requires a saved Identity address UUID because Commerce validates ownership through
Identity. Checkout loads the user's saved addresses from Identity, displays their labels and
address text, and sends the selected `address_id` to Commerce without exposing a UUID input.

The routed feature pages use Commerce as their source of truth: catalog and product detail,
guest/authenticated cart, checkout and VietQR recovery, customer orders and cancellations, plus
Admin catalog/order reads and mutations. `demoSeed.ts` remains only for non-Commerce demo domains
and test fixtures.
