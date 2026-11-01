# Thiết kế Admin MVP StyleMind

**Ngày:** 2026-10-05

**Trạng thái:** Đã chốt phạm vi MVP trong trao đổi với người dùng.

## Mục tiêu

Hoàn thiện khu vực Admin đủ để demo nghiệp vụ quản trị chính của StyleMind sau khi phần Customer đã hoàn thành. Admin dùng cùng mock store với Customer, thao tác cập nhật dữ liệu thật trong demo, toàn bộ nội dung giao diện hiển thị bằng tiếng Việt, còn tên file, route, component, type, action và biến trong code giữ tiếng Anh.

## Phạm vi MVP

Admin MVP bao gồm:

- Dashboard quản trị với tổng user, sản phẩm, đơn hàng, doanh thu, trạng thái đơn, thanh toán, hủy/đổi trả.
- AI analytics với số outfit, outfit AI/thủ công, lượt AI generate/replace, sản phẩm AI thêm vào giỏ, đơn từ AI recommendation, outfit share email/public link.
- Quản lý user: tìm kiếm, lọc role/trạng thái, xem thông tin, khóa/mở khóa tài khoản. Admin đang đăng nhập không thể tự khóa mình.
- Quản lý danh mục: danh sách danh mục quần áo nữ, thêm/sửa cơ bản, bật/tắt active.
- Quản lý sản phẩm: tìm kiếm/lọc, thêm/sửa thông tin cơ bản, metadata thời trang, variant, ảnh theo màu bằng URL, bật/tắt Product ACTIVE/INACTIVE, bật/tắt Variant ACTIVE/INACTIVE.
- Quản lý đơn hàng: danh sách, lọc theo trạng thái/thanh toán, xem chi tiết, chuyển trạng thái hợp lệ.
- Quản lý yêu cầu hủy đơn: duyệt/từ chối, cập nhật request, order và notification của Customer trong cùng action.
- Quản lý yêu cầu đổi/trả/hoàn tiền: xem item/reason, duyệt/từ chối, xử lý refund giả lập khi đủ điều kiện, cập nhật notification.
- AI management: quản lý style, occasion, pattern, fit, material, color và compatibility rule ở mức danh sách/thêm/sửa/bật/tắt demo.

## Ngoài phạm vi

- Không quản lý tồn kho, nhập kho, xuất kho, low stock, warehouse hoặc inventory transaction.
- Không upload file thật lên server; ảnh admin thêm trong demo dùng URL.
- Không thêm backend/API thật.
- Không triển khai phân quyền chi tiết hơn role `admin`.
- Không mở rộng nghiệp vụ tủ đồ ngoài các dữ liệu đã có trong Customer phase.

## Kiến trúc

Tạo feature mới `src/features/admin` theo feature structure hiện tại:

```text
src/features/admin/
  components/
  model/
  pages/
  index.ts
```

Router thay `/admin` từ `AdminAccessPage` tạm thời thành Admin layout/page mới, được bảo vệ bằng `AuthGuard roles={['admin']}`. Admin dùng navigation nội bộ bằng query/tab state hoặc nested route tối thiểu trong cùng `/admin` cho MVP, ưu tiên reload vẫn hiển thị dashboard an toàn.

`src/app/store/types.ts` và `src/app/store/demoReducer.ts` thêm các action admin cần thiết:

- `admin/userStatusChanged`
- `admin/categoryUpserted`
- `admin/categoryStatusChanged`
- `admin/productUpserted`
- `admin/productStatusChanged`
- `admin/variantStatusChanged`
- `admin/orderStatusChanged`
- `admin/cancellationReviewed`
- `admin/returnReviewed`
- `admin/fashionMetadataOptionUpserted`
- `admin/fashionMetadataOptionStatusChanged`
- `admin/compatibilityRuleUpserted`
- `admin/compatibilityRuleStatusChanged`

Các action review hủy/đổi trả phải tạo notification cho customer để màn Customer đang dùng cùng mock data nhìn thấy kết quả.

## UX

Admin là giao diện làm việc gọn, yên tĩnh, ưu tiên scan dữ liệu và thao tác lặp lại. Dùng sidebar riêng, topbar có tài khoản admin và nút đăng xuất. Bảng trên desktop chuyển thành list card có cấu trúc trên mobile. Không dùng text tiếng Anh trong UI đang hoạt động. Các nút nguy hiểm dùng modal/inline confirmation hoặc trạng thái rõ ràng, không dùng `window.alert()` hoặc `window.confirm()`.

Các màn MVP:

- **Tổng quan:** KPI, phân bố trạng thái đơn, doanh thu gần đây, panel AI analytics, yêu cầu cần duyệt.
- **Sản phẩm:** bảng/list sản phẩm, tìm kiếm/lọc, panel thêm/sửa, biến thể và ảnh theo màu.
- **Danh mục:** bảng danh mục quần áo nữ, thêm/sửa/bật/tắt.
- **Đơn hàng:** bảng đơn, chi tiết đơn, timeline, chuyển trạng thái.
- **Yêu cầu:** tab hủy đơn và đổi/trả, approve/reject/refund.
- **Khách hàng:** bảng user, detail, khóa/mở khóa.
- **AI:** tab metadata và compatibility rules.

## Dữ liệu

Seed hiện có đã có users, products, categories, orders, notifications, outfits, shares, cancellationRequests, returnRequests, fashionMetadata, compatibilityRules và aiMetrics. Admin MVP sử dụng dữ liệu đó, bổ sung seed tối thiểu nếu cần để dashboard/request không trống khi demo mới reset.

## Kiểm thử

Thêm kiểm thử theo TDD:

- Reducer test cho khóa user, bật/tắt product/variant, chuyển trạng thái order, duyệt hủy/trả và notification.
- Route/flow test cho đăng nhập admin hiển thị dashboard.
- Admin UI test cho ít nhất một thao tác product, một thao tác order/request và một thao tác user.

Verification cuối phase:

- `cmd /c npm test`
- `cmd /c npm run typecheck`
- `cmd /c npm run build`

## Tiêu chí hoàn thành

- `/admin` không còn là màn handoff tạm thời.
- Admin đăng nhập bằng `admin@stylemind.vn` / `Admin123!` có thể thao tác dữ liệu demo.
- Customer nhìn thấy tác động từ admin ở đơn hàng, request hoặc notification.
- Toàn bộ UI active của admin là tiếng Việt.
- Không có chức năng tồn kho/warehouse active.
- Test, typecheck và build pass.
