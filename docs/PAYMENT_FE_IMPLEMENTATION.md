# Payment FE — handoff 03/11/2026

Triển khai theo `StyleMind_BE/postman/PAYMENT_FE_HANDOFF.md`. Tài liệu này thay thế các mô tả luồng demo trong PAYMENT_API.md và các báo cáo guest trước đó. Không sửa BE trong lần triển khai này.

## Hành vi đã nối

- Catalog và giỏ API dùng cho cả guest và tài khoản. Thêm sản phẩm, mua ngay và thêm outfit ghi vào giỏ BE; sản phẩm outfit cũ không tồn tại trong catalog thật sẽ có thông báo, không âm thầm thêm giỏ local. Không thay đổi quyền catalog ở BE.
- `/checkout`: guest nhập địa chỉ trực tiếp, tài khoản chọn địa chỉ Identity của chính mình. Giá lấy từ API theo đúng chủ sở hữu. Hai phương thức COD/SEPAY_VIETQR, body đúng hợp đồng và khóa submit đồng bộ bằng ref.
- Checkout key giữ nguyên với cùng payload khi lỗi mạng/timeout/409. Lưu order ID và owner trước khi điều hướng, tải lại giỏ BE. Không tự tạo lại đơn khi khôi phục payment.
- Guest dùng đúng `guest_session_key` của giỏ qua header, không JWT/URL/log. Không thay khóa khi khôi phục đơn hoặc gặp 401. Địa chỉ nháp chỉ ở sessionStorage của tab; localStorage chỉ lưu metadata không chứa địa chỉ. Dữ liệu local cũ được chuyển sang sessionStorage rồi xóa. Đóng tab làm mất payload đang chờ thì giữ mã checkout và chặn tạo đơn mới thay thế kết quả chưa rõ.
- Validation guest trim Unicode, đếm code point, giới hạn 100/64/500, loại control characters, giữ nguyên định dạng số điện thoại.
- `/guest/orders/:orderId` luôn dùng API guest, kể cả sau đăng nhập. `/payments/:orderId` và `/orders/:orderId` đọc đơn tài khoản; ID đã biết thuộc guest được chuyển về trang guest.
- QR lấy trực tiếp từ `qrPayload`, countdown theo `expiresAt`. Không xác nhận đã thanh toán khi chỉ lấy được QR. COD PLACED là đã đặt hàng, chưa xác nhận thu tiền.
- Đọc Order trước, POST attempt không body chỉ khi PENDING_PAYMENT. Nút kiểm tra và polling dùng GET Order; nút khôi phục dùng POST trên cùng đơn. Attempt PAID và ORDER_NOT_PAYABLE đều đọc lại Order. EXPIRED ẩn QR, CANCELLED/EXCEPTION dừng hướng dẫn chuyển tiền.
- Polling GET tuần tự mỗi 5 giây, tối đa 15 phút mỗi lần mở trang, tạm dừng request khi tab ẩn, hủy request/timer khi rời trang hoặc đổi đơn. Dừng khi không còn PENDING_PAYMENT. Hết thời gian chờ không được coi là thất bại; vẫn có GET thủ công.
- Account API đọc token Identity hiện tại và dùng cơ chế refresh token chung khi 401. Guest API không kích hoạt đăng nhập hay refresh JWT. 403/404 không lặp tự động, lỗi dữ liệu hiển thị tiếng Việt; EMPTY_CART/INSUFFICIENT_STOCK tải lại giỏ/giá.
- `/checkout/qr` và `/order-success/:orderId` cũ chuyển sang payment thật, không còn nút xác nhận thanh toán local. Repository demo cũ không còn được export hoặc import bởi luồng chạy.
- Admin COD: khóa gửi trùng, kiểm tra UUID/số nguyên dương/reference, chỉ ghi nhận khi người quản trị xác nhận đã thực thu. Không tự thử lại sau kết quả thu tiền chưa rõ. Exceptions giữ phân trang, không thêm refund/resolve.

## Các file chính

