# Kế hoạch chuyển giao diện StyleMind

**Mục tiêu:** Chuyển giao diện từ `E:\Ki_8\MSS\clean-source\MSS301-Stylemind\FE` sang FE hiện tại tại `E:\mss\du-an\fe-1\StyleMind_FE`, giữ nguyên các chức năng và API hiện tại.

**Cách làm:** Dùng FE mới làm tham chiếu về thiết kế, bố cục và thành phần giao diện; điều chỉnh từng màn hình TypeScript trong FE hiện tại để tiếp tục dùng router, state, API và xác thực đang có. Các trang chỉ có trong EP-06 được thiết kế theo phong cách của FE mới.

**Công nghệ hiện tại:** React 19, TypeScript, Vite 8, React Router 7, Tailwind CSS 4. FE tham chiếu dùng React 18, JSX, React Router 6, Zustand, Axios và Framer Motion; không mặc định thay thế công nghệ hiện tại hay lấy logic từ đó.

## Tiến độ thực tế

- Đối chiếu bảng quản trị với mẫu, thêm gợi ý cuộn ngang và khả năng focus bằng bàn phím; tài khoản dài có thể xuống dòng. Nhóm test quản trị 6/6, typecheck và build đạt. Suite chạy trước các chỉnh sửa cuối: 236 đạt, 29 lỗi ở 5 file; chưa xác định toàn bộ nguyên nhân. Người dùng sẽ tự kiểm tra mobile/tablet và các luồng với BE thật.

- Đồng bộ trạng thái rỗng của Bạn bè, lời mời đã nhận và đã gửi theo từng mục, giữ API hiện tại. 8 test Bạn bè/lời mời, typecheck và build đạt; chưa kiểm thử trực quan mobile và BE thật.

- Chia biểu mẫu sản phẩm quản trị theo nhóm thông tin, phong cách và phiên bản; giữ xử lý lưu. Đã cập nhật hai test điều hướng và kiểm tra giá để giả lập các API Commerce cần thiết; cả hai đạt. 4 test form/API/tải lại, typecheck và build đạt. Các test tích hợp cũ khác chưa cập nhật hết.

- Chỉnh trạng thái lỗi tải dữ liệu quản trị: hiển thị lỗi cùng nút thử lại; các bảng phụ thuộc dữ liệu không giả báo rỗng khi tải thất bại. 4 test tải lại/Commerce/yêu cầu, typecheck và build đạt; chưa kiểm thử BE thật.

- Đã chỉnh thẻ sản phẩm và vùng trạng thái chia sẻ trong chi tiết Outfit của chủ sở hữu/bạn bè/công khai, có ảnh dự phòng; giữ nguyên API và quyền. 19 test Tủ đồ/Outfit/giỏ, typecheck và build đạt; chưa kiểm tra trực quan hoặc BE thật.

- Đã sắp xếp lại giao diện Chat: danh sách hội thoại cuộn ngang ở màn hình nhỏ, phân khu tin nhắn/soạn tin và trạng thái chưa có tin; giữ API và realtime. 6 test Chat/realtime/ảnh, typecheck và build đạt; chưa xác nhận trực quan mobile hoặc BE thật.

- Đã chuyển giao diện trang chấp nhận lời mời sang khung StyleMind, giữ nguyên API và xác thực. Nhóm 8 test Bạn bè/lời mời đạt sau khi đồng bộ điều hướng bất đồng bộ trong test bằng React act; typecheck và build đạt. Chưa kiểm tra trực quan mobile/BE thật.

- Chỉnh giao diện tạo Outfit thủ công: thẻ sản phẩm, ảnh dự phòng, bảng Outfit và điều hướng theo phong cách mới; giữ luồng đọc Commerce và lưu Wardrobe hiện tại. 14 test Outfit liên quan, typecheck và build đạt; chưa kiểm thử trực quan mobile và BE thật.

