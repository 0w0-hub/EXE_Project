# TASK-051

## Title

Thêm loại đồ Quầy bar/Ghế quầy bar

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Thêm thẩm mỹ "quầy bar bếp" (kitchen bar/breakfast bar) — khác hẳn bàn ăn thông thường (category `table` có sẵn) hay ghế sofa/ghế bành (category `seating`), phù hợp phòng bếp/phòng khách kiểu mở hiện đại.

## Scope

- 3 model `.glb` mới (CC0 Kenney, xác nhận header `glTF` + tên material trước khi dùng — `wood`/`woodDark`/`metal`/`carpet`, khớp `enhanceMaterial()` có sẵn):
  - `kitchenBar.glb` → `decor-barcounter.glb`
  - `stoolBar.glb` → `decor-barstool.glb`, `stoolBarSquare.glb` → `decor-barstool-2.glb`
- `Room3DViewer.jsx`: thêm `barcounter`/`barstool` vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI` ("Quầy bar"/"Ghế quầy bar"), `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS`.
- `furnitureLayout.js#furnitureSize`: thêm kích thước `barcounter` (1.3×0.95×0.55m — quầy dài, cao ngang thắt lưng) và `barstool` (0.35×0.75×0.35m — ghế cao chân đơn, nhỏ gọn).

## Out of scope

- Không thêm category AI thật — vẫn là loại đồ USER TỰ THÊM.
- Không giới hạn số ghế quầy bar có thể thêm (user tự quyết định số lượng phù hợp quầy).

## Dependencies

TASK-037 (lưới an toàn chống chồng lấn, verify lại không hồi quy).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nút "+ Quầy bar"/"+ Ghế quầy bar" xuất hiện, thêm đúng model 3D thật (không phải khối hộp).
- Không chồng lấn với 4 món AI gốc khi thêm cả 2 (phòng 5×5m).
- "Đặt lại bố trí" xoá đúng cả 2 món mới thêm.
- Console sạch lỗi.

## Testing

- Script Node độc lập trước khi deploy: 4 món AI gốc + Quầy bar + Ghế quầy bar, phòng 5×5m → 0 cặp chồng lấn.
- Verify E2E qua Docker + browser thật (job "Phòng khách" có sẵn) — click "+ Quầy bar" + "+ Ghế quầy bar":
  - `read_network_requests` xác nhận `decor-barcounter.glb`/`decor-barstool.glb` tải 200.
  - Screenshot + zoom xác nhận quầy bar hiển thị đúng hình quầy có mặt bàn dài, ghế quầy bar hiển thị đúng hình ghế cao chân đơn, tách biệt rõ ràng với các món khác.
  - Chuyển tab "Sơ đồ mặt bằng", JS đọc trực tiếp toạ độ `<rect>` xác nhận 6 món, 0 cặp chồng lấn.
  - "Đặt lại bố trí" xoá đúng về 4 món AI gốc.
  - Console sạch lỗi xuyên suốt.

## Status

COMPLETED
