// These context choices are suggestions for the API's free-text context fields.
export const STYLIST_CONTEXT_FIELDS = [
  { key: 'occasion', label: 'Dịp mặc', placeholder: 'Chọn dịp mặc', options: ['Đi làm', 'Đi chơi cuối tuần', 'Hẹn hò', 'Dự tiệc', 'Du lịch', 'Tập luyện'] },
  { key: 'intendedUse', label: 'Mục đích sử dụng', placeholder: 'Chọn mục đích sử dụng', options: ['Hằng ngày', 'Làm việc, văn phòng', 'Dạo phố, gặp bạn bè', 'Sự kiện, gặp gỡ', 'Vận động, thể thao'] },
  { key: 'style', label: 'Phong cách mong muốn', placeholder: 'Chọn phong cách', options: ['Thanh lịch', 'Tối giản', 'Casual, trẻ trung', 'Năng động', 'Thể thao', 'Nữ tính'] },
  { key: 'weather', label: 'Thời tiết / bối cảnh', placeholder: 'Chọn thời tiết / bối cảnh', options: ['Trời nóng', 'Trời mát', 'Trời lạnh', 'Mưa, ẩm', 'Trong nhà, có điều hòa'] },
] as const

// Canonical values accepted by the current reviewed Stylist catalog policy.
export const STYLIST_COLOR_OPTIONS = [
  { value: 'black', label: 'Đen', swatch: '#222222' },
  { value: 'white', label: 'Trắng', swatch: '#FFFFFF' },
  { value: 'gray', label: 'Xám', swatch: '#8A8B8D' },
  { value: 'beige', label: 'Be', swatch: '#D3BE9B' },
  { value: 'pink', label: 'Hồng', swatch: '#D991AD' },
  { value: 'blue', label: 'Xanh dương', swatch: '#3F76B5' },
  { value: 'green', label: 'Xanh lá', swatch: '#4E7656' },
  { value: 'navy', label: 'Xanh navy', swatch: '#263B57' },
] as const

export type StylistColor = typeof STYLIST_COLOR_OPTIONS[number]['value']