- Rà test Tủ đồ cũ phát hiện chức năng thêm món/cả Outfit vào giỏ chưa có trên route API. Đã khôi phục qua giỏ hàng hiện tại: bỏ qua món không khả dụng, dừng nếu lỗi và báo kết quả từng phần. Đã thay test `WardrobeFlow` demo bằng test API cho danh sách, quyền xem và món không khả dụng; nhóm Outfit/builder/giỏ 22/22 đạt, typecheck và build đạt. Thao tác giỏ thật chờ người dùng kiểm tra.

- Đã chuyển nhóm test Bạn bè từ demo sang API giả lập: bảo vệ route, xác nhận trước hủy bạn, chuẩn hóa email, lỗi gửi/gửi lại và chấp nhận. 8/8 test Friends/Invitation đạt; typecheck và build đạt. Chưa thay thế kiểm thử BE thật.

- Cập nhật nhóm test AI theo yêu cầu tắt AI: thay các test tạo/chỉnh outfit AI demo và bốn test thao tác AI quản trị demo bằng test route chưa hỗ trợ, không có nút demo và không sửa dữ liệu. Các test hành vi AI demo cũ không còn được chạy. Test AI khách và quản trị chọn lọc: 5/5 đạt; typecheck và build đạt. Các test quản trị khác không nằm trong lượt chạy chọn lọc này.

- Đã hoàn tất cập nhật nhóm test thông báo theo BE hiện tại: không hiển thị dữ liệu demo/số chưa đọc giả, các bộ lọc và thao tác chưa hỗ trợ báo toast và không sửa dữ liệu. Chạy cùng test Outfit API: 18/18 đạt; typecheck và build đạt. Nhóm test này không cung cấp chức năng thông báo thật.

- Sửa khoảng tablet không có nút lọc cửa hàng (nút giờ hiển thị đến khi sidebar xuất hiện) và cho tên/email dài trong chat xuống dòng. 8 test Shop/Chat, typecheck và build đạt; chưa kiểm tra trực quan vì trình duyệt nội bộ bị tắt.
- Đã cập nhật `CustomerRoutes.test.tsx` dùng phản hồi API giả lập cho Outfit thay vì dữ liệu demo, gồm kiểm tra token của đường dẫn công khai; cả 3 test route đạt. Chạy cùng Outfit API: 11/11 đạt; typecheck và build đạt.

- Đã bổ sung liên kết xem tất cả danh mục và vào tủ đồ ở trang chủ; đưa lựa chọn sắp xếp của mẫu vào cửa hàng, báo chưa hỗ trợ và không giả vờ đã sắp xếp. 11 test Shop/Home/Checkout, typecheck và build đạt.

- Tinh chỉnh trang checkout tài khoản với phần địa chỉ và tóm tắt giá theo bố cục mẫu, giữ luồng đặt đơn. 6 test checkout tài khoản và 43 test giỏ/checkout khách/thanh toán đạt; thêm nhóm 30 test API giả lập Outfit/Friends/Chat/Checkout/Admin đạt; typecheck và build đạt. Chưa kiểm thử giao dịch thật.

- Trang cửa hàng hiển thị tiêu đề theo danh mục được chọn và điều chỉnh bộ lọc, phân trang theo mẫu; giữ các tham số API. 22 test Shop/Payment, typecheck và build đạt; chưa kiểm tra trực quan responsive.

- Đồng bộ giao diện đăng ký và xác thực OTP với các trang đăng nhập/khôi phục; email OTP vẫn chỉ đọc. 6 test Auth/Layout, typecheck và build đạt. Công cụ trình duyệt nội bộ bị tắt trong Work settings, chưa kiểm tra trực quan mobile lần này.

- Đã chỉnh biểu mẫu quên/đặt lại mật khẩu theo mẫu và đồng bộ thẻ Outfit của bạn bè với tủ đồ cá nhân; giữ xử lý hiện tại. 12 test Auth/Outfit, typecheck và build đạt; chưa kiểm tra mobile hay phiên BE thật.

- Đã thống nhất hiển thị bạn bè ở danh sách tủ đồ chung theo email và tên hiển thị khi có; 14 test API Outfit/Friends/Chat, typecheck và build đạt. Chưa kiểm tra với phiên đăng nhập thực tế.

