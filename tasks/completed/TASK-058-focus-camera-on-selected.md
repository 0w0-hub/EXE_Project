# TASK-058

## Title

Phóng to camera vào món nội thất đang chọn

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Tận dụng hạ tầng "chọn 1 món" (TASK-040) — hiện chỉ dùng để tinh chỉnh bằng bàn phím/nhuộm màu; thêm khả năng phóng camera lại gần món đang chọn để xem chi tiết model, bổ sung cho 2 nút góc nhìn nhanh có sẵn (TASK-034).

## Scope

- `Room3DViewer.jsx`: thêm `focusOnSelected()` — tính lại vị trí món đang chọn bằng đúng hàm thuần `resolveFurniturePositions`/`furnitureSize` (không cần đọc trực tiếp mesh Three.js, vốn chỉ tồn tại bên trong effect dựng scene — dùng được ngay không phụ thuộc effect có rebuild lại hay không), rồi đặt camera/controls qua ref (giống `setTopView`/`resetView`, không rebuild scene).
- Nút "🔍 Phóng to món đã chọn" mới trong hàng nút công cụ — `disabled` khi chưa chọn món nào (kèm `title` gợi ý), bật lại ngay khi có món được chọn.

## Out of scope

- Không tự động phóng to khi vừa chọn (chỉ khi user chủ động bấm nút) — tránh giật camera đột ngột ngoài ý muốn khi chỉ đang thử nhấp qua các món.
- Không đổi `setTopView`/`resetView` có sẵn — 3 nút góc nhìn tồn tại song song, phục vụ nhu cầu khác nhau.

## Dependencies

TASK-034 (mẫu điều khiển camera qua ref, không rebuild scene), TASK-040 (hạ tầng chọn món).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Chưa chọn món nào → nút "Phóng to món đã chọn" hiện mờ (disabled), có tooltip gợi ý.
- Chọn 1 món → nút bật lại, bấm vào → camera zoom sát đúng món đó.
- "Đặt lại góc nhìn" sau đó → camera khôi phục đúng góc nhìn mặc định ban đầu.
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (phòng 1.5×5.0m có sẵn):
- Chưa chọn gì → xác nhận nút "Phóng to món đã chọn" ở trạng thái mờ qua screenshot.
- Nhấp chọn "Kệ/tủ lưu trữ" → nút sáng lại; bấm nút → screenshot xác nhận camera zoom sát đúng món kệ/tủ (kích thước lớn hơn hẳn trong khung hình, các món khác lùi ra ngoài tầm nhìn).
- Bấm "Đặt lại góc nhìn" → screenshot xác nhận camera về đúng góc nhìn mặc định ban đầu.
- Console sạch lỗi xuyên suốt.

## Status

COMPLETED
