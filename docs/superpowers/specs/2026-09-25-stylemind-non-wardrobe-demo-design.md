# Thiết kế bản demo StyleMind ngoài phạm vi Tủ đồ AI

**Ngày:** 2026-09-25

**Trạng thái:** Đã xác nhận trong trao đổi, đang chờ duyệt tài liệu hoàn chỉnh

**Phạm vi:** Bản demo frontend sử dụng dữ liệu giả lập cho toàn bộ chức năng Customer và Admin ngoài miền nghiệp vụ AI Wardrobe

## 1. Mục tiêu

Xây dựng một bản demo frontend StyleMind hoàn chỉnh và có thể tương tác bằng dữ liệu giả lập. Bản demo phải hỗ trợ các quy trình thực tế của Customer và Admin, giữ dữ liệu sau khi tải lại trang, đồng thời tổ chức lại repository theo cấu trúc feature-first.

Các chức năng AI Wardrobe, tạo outfit và AI Stylist hiểu ngữ cảnh tủ đồ được tạm hoãn. Những màn hình liên quan đến tủ đồ hiện có có thể được chuyển vào cấu trúc mới để routing tiếp tục hoạt động, nhưng không được mở rộng nghiệp vụ trong giai đoạn này.

Tên file, thư mục, component, type, interface, biến, hàm, action, route, giá trị model và storage key đều dùng tiếng Anh. Tất cả nội dung người dùng nhìn thấy phải dùng tiếng Việt, bao gồm nhãn, navigation, validation, thông báo, trạng thái, dữ liệu mẫu, ngày tháng và định dạng tiền tệ.

## 2. Phạm vi sản phẩm

### Chức năng Customer được triển khai

- Xác thực: đăng nhập, đăng ký, xác thực OTP, quên mật khẩu và đặt lại mật khẩu.
- Trang chủ giới thiệu mua sắm thời trang và AI Wardrobe.
- Tìm kiếm, sắp xếp, bộ lọc desktop và bảng lọc mobile.
- Chi tiết sản phẩm với gallery riêng theo màu, lựa chọn size, số lượng, thêm vào giỏ và mua ngay.
- Giỏ hàng với điều chỉnh số lượng, xác nhận xóa, giảm giá, vận chuyển, tổng tiền và trạng thái trống.
- Checkout với chọn địa chỉ, thêm địa chỉ, kiểm tra đơn hàng, COD, VietQR và tạo đơn.
- Thanh toán QR với đếm ngược, chờ thanh toán, hết hạn, xác minh và thành công.
- Danh sách đơn hàng, chi tiết, timeline, yêu cầu hủy, yêu cầu trả hàng và theo dõi hoàn tiền.
- Hồ sơ, quản lý địa chỉ, thông báo, đổi mật khẩu, đăng xuất và đặt lại dữ liệu demo.
- Giao diện responsive cho desktop, tablet và mobile.

### Chức năng Admin được triển khai

- Dashboard quản trị và dashboard phân tích AI.
- Quản lý người dùng.
- Quản lý danh mục.
- Quản lý sản phẩm, biến thể, tồn kho và ảnh theo màu.
- Quản lý đơn hàng.
- Xử lý yêu cầu hủy đơn.
- Xử lý yêu cầu trả hàng và hoàn tiền.
- Quản lý metadata thời trang và quy tắc tương thích cho AI.
- Đặt lại dữ liệu demo với hộp thoại xác nhận hành động nguy hiểm.

### Chức năng tạm hoãn

- Tạo, chỉnh sửa, xóa, tạo lại hoặc đổi phong cách tủ đồ.
- Tạo outfit từ tủ đồ.
- AI Stylist hiểu ngữ cảnh của tủ đồ.
- Mua sản phẩm trực tiếp từ tủ đồ hoặc outfit do AI tạo.

### Chức năng bị loại khỏi ứng dụng đang hoạt động

- Travel Planner.
- Visual Studio.
- Giày, túi, trang sức, mũ và các phụ kiện thời trang khác.