- Đã sắp xếp lại trang thanh toán quản trị với hai khu vực COD và lỗi thanh toán, giữ xử lý API; bảng lỗi cho phép cuộn ngang. Bộ lọc thông báo quản trị có thể xuống hàng trên màn hình hẹp. 19 test thanh toán, typecheck và build đạt trước thay đổi class bộ lọc cuối; chưa xác nhận trực quan mobile.

- Chỉnh lại tổng quan quản trị theo nhóm đơn hàng/doanh thu và cửa hàng/người dùng như mẫu; chỉ hiển thị số liệu có sẵn, mục chưa hỗ trợ dùng dấu gạch. Sau chỉnh: 7 test quản trị/modal, typecheck, build đạt. Lần chạy toàn suite trước chỉnh tổng quan: 206 đạt, 59 lỗi; nhiều test thuộc luồng demo/AI cũ, chưa phân loại hết và chưa xác nhận chúng đều là lỗi cũ.

- Biểu mẫu thêm/sửa sản phẩm quản trị dùng bảng trượt bên phải theo mẫu, cuộn được khi nội dung dài; giữ thao tác lưu hiện tại. Hộp thoại dùng chung giữ focus bàn phím bên trong. 5 test chọn lọc qua, typecheck và build qua; chưa xác nhận trực quan trên mobile hoặc dữ liệu thật.

- Đã đối chiếu test quản trị cũ: test tạo danh mục kỳ vọng cập nhật demo local, nhưng luồng hiện gọi API; test đơn hàng cũng kỳ vọng nhãn nút cũ. Bổ sung test mock Commerce kiểm tra lưu danh mục theo phản hồi server và không cập nhật đơn khi API báo lỗi; chỉnh nhãn nút trạng thái khớp trạng thái đích. Nhóm test quản trị mới 4/4 đạt, typecheck và build đạt; test cũ vẫn chưa được chuyển đầy đủ và chưa kiểm thử tài khoản/BE thật.

- Đã chỉnh bố cục bộ lọc, bảng quản lý tài khoản và sản phẩm để phù hợp màn hình hẹp; giữ các API hiện tại. Bổ sung nút tạo tài khoản như mẫu, hiển thị toast chưa hỗ trợ. Các test chọn lọc quản trị/Identity: 8/8 đạt; typecheck và build đạt. Chưa xác nhận trực quan responsive hay test BE thật.
- Chỉnh tiếp bộ lọc và bảng đơn hàng, danh mục, yêu cầu. Build và typecheck đạt. Ba test demo quản trị `creates and deactivates a clothing category`, `filters orders and advances an order status`, `opens order detail with timeline and address snapshot` thất bại do không tìm thấy dữ liệu hoặc thao tác mong đợi; chưa xác định đầy đủ nguyên nhân và chưa coi các luồng này là đã kiểm thử thành công.

- Tiếp tục điều chỉnh chi tiết sản phẩm (ảnh, bộ chọn, bố cục), trang tìm đơn để thanh toán và trang tài khoản theo mẫu; không đổi xử lý API. Nhóm AccountFlow, ProductDetailPage, PaymentPages, PaymentRoutes, OrdersFlow: 32/32 test đạt; typecheck và build đạt. Docker/Gateway đã chạy, nhưng kiểm thử với phiên đăng nhập và dữ liệu thật do người dùng thực hiện sau.

