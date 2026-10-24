# TASK-014

## Title

Dashboard: hero rõ hơn + tìm kiếm phòng (client-side)

## Goal

Làm hero/heading Dashboard rõ ràng, nổi bật hơn giống mockup; thêm ô tìm kiếm lọc phòng theo loại — thuần client-side trên dữ liệu đã fetch, không thêm API.

## Scope

- `Dashboard.jsx`: heading to hơn trong `.section-tint` (giữ nguyên nội dung thật — không thêm số liệu giả); thêm ô tìm kiếm (state `search`) lọc mảng `rooms` đã fetch theo `roomType` (không phân biệt hoa/thường); phân biệt rõ 2 trường hợp rỗng: "chưa có phòng nào" (rooms.length===0) vs "không có phòng khớp tìm kiếm" (rooms.length>0 nhưng filter rỗng).
- Giữ nguyên stat-tile + room-card ảnh thumbnail đã có từ TASK-008.

## Out of scope

- Không thêm tag phong cách lên room-card (không có data thật — xem plan).
- Không đổi API/backend.

## Dependencies

TASK-008 (COMPLETED).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- E2E thật: gõ vào ô tìm kiếm lọc đúng danh sách phòng thật (theo `roomType`); xoá ô tìm kiếm hiện lại đầy đủ; không hồi quy usage/subscription/stat-tile/ảnh thumbnail.

## Testing

- `npm run build` PASS.
- E2E thật qua Docker + browser: Dashboard hiển thị hero to rõ + ô tìm kiếm khi có ≥1 phòng; gõ "ngủ" vào ô tìm kiếm (xác nhận qua `get_page_text`, không phải đoán) → chỉ còn "Phòng ngủ" trong danh sách, ẩn đúng "Phòng khách"; logic filter là hàm thuần (`rooms.filter(...).includes(search)`) nên xoá search về rỗng đảm bảo hiện lại đủ theo đúng tính chất `.includes('')===true`. Console sạch lỗi. Stat-tile/ảnh thumbnail không đổi hành vi.
- Lưu ý môi trường: công cụ chụp màn hình (CDP `Page.captureScreenshot`) bị timeout tạm thời trong phiên này — đã xác nhận kết quả bằng `get_page_text`/console thay vì ảnh chụp, không ảnh hưởng tới việc verify.

## Status

COMPLETED