Source của Travel Planner và Visual Studio có thể tạm thời được giữ trong `src/legacy`, nhưng không được có route hoặc mục navigation đang hoạt động.

## 3. Kiến trúc

Sử dụng kiến trúc feature-first theo hướng thực dụng. React Router phụ trách URL routing và route guard. React Context kết hợp typed reducer quản lý application state mà không cần thêm thư viện state tổng quát. Mock repository tách biệt persistence và hành vi bất đồng bộ khỏi component giao diện.

```text
src/
  app/
    router/
    layouts/
    providers/
    styles/

  features/
    auth/
    catalog/
    cart/
    checkout/
    orders/
    profile/
    notifications/
    admin/
    wardrobe/

  entities/
    product/
    cart/
    order/
    user/
    address/
    notification/

  shared/
    ui/
    hooks/
    lib/
    storage/
    constants/
    types/

  legacy/
    travel/
    visual-studio/
```

Mỗi feature sử dụng cấu trúc sau khi các thư mục tương ứng thực sự cần thiết:

```text
features/catalog/
  pages/
  components/
  model/
  data/
  types/
  index.ts
```

- `pages` chứa phần kết hợp ở cấp route.
- `components` chứa UI chỉ thuộc feature đó.
- `model` chứa reducer, action, selector, hook và quy tắc nghiệp vụ.
- `data` chứa mock repository và dữ liệu seed của feature.
- `entities` chứa domain type và UI theo nghiệp vụ được tái sử dụng.
- `shared` chứa UI tổng quát, hook, formatter, storage utility, constant và shared type.
- Mỗi feature cung cấp public API qua `index.ts`; bên ngoài không được import sâu vào nội bộ feature.
- Import nội bộ sử dụng alias `@/` hiện có.

`App.tsx` trở thành điểm vào nhỏ gọn, chỉ mount provider và router. Navigation, thay đổi dữ liệu và nghiệp vụ không được tiếp tục tập trung trong `App.tsx`.

## 4. Routing và phân quyền

Route dùng đường dẫn tiếng Anh ổn định, trong khi nhãn hiển thị sử dụng tiếng Việt.

```text
/
├── /login
├── /register
├── /verify-otp
├── /forgot-password
├── /reset-password
├── /shop
├── /products/:productId
├── /cart
├── /checkout
├── /checkout/qr
├── /order-success/:orderId
├── /orders
├── /orders/:orderId
├── /account/*
├── /notifications
├── /ai-wardrobe
├── /wardrobes
└── /admin/*
```

- Route công khai gồm trang chủ, xác thực, cửa hàng, chi tiết sản phẩm và giỏ hàng.
- `AuthGuard` bảo vệ checkout, đơn hàng, tài khoản và thông báo.
- `AdminGuard` bảo vệ toàn bộ route `/admin/*`.
- Customer và Admin dùng chung trang đăng nhập. Đăng nhập thành công sẽ điều hướng theo role.
- Người đã đăng nhập truy cập trang xác thực sẽ được chuyển đến khu vực phù hợp với role.
- Route không tồn tại hiển thị trang 404 tiếng Việt và cung cấp đường quay lại rõ ràng.
- Header Customer không có shortcut Admin. Quyền truy cập Admin được xác định bằng role đã đăng nhập.

## 5. State, persistence và mock repository

`DemoStoreProvider` sở hữu cơ sở dữ liệu demo có kiểu dữ liệu rõ ràng, được chuẩn hóa và thực thi domain action qua reducer. State chỉ phục vụ UI như modal đang mở, filter đang chọn, bản nháp form và loading được giữ cục bộ trong feature liên quan.

Dữ liệu được lưu gồm:

- Người dùng, thông tin đăng nhập của tài khoản demo, role và trạng thái tài khoản.
- Phiên đăng nhập hiện tại và lựa chọn ghi nhớ đăng nhập.
- Sản phẩm, danh mục, biến thể, tồn kho và ảnh theo màu.
- Các dòng trong giỏ hàng và trạng thái mã giảm giá.
- Địa chỉ và lựa chọn địa chỉ mặc định.
- Đơn hàng, yêu cầu hủy, yêu cầu trả hàng và trạng thái hoàn tiền.
- Thông báo và trạng thái đã đọc.
- Metadata thời trang và quy tắc tương thích do Admin quản lý.
- Dữ liệu seed phục vụ dashboard phân tích AI.