- Đã áp dụng bảng màu, font và thiết kế chung; chuyển khung đăng nhập, trang chủ, các thành phần sản phẩm, Tủ đồ, điều hướng và giao diện quản trị sang phong cách tham chiếu. Trang thanh toán tài khoản và khách đã đổi sang bố cục hai cột; tiếp tục dùng API hiện tại.
- Đã giữ giao diện thông báo/đổi trả với thao tác toast chưa hỗ trợ; các đường dẫn AI hiện tại hiển thị chưa hỗ trợ. Đã loại nội dung gợi ý AI giả tại trang chủ.
- Đã kiểm tra bằng trình duyệt đối với trang chủ và đăng nhập. Đã điều chỉnh danh mục cửa hàng, giao diện Bạn bè/Chat, nhưng chưa đối chiếu đầy đủ tất cả trang desktop/mobile với thiết kế tham chiếu, đặc biệt chi tiết sản phẩm và các biểu mẫu quản trị.
- Sau khi người dùng chọn để BE chạy sau, đã đối chiếu và chỉnh tiếp bố cục giỏ hàng; nhóm test giỏ hàng/checkout/thanh toán có 43 bài qua, typecheck và build qua.
- 65 test liên quan đăng nhập, Friends/Chat/Outfit, Checkout, thanh toán, cửa hàng và các chức năng chưa hỗ trợ đã qua; sau chỉnh sửa tổng quan quản trị, nhóm hồi quy tiếp theo có 30 test qua. Typecheck và build đã qua. Toàn bộ suite chạy giữa đợt sửa có 62 bài lỗi; baseline cũ có 57 lỗi, nhiều bài vẫn kỳ vọng demo/AI cũ. Hai lỗi mới ngoài nhóm AI đã được chạy lại thành công sau khi sửa. Chưa chạy lại toàn bộ suite sau cùng và chưa kiểm thử end-to-end với BE vì Gateway không chạy tại thời điểm kiểm tra.

## Phạm vi và điều kiện

- Chuyển toàn bộ màn hình khách hàng, xác thực và quản trị hiện có; thống nhất màu sắc, kiểu chữ, nút, biểu mẫu, modal và giao diện responsive.
- Giữ BE, dữ liệu và các API đang dùng; giữ các quyền truy cập, trạng thái lỗi, xác nhận và quy tắc nghiệp vụ hiện có. Không copy `.env`, key, token hay dữ liệu của dự án tham chiếu.
- Giữ luồng khách chưa đăng nhập, COD, VietQR, địa chỉ, tài khoản, sản phẩm, đơn hàng và quản trị của dự án hiện tại.
- Giữ Bạn bè, Chat, Tủ đồ, chia sẻ Outfit và Public/Friends/Private; FE tham chiếu không có đủ các màn hình này nên thiết kế cùng phong cách.
- Người dùng xác nhận ngày 07/11: không đưa AI của dự án tham chiếu vào; giữ phần AI hiện tại nhưng khi mở thì hiển thị toast chưa hỗ trợ.
- Người dùng xác nhận ngày 07/11: giữ giao diện các chức năng chưa có ở BE hiện tại, cho phép bấm và hiện toast chưa hỗ trợ; không báo thành công giả.
- Các lệnh Git do người dùng tự chạy. Kiểm tra các thay đổi đang tồn tại trước khi chỉnh sửa, không ghi đè công việc của người khác.

## Các giai đoạn

### 1. Kiểm kê và chuẩn bị

- [ ] Lập bảng đối chiếu từng route hiện tại với trang tham chiếu và các route chỉ có trong EP-06; ghi nhận các chức năng, API và trạng thái trước khi đổi.
- [ ] Kiểm tra kết quả build, typecheck và các test liên quan trước khi sửa; ghi lại lỗi có sẵn để phân biệt với lỗi mới.
- [ ] Chụp màn hình tham chiếu và hiện tại ở desktop và mobile, chọn tài nguyên ảnh/font phù hợp; xác nhận nguồn và điều kiện sử dụng trước khi đưa vào dự án.
- [ ] Trình bày bản xem trước hệ thống màu, typography và một trang đại diện trước khi áp dụng cho cả dự án.

### 2. Nền giao diện và điều hướng

- [ ] Chỉnh token trong `src/index.css`, các component trong `src/shared/ui`, header/footer và layout khách hàng theo thiết kế tham chiếu.
- [ ] Kiểm tra điều hướng hiện có, quyền admin/khách, responsive, bàn phím, focus và độ tương phản; bảo toàn nút Bạn bè, Chat, Tủ đồ và Đăng xuất.

### 3. Khách hàng: trang chủ và mua sắm

- [ ] Chuyển giao diện trang chủ, cửa hàng, lọc, chi tiết sản phẩm, giỏ hàng trong `src/features/home`, `catalog`, `product-detail`, `cart`.
- [ ] Kiểm tra sản phẩm, biến thể, tồn kho, giỏ khách và giỏ tài khoản lấy từ API; thử loading, rỗng và lỗi.

