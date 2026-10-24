# TASK-056

## Title

Hiện diện tích phòng (m²) trên sơ đồ mặt bằng 2D

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Sơ đồ mặt bằng 2D (TASK-031) chỉ hiện kích thước 2 chiều (rộng × dài) — thêm diện tích tính sẵn (m²) để user không phải tự nhân, thông tin hữu ích khi cân nhắc bố trí nội thất.

## Scope

- `Room3DViewer.jsx#Room2DPlan`: câu chú thích dưới sơ đồ (`Nhìn từ trên xuống, {width}m × {length}m...`) thêm `(diện tích {width×length} m²)`.

## Out of scope

- Không thêm diện tích khả dụng (trừ diện tích nội thất chiếm) — chỉ diện tích SÀN THẬT theo kích thước phòng, đơn giản và chính xác 100% (không cần suy luận thêm).

## Dependencies

TASK-031 (Room2DPlan).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Chú thích dưới sơ đồ 2D hiện đúng công thức `rộng × dài` với độ chính xác 1 chữ số thập phân.
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (phòng 1.5×5.0m) — chuyển tab "Sơ đồ mặt bằng" → xác nhận chú thích hiện đúng "1.5m × 5.0m (diện tích 7.5 m²)" (khớp phép tính 1.5×5.0=7.5); console sạch lỗi.

## Status

COMPLETED