Cơ sở dữ liệu local sử dụng storage key tiếng Anh và có `schemaVersion` rõ ràng. Quy trình khởi động:

1. Đọc cơ sở dữ liệu đã lưu.
2. Kiểm tra version và cấu trúc cấp cao bắt buộc.
3. Chuyển đổi các phiên bản cũ được hỗ trợ.
4. Thay dữ liệu không hợp lệ hoặc không được hỗ trợ bằng seed hiện tại.
5. Thông báo cho người dùng khi quá trình khôi phục đã thay đổi dữ liệu demo của họ.

Mock repository trả về Promise với độ trễ ngắn, cố định để có thể quan sát skeleton và trạng thái đang xử lý. Không tạo lỗi ngẫu nhiên trong lúc demo. Các lỗi dự kiến đến từ validation hoặc chuyển trạng thái không hợp lệ.

Action liên feature tác động lên cùng một store. Ví dụ, Admin duyệt yêu cầu hủy sẽ cập nhật đơn hàng của Customer và tạo thông báo cho Customer. Khi đặt hàng, hệ thống xóa các dòng giỏ hàng đã mua, tạo đơn, timeline và thông báo xác nhận trong cùng một thao tác nguyên tử.

Chức năng reset yêu cầu xác nhận, thay toàn bộ dữ liệu đã lưu bằng seed hiện tại và khôi phục trạng thái đăng nhập phù hợp.

## 6. Trải nghiệm Customer

### Xác thực

- Đăng nhập hỗ trợ email, mật khẩu, hiện/ẩn mật khẩu, ghi nhớ đăng nhập và điều hướng theo role.
- Đăng ký thu thập họ tên, email, mật khẩu và xác nhận mật khẩu, sau đó chuyển đến xác thực OTP.
- Luồng OTP và khôi phục mật khẩu sử dụng mã demo cố định, hiển thị trong khung hỗ trợ demo kín đáo.
- Validation hiển thị trực tiếp tại trường nhập và dùng nội dung tiếng Việt.
- Phiên đăng nhập được lưu theo lựa chọn ghi nhớ đăng nhập.

### Trang chủ và navigation

- Navigation desktop gồm `Trang chủ`, `Cửa hàng`, `AI Wardrobe` và `Tủ đồ của tôi`.
- Tìm kiếm, thông báo, giỏ hàng và tài khoản luôn dễ truy cập.
- Navigation mobile ưu tiên Trang chủ, Cửa hàng, AI Wardrobe, Tủ đồ và Giỏ hàng/Tài khoản tùy không gian khả dụng.
- Trang chủ giới thiệu cả mua sắm thời trang và AI Wardrobe. CTA về tủ đồ dẫn đến trải nghiệm hiện có đang được tạm hoãn.

### Catalog và chi tiết sản phẩm

- Danh mục đang hoạt động gồm áo, quần, chân váy, đầm và áo khoác.
- Tìm kiếm theo tên sản phẩm, danh mục, phong cách, dịp sử dụng, chất liệu và tag.
- Bộ lọc gồm danh mục, giá, màu, size, phong cách và dịp sử dụng.
- Desktop dùng sidebar filter; mobile dùng bottom sheet có thao tác áp dụng và xóa bộ lọc.
- Product card hiển thị ảnh, tên tiếng Việt, giá, màu và thông tin danh mục/phong cách khi cần.
- Chi tiết sản phẩm hiển thị metadata, gallery riêng theo màu, size, số lượng, thông tin tồn kho, thêm vào giỏ và mua ngay.
- Mua ngay tạo hoặc cập nhật dòng giỏ hàng đã chọn rồi đưa người dùng thẳng đến checkout.

