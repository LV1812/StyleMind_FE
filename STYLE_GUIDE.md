# Chỉnh giao diện StyleMind

CSS chung nằm trong `src/index.css`, được nạp một lần tại `src/main.tsx`.
Khối `@theme static` ở đầu file là nơi chỉnh màu sắc, font, bo góc và bóng đổ.
Các màn hình đang dùng trong `src/App.tsx` và component dùng chung đã tham chiếu các biến này.

## Đổi màu

| Biến trong `src/index.css` | Áp dụng cho |
| --- | --- |
| `--color-accent` | Màu thương hiệu, nút chính, liên kết, viền khi chọn hoặc focus |
| `--color-blush` | Nền hồng nhạt của khối tư vấn, mục đang chọn |
| `--color-ivory` | Nền trang và thanh điều hướng |
| `--color-surface` / `--color-surface-soft` | Nền thẻ, biểu mẫu, hộp thoại |
| `--color-sand` / `--color-sand-dark` | Nền trung tính và đường viền |
| `--color-charcoal` / `--color-ink` | Tiêu đề và nội dung chính |
| `--color-secondary` / `--color-muted` | Nội dung phụ, chú thích |
| `--color-on-accent` | Chữ và biểu tượng trên nền đậm |
| `--color-success`, `--color-warning`, `--color-error` | Màu trạng thái; chỉnh thêm các biến `-bg` để đổi nền tương ứng |
| `--color-canvas` / `--color-divider` | Nền và đường phân cách của trang quản trị |

Ví dụ, sửa ngay giá trị hiện có trong `@theme static`:

```css
--color-accent: #345A73;
--color-blush: #E8F0F5;
```

Nút chính, liên kết và viền đang chọn sẽ chuyển sang xanh. Nền khối tư vấn chuyển sang xanh nhạt.
Các mức trong suốt, gradient và bóng nút dùng cùng biến nên cũng cập nhật theo.

## Font, bo góc và bóng đổ

- Font nội dung: `--font-sans`. Font tiêu đề: `--font-display` và `--font-serif`.
  Khi đổi sang font khác, cập nhật cả `@import` Google Fonts đầu file và chọn font hỗ trợ tiếng Việt.
- Bo góc thẻ phổ biến: `--radius-2xl` và `--radius-3xl`.
  Ví dụ `--radius-2xl: 0.75rem;` sẽ áp dụng cho các phần dùng `rounded-2xl`.
- Bóng nút: `--shadow-button`, `--shadow-button-ai`.
  Bóng thẻ: `--shadow-card`, `--shadow-card-elevated`.
  Các lớp `shadow-sm`, `shadow-md`, `shadow-lg`... cũng có biến tương ứng trong CSS chung.

## Khi thêm màn hình hoặc component

Dùng tên màu của theme trong Tailwind:

```tsx
<div className="rounded-2xl border border-sand bg-surface p-6 text-charcoal">
  <p className="text-secondary">Nội dung phụ</p>
  <button className="bg-accent text-on-accent hover:bg-accent/90">
    Tiếp tục
  </button>
</div>
```

Nếu cần inline style, tham chiếu biến thay vì ghi mã màu trực tiếp:

```tsx
<div style={{ backgroundColor: 'var(--color-surface)' }} />
```

Ưu tiên các component có sẵn trong `src/components/ui` như `Button`, `Card`, `IconButton`, `Badge`.
Màu sản phẩm, màu quần áo, bảng màu phối đồ và màu người dùng chọn là dữ liệu riêng;
không đổi chúng thành màu theme để tránh đổi màu quần áo khi đổi giao diện.

`@theme static` giữ các biến trong CSS đầu ra, kể cả biến chỉ được dùng bằng inline style.
Sau khi chỉnh, kiểm tra bằng `npm run build` và `npx tsc --noEmit`.