### 4. Tài khoản, địa chỉ và xác thực

- [ ] Chuyển các trang trong `src/features/auth` và `src/features/account` theo giao diện tham chiếu; giữ luồng đăng ký, OTP, đăng nhập, khôi phục mật khẩu và địa chỉ.
- [ ] Kiểm tra sửa hồ sơ, thêm/sửa/xóa địa chỉ, mặc định và tra cứu hành chính; giữ đúng contract địa chỉ hiện tại.

### 5. Đơn hàng và thanh toán

- [ ] Chuyển `src/features/checkout`, `orders` và `payments`; thiết kế đầy đủ cho cả khách và người đã đăng nhập.
- [ ] Kiểm tra giá từ BE, chọn địa chỉ, COD, VietQR, trạng thái chờ/lỗi, phục hồi thao tác và xác nhận đơn. Dùng môi trường test; không tự phát sinh giao dịch tài chính thật.

### 6. EP-06: Tủ đồ, chia sẻ, Bạn bè, Chat

- [ ] Thiết kế lại `src/features/wardrobe`, `outfit-builder`, `sharing`, `friends`, `messages` cho phù hợp phong cách FE tham chiếu; giữ đường dẫn và quyền hiện tại.
- [ ] Kiểm tra tạo/sửa/xóa Outfit, thêm/đổi/xóa món, Private/Friends/Public, link công khai, gửi/chấp nhận lời mời, hủy bạn, chat văn bản và ảnh.
- [ ] Kiểm tra A/B: chỉ bạn bè xem Outfit Friends; Private chỉ chủ xem; hủy bạn thu hồi quyền theo BE. Thử giao diện mobile và khi dịch vụ/ảnh không sẵn sàng.

### 7. Quản trị và thông báo

- [ ] Chuyển layout và các màn hình hiện có trong `src/features/admin`, bao gồm sản phẩm, danh mục, đơn hàng, yêu cầu, khách hàng và thanh toán/COD.
- [ ] Giữ các thao tác thật đang có; không hiển thị chỉ số demo. Các nút đổi/trả, hoàn tiền và thông báo chưa có BE hiển thị toast chưa hỗ trợ khi bấm.
- [ ] Giữ đường dẫn AI hiện tại với toast chưa hỗ trợ; không chuyển AI của dự án tham chiếu.

### 8. Kiểm tra và bàn giao

- [ ] Chạy test phù hợp từng nhóm khi thay đổi, `npm run typecheck` và `npm run build`; so sánh lỗi test với baseline, báo tên lỗi còn lại.
- [ ] Chạy kiểm thử xuyên suốt FE–Gateway–BE với tài khoản test cho đăng nhập, mua hàng, địa chỉ, EP-06 và admin; kiểm tra desktop/mobile, quyền truy cập, lỗi và rỗng.
- [ ] Đối chiếu ảnh trước/sau với giao diện tham chiếu; liệt kê khác biệt có chủ đích, chức năng chưa hỗ trợ và bất kỳ luồng nào chưa kiểm thử được.
- [ ] Người dùng tự thực hiện các lệnh Git nếu muốn commit/push; không thay đổi BE hoặc dữ liệu thật trong quá trình chuyển giao diện.

## Tiêu chí hoàn thành

Tiến độ bổ sung: đã chỉnh trang địa chỉ giao hàng và trang mã đơn đã lưu theo bố cục tham chiếu, giữ các thao tác/API hiện tại. Test AccountFlow và OrdersFlow: 7/7 đạt; typecheck và build đạt. Danh sách đơn vẫn chỉ gồm mã đã lưu trên trình duyệt, xem chi tiết lấy dữ liệu từ API. Chưa kiểm thử với BE đang chạy.

Màn hình hiện tại đồng bộ với phong cách mới trên desktop/mobile; các luồng API và quy tắc hiện tại vẫn hoạt động; không có dữ liệu demo được trình bày như dữ liệu thật; các trạng thái chưa được BE hỗ trợ được ghi rõ. Build/typecheck và các kiểm thử phù hợp có kết quả được báo cáo trung thực.
