# TASK-055

## Title

Gom nhóm nút "+ thêm nội thất" theo phòng

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Sau nhiều round thêm loại đồ liên tiếp (TASK-037→054), danh sách nút "+ thêm" đã lên tới 23 mục, dàn thành 1 khối nút phẳng rối mắt, khó tìm đúng loại cần thêm. Đây là hệ quả trực tiếp của việc mở rộng quá nhiều loại đồ — cần dọn lại UX trước khi tiếp tục thêm nữa.

## Scope

- `Room3DViewer.jsx`: thêm `FURNITURE_GROUPS` (5 nhóm: Cơ bản, Phòng khách/chung, Phòng ngủ, Phòng bếp/ăn, Phòng tắm/giặt) map từng category vào đúng nhóm phòng phù hợp.
- `OTHER_CATEGORIES` — tính tự động các category CHƯA được gán vào nhóm nào (an toàn cho tương lai: nếu quên thêm 1 category mới vào `FURNITURE_GROUPS`, nút vẫn hiện ở nhóm "Khác" thay vì biến mất âm thầm).
- JSX: render nút theo từng nhóm có tiêu đề nhỏ (`.room3d-furniture-group-label`, chữ hoa, màu nhạt) thay vì 1 khối phẳng.
- `styles.css`: thêm `.room3d-furniture-group-label`.

## Out of scope

- Không đổi hành vi `addFurniture`/dữ liệu — thuần sắp xếp lại hiển thị.
- Không thêm tìm kiếm/lọc bằng text (23 mục dưới 5 nhóm đã đủ dễ quét, chưa cần thêm độ phức tạp của ô tìm kiếm).

## Dependencies

Toàn bộ chuỗi task thêm loại đồ (TASK-031→054) — lý do trực tiếp khiến cần task này.

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- 23 nút hiện đủ, chia đúng 5 nhóm có tiêu đề rõ ràng, không nhóm nào rỗng, không có category nào bị rơi vào "Khác" (đã gán đủ 23/23 vào 5 nhóm).
- Bấm nút trong nhóm bất kỳ vẫn thêm đúng món như trước (không đổi hành vi).
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật:
- JS đọc trực tiếp `.room3d-furniture-group-label` + đếm nút `.secondary` trong panel → xác nhận đủ 5 nhãn nhóm ("Cơ bản"/"Phòng khách/chung"/"Phòng ngủ"/"Phòng bếp/ăn"/"Phòng tắm/giặt"), tổng 23 nút, không nhóm "Khác" nào xuất hiện (toàn bộ category đã được gán nhóm đầy đủ).
- Screenshot xác nhận layout trực quan rõ ràng, dễ quét hơn hẳn so với khối 23 nút phẳng trước đó.
- Bấm "+ Bàn làm việc" (trong nhóm "Phòng ngủ") → xác nhận thêm đúng "Bàn làm việc (mới thêm)" vào danh sách, không hồi quy hành vi.
- Console sạch lỗi.

## Status

COMPLETED
