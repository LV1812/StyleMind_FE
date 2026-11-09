# Đề xuất hợp đồng Commerce cho giỏ hàng và mua ngay

Tài liệu đề xuất để chủ sở hữu Commerce xem xét; chưa thay đổi BE. Giữ nguyên API hiện tại cho client cũ và kiểm tra hợp đồng trước khi triển khai.

## Sản phẩm ngừng bán

- Bổ sung cách đọc danh mục và chi tiết cho phép hiển thị sản phẩm INACTIVE, kèm trạng thái và các biến thể cần thiết; không công khai dữ liệu sản phẩm bị xóa hoặc ẩn vì lý do khác khi chưa có quy tắc rõ ràng.
- Trả `product_id` và trạng thái khả dụng thực tế cho từng dòng giỏ, bao gồm sản phẩm/biến thể ngừng bán, để FE nhóm các biến thể theo sản phẩm và hiện Hết hàng. Phân biệt trạng thái không bán, hết tồn kho và lỗi dịch vụ.
- Các thao tác thêm và đặt hàng tiếp tục từ chối sản phẩm không thể mua. Không dựa vào trạng thái trên FE như kiểm soát cuối cùng.

## Chọn món trong giỏ

- Bổ sung hợp đồng preview và checkout có danh sách `cart_item_ids`; không đổi ý nghĩa API checkout hiện đang đặt toàn bộ giỏ.
- Kiểm tra từng dòng thuộc giỏ của đúng tài khoản hoặc đúng phiên khách, không trùng ID; kiểm tra giá, trạng thái, tồn kho và địa chỉ tại máy chủ.
- Ghi đơn, giữ/giảm tồn kho và cập nhật chỉ các dòng đã chọn trong cùng transaction. Các dòng không chọn còn nguyên. Ràng buộc idempotency vào toàn bộ nội dung yêu cầu và cách khôi phục kết quả chưa xác định.

## Mua ngay

- Bổ sung preview và checkout trực tiếp từ `variant_id`, `quantity`, địa chỉ, phương thức và khóa idempotency; không thêm vào hay xóa giỏ hiện có.
- Áp dụng cùng kiểm tra quyền, trạng thái, giá, tồn kho, đặt hàng và thanh toán như checkout thông thường; xử lý đồng thời, retry và kết quả chưa xác định.

## Kiểm thử đề nghị

- Các biến thể cùng sản phẩm tính đúng một sản phẩm kể cả khi sản phẩm bị tắt; lỗi tra cứu không bị coi là hết hàng.
- Chọn một phần giỏ, sở hữu sai, giá/tồn thay đổi, request trùng và retry; xác nhận dòng không chọn được giữ nguyên.
- Mua ngay không thay đổi giỏ, kể cả khi lỗi hoặc request bị lặp; kiểm tra tài khoản và khách nếu cả hai đều được hỗ trợ.
