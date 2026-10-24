# TASK-045

## Title

Thêm loại đồ Tủ đầu giường/Máy giặt

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Sau nhịp cải thiện tương tác/ánh sáng (TASK-040→044), quay lại thêm loại đồ theo đúng tinh thần chỉ đạo gốc ("thêm thật nhiều loại đồ, hình dáng đồ"): Tủ đầu giường (đi cùng Giường — TASK-037) và Máy giặt (phù hợp phòng giặt/phòng tắm tiện ích, mở rộng thêm loại phòng ngoài khách/ngủ/bếp/tắm đã có).

## Scope

- 4 model `.glb` mới (CC0 Kenney, xác nhận header `glTF` + tên material qua đọc JSON chunk trước khi dùng — `cabinetBed→decor-nightstand.glb`, `cabinetBedDrawer→decor-nightstand-2.glb`, `washer→decor-washer.glb`, `dryer→decor-washer-2.glb`) vào `frontend/public/furniture/`, cập nhật `CREDITS.txt`. Tên material đều khớp `enhanceMaterial()` có sẵn (`wood`/`metal`/`metalLight`/`metalMedium`/`metalDark`/`glass`, `_defaultMat` không khớp nhánh nào — giữ nguyên, không lỗi).
- `Room3DViewer.jsx`: thêm `nightstand`/`washer` vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI` ("Tủ đầu giường"/"Máy giặt"), `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS`.
- `furnitureLayout.js#furnitureSize`: thêm kích thước `nightstand` (0.45×0.5×0.4m) và `washer` (0.6×0.85×0.6m).

## Out of scope

- Không thêm category AI thật — vẫn là loại đồ USER TỰ THÊM.
- Không phân biệt máy giặt/máy sấy riêng (2 model dùng chung 1 category `washer`, chọn ngẫu nhiên ổn định theo `pickStaticModel` — đủ đa dạng hình dáng mà không cần thêm category mới).

## Dependencies

TASK-037 (lưới an toàn chống chồng lấn, verify lại không hồi quy).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nút "+ Tủ đầu giường"/"+ Máy giặt" xuất hiện, thêm đúng model 3D thật (không phải khối hộp).
- Không chồng lấn với 4 món AI gốc khi thêm cả 2 (phòng 5×5m).
- "Đặt lại bố trí" xoá đúng cả 2 món mới thêm.
- Console sạch lỗi.

## Testing

- Script Node độc lập trước khi deploy: 4 món AI gốc + Tủ đầu giường + Máy giặt, phòng 5×5m → 0 cặp chồng lấn.
- Verify E2E qua Docker + browser thật (tài khoản/job "Phòng tắm" có sẵn) — click "+ Tủ đầu giường" + "+ Máy giặt":
  - `read_network_requests` xác nhận `decor-nightstand.glb`/`decor-washer-2.glb` tải 200.
  - JS đọc trực tiếp toạ độ `<rect>` trong `svg.room2d-plan` (bỏ khung phòng) xác nhận 6 món, 0 cặp chồng lấn.
  - Screenshot + zoom xác nhận máy giặt hiển thị đúng hình dạng máy có cửa tròn, tủ đầu giường đúng hình hộp nhỏ có ngăn kéo, tách biệt rõ ràng.
  - "Đặt lại bố trí" xoá đúng về 4 món AI gốc.
  - Console sạch lỗi xuyên suốt.

## Status

COMPLETED