### Giỏ hàng và checkout

- Giỏ hàng hỗ trợ thay đổi số lượng, xác nhận xóa, giảm giá, phí vận chuyển, tổng tiền và trạng thái trống.
- Checkout hiển thị địa chỉ đã chọn, sản phẩm, phương thức thanh toán, giảm giá và tổng tiền.
- Người dùng có thể chọn địa chỉ hiện có hoặc thêm địa chỉ hợp lệ mà không rời checkout.
- COD tạo đơn ngay lập tức.
- VietQR mở luồng QR với số tiền, nội dung chuyển khoản, hướng dẫn và thời gian đếm ngược.
- Nút `Tôi đã thanh toán` chuyển sang trạng thái xác minh cố định trước khi thành công.
- Phiên QR hết hạn có thể được tạo lại mà không tạo trùng đơn hàng.
- Trang đặt hàng thành công hiển thị mã đơn, tổng tiền, phương thức thanh toán, xem đơn và tiếp tục mua sắm.

### Đơn hàng và yêu cầu hỗ trợ

- Danh sách đơn hàng hỗ trợ cả trạng thái trống và có dữ liệu.
- Chi tiết đơn hiển thị trạng thái, trạng thái thanh toán, sản phẩm, biến thể, địa chỉ, tổng tiền và timeline.
- Quy tắc chuyển trạng thái hợp lệ được định nghĩa trong order model, không lặp lại ở các UI component.
- Đơn đủ điều kiện có thể gửi lý do yêu cầu hủy. Yêu cầu sẽ xuất hiện trong Admin.
- Đơn đã hoàn thành và đủ điều kiện có thể yêu cầu trả lại sản phẩm với số lượng cụ thể.
- File minh chứng trả hàng được preview trong memory. Persistence chỉ lưu metadata an toàn như tên và loại file, không lưu binary hoặc object URL.
- Trạng thái yêu cầu hiển thị cho Customer gồm đã gửi, đang xem xét, đã duyệt, bị từ chối và đã hoàn tiền.

### Tài khoản và thông báo

- Khu vực tài khoản gồm hồ sơ, địa chỉ, đơn hàng, thông báo, đổi mật khẩu, đăng xuất và reset dữ liệu demo.
- Quản lý địa chỉ hỗ trợ thêm, sửa, xóa, đặt mặc định, validation và xác nhận hành động nguy hiểm.
- Chuông thông báo hiển thị số chưa đọc và dropdown tóm tắt.
- Trang thông báo hỗ trợ đọc từng mục, đánh dấu tất cả đã đọc, thời gian, loại thông báo và trạng thái trống.

## 7. Trải nghiệm Admin

Admin sử dụng layout tập trung cho công việc với sidebar riêng, top bar, tìm kiếm tại nơi phù hợp, thông báo và hồ sơ quản trị viên.

### Dashboard và analytics

- KPI Dashboard hiển thị tổng người dùng, sản phẩm, đơn hàng và doanh thu.
- Biểu đồ tóm tắt số lượng đơn, doanh thu, trạng thái đơn, phương thức thanh toán và trả hàng/hoàn tiền.
- AI Analytics hiển thị dữ liệu seed về tổng tủ đồ, outfit được tạo, phong cách phổ biến, sản phẩm AI thêm vào giỏ và đơn hàng từ AI.
- Chỉ số được tính từ dữ liệu demo hiện tại khi có thể; chỉ số phụ thuộc chức năng tủ đồ đang hoãn dùng trường seed được định nghĩa rõ ràng.

### Người dùng và danh mục

- Quản lý người dùng hỗ trợ tìm kiếm, lọc role/trạng thái, xem chi tiết và khóa/mở khóa tài khoản.
- Quản trị viên đang đăng nhập không thể tự khóa tài khoản của mình.
- Quản lý danh mục sử dụng tree/table chỉ dành cho quần áo và hỗ trợ thêm, sửa, kích hoạt, ngừng hoạt động.
- Ngừng hoạt động danh mục không âm thầm xóa sản phẩm.

