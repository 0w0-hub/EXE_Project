# TASK-068

## Title

Thêm 2 loại đồ mới: Máy xay sinh tố, Bồn rửa bát

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Mở rộng thêm loại đồ từ phần kho model Kenney Furniture Kit chưa dùng — máy xay sinh tố là phụ kiện bếp nhỏ đi cùng lò vi sóng/máy pha cà phê/máy nướng bánh mì đã có; bồn rửa bát là loại đồ MỚI, khác hẳn "Bồn rửa mặt" (category `sink`, TASK-062) cả về hình dáng (có tủ gỗ bên dưới, chiều sâu lớn hơn) lẫn ngữ cảnh sử dụng (bếp, không phải phòng tắm).

## Scope

- `frontend/public/furniture/decor-blender.glb` (nguồn `kitchenBlender.glb`), `decor-kitchensink.glb` (nguồn `kitchenSink.glb`) — cả 2 xác nhận header `glTF` hợp lệ, material name khớp quy ước hiện có, checksum không trùng bất kỳ file nào đã dùng trước đó.
- `Room3DViewer.jsx`: thêm category `blender`, `kitchensink` (cả 2 vào nhóm "Phòng bếp/ăn") vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI`, `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS`, `FURNITURE_GROUPS`.
- `furnitureLayout.js#furnitureSize`: thêm kích thước `blender` (0.25×0.4×0.25, nhỏ gọn) và `kitchensink` (0.7×0.85×0.55, gắn tường có tủ dưới nên sâu hơn `sink` phòng tắm ở TASK-062 vốn chỉ 0.45m).
- `CREDITS.txt` cập nhật nguồn 2 file mới.

## Out of scope

- Không gộp `kitchensink` và `sink` (bồn rửa mặt) thành 1 category chung — cố tình tách riêng vì khác hẳn hình dáng/kích thước/ngữ cảnh, gộp lại sẽ gây nhầm lẫn khi user muốn thêm đúng loại bồn rửa phù hợp phòng.

## Dependencies

TASK-031 (hạ tầng loại đồ tự thêm), TASK-055 (`FURNITURE_GROUPS`), TASK-062 (category `sink` — điểm đối chiếu để phân biệt rõ với `kitchensink` mới).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Script Node độc lập xác nhận không có chồng lấn mới ở phòng thực tế lẫn phòng hẹp tối thiểu.
- 2 nút "+ Máy xay sinh tố"/"+ Bồn rửa bát" xuất hiện đúng nhóm "Phòng bếp/ăn".
- Dòng tóm tắt tổng số món/chi phí (TASK-067) cập nhật đúng khi thêm cả 2.
- Tab "Sơ đồ mặt bằng" hiển thị đủ số món, 0 cặp chồng lấn.
- "Đặt lại bố trí" khôi phục đúng về 4 món AI gốc.
- Console sạch lỗi.

## Testing

- Script Node độc lập (`furnitureLayout.js`): 4 món AI gốc + blender/kitchensink, phòng 5×5m → 0 chồng lấn; phòng hẹp 1.5×5m → 0 chồng lấn.
- Verify E2E qua Docker + browser thật (tài khoản `task062-tester`, re-login vì JWT + backend restart giữa round, job "Phòng bếp test 062") — 2 nút đúng nhóm "Phòng bếp/ăn"; thêm "Máy xay sinh tố" → dòng tóm tắt đúng "5 món · tổng ước tính 25.200.000 đ"; thêm tiếp "Bồn rửa bát" → đúng "6 món · tổng ước tính 29.700.000 đ"; console sạch lỗi trong suốt quá trình tải model; screenshot xác nhận cả 2 hiện trong scene kèm nhãn tên+giá đúng; chuyển tab "Sơ đồ mặt bằng", JS đọc trực tiếp toạ độ `<rect>` xác nhận đúng 6 món, 0 cặp chồng lấn; "Đặt lại bố trí" khôi phục đúng 4 món AI gốc; console sạch lỗi xuyên suốt.

## Status

COMPLETED
