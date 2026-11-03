# Ghép EP06 vào FE-1

FE-1 là nền, giữ IdentityAuthProvider và CommerceProvider. Các route và API Friends, Outfit Sharing, Chat được đưa từ EP06 sang; store và selector kết hợp hai bên. EP06 đọc phiên Identity, thử refresh khi API trả 401 và kết nối lại Chat khi token đổi. Proxy Vite thêm `/wardrobe-community` có WebSocket.

Chế độ EP06 API cần `VITE_COMMUNITY_MODE=api` trong cấu hình FE; `.env.example` có ví dụ. Khi dùng API, Gateway phải sẵn sàng và origin WebSocket phải được backend cho phép. Không tự bật gửi email, database hoặc cloud thật trong kiểm thử.

Trước khi ghép, FE-1 typecheck và build đạt; bộ test có 18 lỗi (16 Admin, 2 smoke Commerce/customer). Sau khi ghép, test độc lập EP06 gồm 55 test đã đạt; typecheck và build đạt. Bộ test đầy đủ đạt 153/171, còn cùng 18 test lỗi đã xuất hiện trước khi ghép. Chưa kiểm tra end-to-end với Gateway thật. Các API giao diện EP06 đã mở lại chín test sử dụng backend giả lập.

Các file source trước khi ghép được lưu tại `E:/mss/du-an/.superpowers/implementation/ep06-fe1-before-20261103`.
