# TASK-059

## Title

Thêm loại đồ Máy hút mùi/Laptop

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Thêm 2 phụ kiện đi cùng loại đồ đã có: Máy hút mùi (đi cùng Bếp — TASK-038) và Laptop (đi cùng Bàn làm việc — TASK-037), thay vì chỉ thêm đồ đứng độc lập.

## Scope

- 2 model `.glb` mới (CC0 Kenney, xác nhận header `glTF` + tên material trước khi dùng — `metalMedium`/`_defaultMat` (hood, "_defaultMat" không khớp nhánh nào, giữ nguyên, không lỗi) và `metalDark`/`metal`/`metalMedium` (laptop, đều khớp `enhanceMaterial()`)):
  - `hoodModern.glb` → `decor-hood.glb`
  - `laptop.glb` → `decor-laptop.glb`
- `Room3DViewer.jsx`: thêm `hood`/`laptop` vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI` ("Máy hút mùi"/"Laptop"), `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS`; thêm vào đúng nhóm trong `FURNITURE_GROUPS` (TASK-055) — `hood` vào "Phòng bếp/ăn", `laptop` vào "Phòng ngủ" (cùng nhóm với `desk`).
- `furnitureLayout.js#furnitureSize`: thêm kích thước `hood` (0.9×0.3×0.5m) và `laptop` (0.35×0.05×0.25m — rất mỏng, đặt trên bàn).

## Out of scope

- Không thêm category AI thật — vẫn là loại đồ USER TỰ THÊM.
- Không tự động đặt vị trí "trên bàn" (laptop vẫn dùng heuristic vị trí text như mọi món khác, không có logic ghép cặp vật lý với desk).

## Dependencies

TASK-037 (desk), TASK-038 (stove — hood đi cùng nhóm bếp), TASK-055 (nhóm nút "+ thêm").

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nút "+ Máy hút mùi" xuất hiện đúng trong nhóm "Phòng bếp/ăn", "+ Laptop" trong nhóm "Phòng ngủ".
- Thêm đúng model 3D thật, không chồng lấn với 4 món AI gốc kể cả ở phòng rộng tối thiểu 1.5m.
- "Đặt lại bố trí" xoá đúng cả 2 món mới thêm.
- Console sạch lỗi.

## Testing

- Script Node độc lập trước khi deploy: 4 món AI gốc + Máy hút mùi + Laptop, phòng 1.5×5.0m (rộng tối thiểu) → 0 cặp chồng lấn.
- Verify E2E qua Docker + browser thật (phòng 1.5×5.0m có sẵn) — xác nhận nút đúng nhóm; click "+ Máy hút mùi" + "+ Laptop":
  - `read_network_requests` xác nhận `decor-hood.glb`/`decor-laptop.glb` tải 200.
  - Zoom screenshot xác nhận laptop hiển thị đúng hình dạng nắp mở nhỏ gọn.
  - Chuyển tab "Sơ đồ mặt bằng", JS đọc trực tiếp toạ độ `<rect>` xác nhận 6 món, 0 cặp chồng lấn.
  - "Đặt lại bố trí" xoá đúng về 4 món AI gốc.
  - Console sạch lỗi xuyên suốt.

## Status

COMPLETED
