# Đối chiếu giao diện StyleMind

Đích: `E:\mss\du-an\fe-1\StyleMind_FE`. Tham chiếu: `E:\Ki_8\MSS\clean-source\MSS301-Stylemind\FE`. Trạng thái dưới đây dựa trên đối chiếu mã và các thay đổi đã thực hiện, chưa phải xác nhận trực quan hay kiểm thử BE thật.

| Nhóm | Giao diện tham chiếu | FE hiện tại | Tình trạng |
|---|---|---|---|
| Trang chủ | HomePage | `/` | Đã chuyển hero, danh mục, thẻ sản phẩm; thay phần AI bằng tủ đồ theo yêu cầu. |
| Cửa hàng, chi tiết sản phẩm | ProductCatalogPage, ProductDetailPage | `/shop`, `/products/:productId` | Đã chỉnh bố cục, bộ lọc, thẻ và chi tiết; sắp xếp của mẫu báo chưa hỗ trợ. |
| Giỏ hàng | CartPage | `/cart` | Đã chỉnh danh sách và tóm tắt, giữ API giỏ. |
| Checkout và thanh toán | CheckoutPage | `/checkout`, `/payments/:orderId`, `/guest/orders/:orderId` | Đã chuyển bố cục địa chỉ, phương thức, tóm tắt và trạng thái; chưa đối chiếu trực quan các trạng thái QR/COD. |
| Đơn hàng | OrderTrackingPage | `/orders`, `/orders/:orderId` | Đã chỉnh trang mã đơn đã lưu và tra cứu; danh sách chỉ chứa mã trên trình duyệt. |
| Tài khoản, địa chỉ | ProfilePage | `/account`, `/account/addresses` | Đã chỉnh bố cục và thẻ địa chỉ; giữ API hồ sơ/địa chỉ. |
| Xác thực | Login, Register, Forgot, VerifyResetOtp, Reset | `/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password` | Đã đồng bộ bố cục và biểu mẫu; OTP chỉ hiển thị email. |
| Thông báo khách | NotificationsPage | `/notifications` | Giữ giao diện và báo chưa hỗ trợ. |
| Quản trị tổng quan | AdminDashboardPage | `/admin` | Đã nhóm thẻ theo mẫu; chỉ số thiếu hiển thị dấu gạch. |
| Quản trị sản phẩm | ProductManagementPage | `/admin?section=products` | Đã chỉnh danh sách, bộ lọc và biểu mẫu trượt; giữ xử lý hiện tại. |
| Quản trị đơn và yêu cầu | OrderManagementPage, AdminOrderDetailPage, AdminReturnManagementPage | `/admin?section=orders`, `?section=orders&orderId=…`, `?section=requests` | Đã chuyển chi tiết đơn thành trang trong khu vực quản trị, gồm sản phẩm, lịch sử, địa chỉ và phương thức/tổng thanh toán; giữ dữ liệu Commerce hiện có. Đổi/trả chưa hỗ trợ. Chưa kiểm tra trực quan hoặc với BE thật. |
| Quản trị người dùng | UserManagementPage | `/admin?section=customers` | Đã chỉnh bảng, bộ lọc và trạng thái; tạo tài khoản báo chưa hỗ trợ. |
| Quản trị thông báo | NotificationManagementPage | `/admin?section=notifications` | Giữ giao diện và báo chưa hỗ trợ. |
| Quản trị cài đặt | AdminSettingsPage | `/admin?section=settings` | Đã thêm bố cục hồ sơ cửa hàng, quyền và bảo mật; chưa có dữ liệu hoặc thao tác lưu thật, bấm lưu báo chưa hỗ trợ. Không chuyển cấu hình AI. |
| AI mới | AIStylistChatPage và các trang AI quản trị | Không mang sang | Theo yêu cầu; đường dẫn AI cũ báo chưa hỗ trợ. |
| EP-06 | Không có trang tương đương | Tủ đồ, tạo/chia sẻ Outfit, Bạn bè, Chat | Đã chỉnh theo phong cách mới và giữ API; chưa kiểm thử trực quan toàn bộ. |

Kiểm thử người dùng sẽ tự thực hiện: mobile/tablet và luồng có tài khoản, BE, dữ liệu thật. Lần chạy toàn bộ test trước các chỉnh sửa gần đây: 236 đạt, 29 lỗi; cần chạy lại và phân loại sau các thay đổi.
