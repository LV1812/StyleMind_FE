> Historical report. Current implementation and limitations: [PAYMENT_FE_IMPLEMENTATION.md](./PAYMENT_FE_IMPLEMENTATION.md).

# Payment FE — feature/ep-01

## Cách dùng

Đăng nhập bằng Identity hiện có, chọn **Thanh toán** ở menu hoặc mở:

- `/payments`: nhập UUID của Order thật đã tạo ở backend.
- `/payments/{orderId}`: mở trực tiếp một Order thuộc người đang đăng nhập.
- `/admin/payments`: Admin ghi nhận thực thu COD và xem danh sách lỗi. Có link từ trang /admin.

Cart/catalog/checkout demo giữ nguyên và chưa cung cấp Order thật cho các trang mới. Không lấy mã ORD-* hoặc QR demo làm ID backend. Dùng fixture phát triển qua Postman/backend để tạo Order trong lúc chờ nối cart. Trang Payment không tạo Order hoặc thay đổi cart.

Khi nối cart sau này: tạo Order ở Commerce, lưu `order_id` rồi điều hướng tới `ROUTES.paymentOrder.replace(':orderId', order.order_id)`. Không điều hướng sang QR demo hoặc tự xác nhận paid trong store.

## Đã nối

- Singleton `paymentApi` dùng `readIdentitySession()` để đọc access token hiện tại ở mỗi lần gọi; dùng chung phiên đăng nhập, không tạo token store riêng.
- URL dùng `VITE_API_GATEWAY_URL`, fallback `VITE_API_BASE_URL`, mặc định cùng origin.
- Vite proxy /api, /commerce và /payment tới `VITE_API_PROXY_TARGET` (mặc định http://localhost:8080). Production cần reverse proxy tương ứng hoặc Gateway CORS nếu khác origin.
- Không tự retry POST; 401 báo đăng nhập lại, không tự gửi lại yêu cầu tài chính. Identity tiếp tục quản lý refresh phiên của nó.
- Customer: GET Order trước, chỉ recovery khi trạng thái còn được phép; hiển thị QR ảnh từ backend, amount/reference/expiry; GET trạng thái mỗi 5 giây tuần tự khi SePay còn pending, hoặc bấm kiểm tra. Hủy polling khi rời trang.
- Đã PAID thì không gọi recovery. QR hết hạn bị ẩn, vẫn kiểm tra Order nếu người dùng đã chuyển khoản. Không tự tạo QR mới, không tự đặt PAID, không ghi Order backend vào demo store.
- COD PLACED không được xem là đã thu tiền. Chỉ hiển thị đã thu nếu backend attempt trả PAID.
- Admin: strict UUID, số tiền nguyên dương, xác nhận đã nhận tiền, reference tùy chọn. Chặn submit lặp khi đang xử lý, sau thành công hoặc sau kết quả không xác định; không tự retry khoản thu. Khóa theo attempt ID trong lần mở trang; đây là ngăn thao tác lặp trên UI, backend vẫn là nơi đảm bảo giao dịch chỉ ghi một lần.
- Admin exceptions: filter trạng thái, phân trang 20 dòng, loading/error/empty. Không thêm resolve/refund.

## API

| Hàm export | Method / path qua Gateway |
| --- | --- |
| checkout | POST /commerce/api/v1/orders (có sẵn cho bước nối cart sau) |
| getOrderPaymentAttempt | POST /commerce/api/v1/orders/{orderId}/payment-attempt, không body |
| getOrder | GET /commerce/api/v1/orders/{orderId} |
| confirmCodCollection | POST /payment/api/v1/admin/cod-collections |
| listPaymentExceptions | GET /payment/api/v1/admin/payment-exceptions |

Import `paymentApi`, `PaymentApiError` và các types từ `@/features/payments`. API factory `createPaymentApi` vẫn có sẵn cho dependency injection/test.

## Giới hạn và quyết định còn thiếu

- Nút kiểm tra chỉ đọc kết quả backend. SePay webhook và dispatcher phải được cấu hình ở BE; FE không có service credential và không gọi internal webhook.
- Backend recovery self-only cho cả CUSTOMER/ADMIN. Trang Admin nhận payment_attempt_id thật; chưa có API tìm attempt theo mọi Order cho Admin.
- Chưa có public GET attempt-by-ID, public COD collection-status tổng quát, QR mới sau expiry, refund hoặc manual exception resolution. Giữ nguyên TBD theo contract backend.
- API tạo attempt trực tiếp cũ của Payment phụ thuộc endpoint Commerce snapshot chưa được triển khai; trang mới dùng Commerce recovery.
- Trang danh sách Order cũ và /checkout/qr là demo, không phải bằng chứng thanh toán thật.
- Không có thay đổi schema, migration, database, secret hay cấu hình backend.

## Kiểm tra

```powershell
npm.cmd run typecheck
npm.cmd exec --yes --package=node@22 -- node node_modules/vitest/vitest.mjs run src/features/payments --pool=threads
npm.cmd exec --yes --package=node@22 -- node node_modules/vitest/vitest.mjs run --pool=threads --fileParallelism --maxWorkers=2
npm.cmd run build
git diff --check
```

Dùng Node 22 theo .mise.toml. Tests HTTP được mock; không coi đó là thực thi HTTP/backend thật. Postman collections và run guide hiện có trong StyleMind_BE/postman: StyleMind-Commerce-Payment-Handoff, StyleMind-US-04.02-Confirm-Payment, StyleMind-COD-Two-Step (.postman_collection.json). Import và chạy với token/fixture local, không gửi service credential từ FE.

Dependencies local đã được bổ sung ở lượt trước bằng npm install --ignore-scripts --no-package-lock vì npm ci bị khóa native module; package.json/lockfile không đổi. Phiên bản installed có thể nằm trong range khai báo thay vì khớp lockfile. Kết quả xác minh thực tế được ghi bên dưới khi hoàn tất; chưa kiểm tra live SePay, bank transfer, CORS hoặc dữ liệu persistent.

## Kết quả xác minh — 2026-10-30

- Typecheck: PASS (Node 22.23.4).
- Payment API/client/pages: 32/32 PASS; Payment route guards: 4/4 PASS. Tổng 36 test Payment, không có test bị skip trong hai lượt này.
- Full regression: 135 PASS, 16 FAIL, 151 tests / 33 files. Lượt này chạy trước khi thêm 4 test route mới; các test route được chạy riêng và pass.
- Cả 16 lỗi đều thuộc src/features/admin/pages/AdminPage.test.tsx. Đã xuất nguyên HEAD 8f861a1 vào thư mục tạm, chạy toàn bộ 23 test Admin trên baseline: 7 PASS / cùng 16 FAIL với cùng tên test. Ví dụ: filters products and toggles a product inactive không tìm thấy prd-blouse-01. Không sửa các chức năng Admin ngoài phạm vi Payment.
- Build: PASS; cảnh báo chunk JS >500 kB vẫn có. Không khẳng định production readiness.
- git diff --check: PASS.
- Chưa thực thi HTTP/backend thật, live SePay/bank, persistent database hay CORS/browser. Các test dùng mock API và Identity fixture.
- Không chạy Compose, migration, không đọc/sửa secret, không commit/push.

### Files thay đổi

- src/features/payments/api/types.ts — request/response types
- src/features/payments/api/paymentApi.ts — HTTP client factory, dùng chung base URL
- src/features/payments/api/paymentApi.test.ts — HTTP contract/error tests
- src/features/payments/api/paymentClient.ts — đọc Identity token và thông báo lỗi
- src/features/payments/api/paymentClient.test.ts — kiểm tra token hiện tại/rotation
- src/features/payments/pages/PaymentPage.tsx — Order lookup, QR, expiry, polling
- src/features/payments/pages/AdminPaymentsPage.tsx — thu COD và exceptions
- src/features/payments/PaymentPages.test.tsx — customer/Admin flow tests
- src/features/payments/PaymentRoutes.test.tsx — route authorization tests
- src/features/payments/index.ts — exports
- src/app/router/routes.ts — URL constants
- src/app/router/AppRouter.tsx — guarded routes
- src/app/layouts/components/CustomerHeader.tsx — link Payment
- src/features/admin/pages/AdminPage.tsx — link Admin Payment
- src/vite-env.d.ts — env type
- vite.config.ts — Gateway proxies
- docs/PAYMENT_API.md — hướng dẫn và bằng chứng này