### Sản phẩm, biến thể và hình ảnh

- Danh sách sản phẩm hỗ trợ tìm kiếm, lọc, trạng thái, xem, sửa, kích hoạt/ngừng hoạt động và tạo mới.
- Form sản phẩm tách thông tin cơ bản, metadata thời trang, biến thể, tồn kho và hình ảnh thành các phần rõ ràng.
- Biến thể hỗ trợ màu, size, giá ghi đè tùy chọn, tồn kho và trạng thái.
- Mỗi màu sở hữu một gallery có thứ tự riêng và một ảnh chính.
- Admin có thể thêm URL ảnh, preview file local trong phiên hiện tại, đặt ảnh chính, xóa và thay đổi thứ tự ảnh.
- File local chỉ lưu metadata; ảnh demo cần tồn tại sau reload sử dụng URL.

### Đơn hàng, hủy đơn và trả hàng

- Quản lý đơn hàng hỗ trợ tìm kiếm, lọc, xem chi tiết, trạng thái thanh toán và chuyển trạng thái hợp lệ.
- Yêu cầu hủy có thể được duyệt hoặc từ chối kèm ghi chú Admin tùy chọn.
- Duyệt yêu cầu cập nhật đơn, yêu cầu và thông báo Customer trong một action.
- Yêu cầu trả hàng hiển thị sản phẩm, số lượng, mô tả và metadata minh chứng hiện có.
- Admin có thể xem xét, duyệt, từ chối và xử lý hoàn tiền giả lập khi đủ điều kiện.

### Quản lý AI

- Phong cách và dịp sử dụng hỗ trợ danh sách, thêm, sửa, kích hoạt và ngừng hoạt động.
- Metadata thời trang gồm họa tiết, phom dáng, chất liệu và màu sắc.
- Quy tắc tương thích gồm loại trang phục, màu sắc, phong cách và dịp sử dụng.
- Các thiết lập được lưu để dùng cho phần tủ đồ sau này nhưng không làm thay đổi hành vi tủ đồ đang hoãn trong giai đoạn này.

## 8. Tương tác, validation và xử lý lỗi

- Không feature nào sử dụng `window.alert()` hoặc `window.confirm()`.
- Form hiển thị validation tiếng Việt tại từng trường và lỗi submit tổng quát khi cần.
- Hành động nguy hiểm sử dụng confirmation dialog thống nhất và destructive button rõ ràng.
- Mutation thành công hiển thị toast ngắn gọn và cập nhật ngay các màn hình phụ thuộc.
- Trạng thái loading sử dụng skeleton phù hợp với layout thay vì spinner chặn toàn màn hình khi có thể.
- Có empty state cho giỏ hàng, đơn hàng, thông báo, kết quả tìm kiếm, sản phẩm, yêu cầu và các danh sách khác.
- Dữ liệu storage hỏng hoặc sai schema version được khôi phục an toàn về seed.
- Email trùng, thông tin đăng nhập sai, hết hàng, chuyển trạng thái đơn không hợp lệ và thanh toán hết hạn trả về domain error cố định.
- Bắt buộc quản lý focus, hỗ trợ bàn phím, focus ring rõ ràng, semantic landmark, accessible label và độ tương phản màu phù hợp.

## 9. Định hướng hình ảnh và responsive

- Giữ bản sắc nữ tính, cao cấp và trẻ trung của StyleMind, đồng thời cải thiện tính nhất quán.
- Tiếp tục dùng cặp font Fraunces và DM Sans hiện tại, trừ khi triển khai phát hiện vấn đề kỹ thuật.
- Hình ảnh sản phẩm giữ vai trò thị giác chính.
- Màn hình Customer có nhiều khoảng trắng và phân cấp mang tính editorial.
- Màn hình Admin sử dụng layout gọn, yên tĩnh và ưu tiên quét dữ liệu, thao tác lặp lại.
- Card có bán kính bo vừa phải và chỉ dùng cho sản phẩm, bản ghi lặp, modal và công cụ thực sự cần khung; không biến mọi section thành card.
- Desktop, tablet và mobile có cách bố trí có chủ đích. Mobile dùng sheet cho filter, sticky action khi cần, chuyển table thành danh sách có cấu trúc và giữ dialog trong viewport.
- Nội dung giao diện phải nằm gọn trong control ở mọi kích thước được hỗ trợ, không chồng lấn.