| Nhóm | File |
| --- | --- |
| API account/JWT | `src/features/payments/api/paymentApi.ts`, `paymentClient.ts`, `types.ts`; `src/shared/api/identityApi.ts` |
| Giỏ và catalog | `src/features/cart/model/AccountCommerceProvider.tsx`, `GuestCommerceProvider.tsx`; `cart/pages/CartPage.tsx`, `GuestCartPage.tsx`; `product-detail/pages/ProductDetailPage.tsx`; `wardrobe/pages/OutfitDetailPage.tsx` |
| Checkout | `src/features/checkout/pages/AccountCheckoutPage.tsx`, `GuestCheckoutPage.tsx`, `CheckoutPage.tsx`; `checkout/model/accountCheckout.ts`, `guestCheckout.ts`; `checkout/data/guestCheckoutApi.ts` |
| Payment và lưu chủ sở hữu | `src/features/payments/model/useOrderPayment.ts`, `orderReferences.ts`; `payments/pages/PaymentEntryPage.tsx`, `AccountOrderPayment.tsx`; `checkout/pages/GuestOrderPage.tsx`; `checkout/components/GuestPaymentView.tsx` |
| Routes cũ/đơn hàng | `src/features/checkout/pages/LegacyCheckoutRedirect.tsx`, `QrPaymentPage.tsx`, `OrderSuccessPage.tsx`; `orders/pages/AccountOrdersPage.tsx`, `OrderDetailPage.tsx`, `OrdersPage.tsx` |
| Wiring và Admin | `src/app/providers/AppProviders.tsx`, `app/layouts/components/CustomerHeader.tsx`; `payments/pages/AdminPaymentsPage.tsx` |
| Kiểm thử | `checkout/CheckoutFlow.test.tsx`, `GuestCheckout.test.tsx`; `payments/PaymentPages.test.tsx`, `api/paymentApi.test.ts`; `orders/OrdersFlow.test.tsx`; các smoke/cart/product/outfit tests; `src/test/identityMockBackend.ts` (chỉ fixture kiểm thử) |

## Giới hạn theo API bàn giao

- Chưa có API tìm guest Order bằng checkout key khi POST timeout mà chưa nhận ID. FE giữ nguyên mã và thông báo kết quả chưa rõ; không suy đoán đơn chưa tạo.
- Handoff không cung cấp API danh sách toàn bộ đơn tài khoản, hủy/trả đơn thật. `/orders` chỉ liệt kê ID đã biết của tài khoản trên trình duyệt và mở chi tiết qua GET thật; không hiển thị trạng thái hoặc thao tác hủy/trả demo cho đơn thật.
- Chưa có Admin lookup attempt COD theo Order của khách khác. Admin phải có attempt ID thực tế; không dùng endpoint self-only để tra đơn người khác.
- Không có luồng tạo QR mới sau expiry, refund hoặc xử lý exception thủ công được phê duyệt. Recovery giữ nguyên attempt ban đầu.
- Xác nhận SePay thực tế phụ thuộc callback và event delivery Payment → Commerce của BE. Chưa thực hiện chuyển khoản thật/webhook/CORS trên browser trong lượt này.

## Xác minh

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run build`: PASS; còn cảnh báo bundle JS trên 500 kB.
- Nhóm payment/guest/account mới: 43/43 PASS; API/payment routes đã kiểm tra riêng ở các lượt tương ứng.
- Regression Order/outfit/smoke mua hàng: 15/15 PASS. Giỏ và chi tiết sản phẩm: 3/3 PASS trong lượt kiểm tra tài khoản.
- Các bài trên dùng HTTP mock theo wire contract, không phải bằng chứng giao dịch ngân hàng thật.
- HTTP đọc thật Gateway: catalog 200; guest prices thiếu header trả 401 UNAUTHENTICATED; cùng endpoint với header phiên kiểm tra độc lập trả 409 EMPTY_CART. Không tạo Order hoặc gọi webhook trong kiểm tra HTTP này.
- FE đã được khởi động tại `http://localhost:4000` sau khi các cổng preview không phản hồi. GET trang chủ, checkout, module AccountCheckoutPage/useOrderPayment và catalog qua proxy FE đều trả 200.
- API, route guards và giỏ guest: 29/29 PASS, gồm retry JWT đúng payload và không replay khi tài khoản thay đổi.
- Full regression: 165 PASS / 18 FAIL trên 183 bài, 36 file. 16 lỗi thuộc `src/features/admin/pages/AdminPage.test.tsx`, trùng nhóm lỗi Admin đã ghi nhận trong báo cáo lịch sử. Hai lỗi còn lại là kỳ vọng trang đơn demo trong CustomerRoutes và NotificationsFlow; đã cập nhật sang trang payment thật với kiểm tra UUID và chạy lại riêng.
- Chạy lại sau cập nhật kỳ vọng: CustomerRoutes 3/3, NotificationsFlow 3/3 và PaymentPages 19/19 PASS. Không còn lỗi đã biết thuộc luồng payment/checkout trong các lượt kiểm tra này. Không chạy lại toàn bộ 36 file sau khi sửa hai kỳ vọng; 16 lỗi Admin ngoài phạm vi vẫn chưa xử lý.
- `git diff --check`: PASS.

## Bàn giao nhánh

- Bàn giao toàn bộ guest và tài khoản trên `feature/payment-checkout-complete`.
- Trước khi push: typecheck/build PASS; 43 bài của GuestCheckout, CheckoutFlow và PaymentPages tại workspace chính đều PASS. Lượt chạy còn kiểm tra 25 bài tương ứng trong worktree tách tài khoản tạm thời, tổng 68/68 PASS. Worktree tạm được dọn sau khi quyết định bàn giao chung.
- Lỗi tải ảnh QR được lưu theo attempt ID để tránh effect reset mất lỗi; khôi phục thanh toán cho phép tải lại ảnh trên cùng attempt.