## 10. Thứ tự triển khai

1. Thêm application routing, layout, provider, route guard, demo store, persistence và phục hồi storage.
2. Chuyển shared UI và domain entity vào cấu trúc mới, thiết lập public API cho feature.
3. Triển khai xác thực, trang chủ, catalog, chi tiết sản phẩm, giỏ hàng và checkout.
4. Triển khai đơn hàng, hồ sơ, địa chỉ, thông báo, hủy đơn và trả hàng.
5. Triển khai đầy đủ khu vực Admin.
6. Chuyển code wardrobe hiện tại vào feature boundary mà không mở rộng hành vi.
7. Chuyển Travel Planner và Visual Studio vào `legacy`, gỡ active route và xóa các screen trùng lặp đã lỗi thời.
8. Hoàn tất responsive, accessibility, kiểm thử tự động, build và kiểm tra hình ảnh.

Có thể dùng compatibility re-export tạm thời trong quá trình chuyển đổi, nhưng các active import cuối cùng phải trỏ đến public API của feature. Mọi thay đổi hiện có của người dùng ngoài phạm vi phải được giữ nguyên.

## 11. Chiến lược kiểm thử

Thêm Vitest và React Testing Library vào dự án, đồng thời định nghĩa script `test`.

Phạm vi kiểm thử tự động tập trung vào:

- Khởi tạo storage, kiểm tra schema, migration, khôi phục, persistence và reset.
- Xác thực và routing theo role.
- Tìm kiếm/lọc catalog và gallery sản phẩm theo màu.
- Gộp dòng giỏ hàng, giới hạn số lượng, giảm giá, vận chuyển và tổng tiền.
- Chuyển trạng thái checkout COD và VietQR, hết hạn thanh toán và ngăn tạo trùng đơn.
- Quy tắc chuyển trạng thái đơn hàng.
- Cập nhật liên feature giữa hủy đơn, trả hàng, hoàn tiền và thông báo.
- Validation địa chỉ và quy tắc chỉ có một địa chỉ mặc định.
- Mutation sản phẩm, danh mục, người dùng và guard rule trong Admin.

Quá trình xác minh gồm:

- Kiểm tra TypeScript thông qua production build.
- Chạy toàn bộ automated test.
- Mở trực tiếp và reload tất cả route.
- Smoke test toàn bộ luồng Customer và Admin bằng tài khoản seed.
- Kiểm tra trực quan tại kích thước desktop, tablet và mobile đại diện.
- Quét nội dung tiếng Anh còn hiển thị, navigation ngoài phạm vi, lệnh `alert()`, route chết và import lỗi thời.

## 12. Tiêu chí hoàn thành

Giai đoạn được xem là hoàn thành khi:

- Toàn bộ nội dung UI Customer và Admin đang hoạt động đã là tiếng Việt.
- Tên trong source code và route vẫn dùng tiếng Anh.
- Mỗi màn hình trong phạm vi có URL thật và reload đúng trạng thái.
- Mọi control Customer và Admin trong phạm vi đều thực hiện một hành động demo có ý nghĩa.
- Customer và Admin thao tác trên cùng cơ sở dữ liệu mock được lưu bền vững.
- Travel Planner, Visual Studio, giày, túi và phụ kiện không xuất hiện trong ứng dụng đang hoạt động.
- Nghiệp vụ Wardrobe không bị mở rộng.
- Responsive hoạt động ở desktop, tablet và mobile mà không chồng lấn.
- Automated test và production build đều thành công.
- Repository sử dụng cấu trúc feature-first đã duyệt và không còn phụ thuộc vào screen switcher nguyên khối trong `App.tsx`.
