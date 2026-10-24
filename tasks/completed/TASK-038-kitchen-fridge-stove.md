# TASK-038

## Title

Thêm loại đồ Tủ lạnh/Bếp — mở rộng sang phòng bếp

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Các loại đồ tự thêm trước đó (TASK-031/033/037) chủ yếu phù hợp phòng khách/phòng ngủ; thêm Tủ lạnh và Bếp để người dùng thiết kế phòng bếp cũng có đồ phù hợp thay vì chỉ có 4 category AI chung chung (seating/table/lighting/storage).

## Scope

- 4 model `.glb` mới (CC0 Kenney, xác nhận header `glTF` + tên material qua đọc JSON chunk trước khi dùng — `kitchenFridge→decor-fridge.glb`, `kitchenFridgeSmall→decor-fridge-2.glb`, `kitchenStove→decor-stove.glb`, `kitchenStoveElectric→decor-stove-2.glb`) vào `frontend/public/furniture/`, cập nhật `CREDITS.txt`. Tên material (`metalLight`/`metalDark`/`metalMedium`/`carpetWhite`...) khớp `enhanceMaterial()` có sẵn (khớp qua `.includes('metal')`/`.includes('wood')`/`.includes('carpet')`) — không cần sửa hàm này.
- `Room3DViewer.jsx`: thêm `fridge`/`stove` vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI` ("Tủ lạnh"/"Bếp"), `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS` — nút "+ Tủ lạnh"/"+ Bếp" tự xuất hiện (UI generic từ TASK-031, không cần sửa JSX).
- `furnitureLayout.js#furnitureSize`: thêm kích thước `fridge` (0.75×1.8×0.7m) và `stove` (0.9×0.9×0.65m).

## Out of scope

- Không thêm category AI thật (backend vẫn chỉ trả 4 category cố định seating/table/lighting/storage) — đây vẫn là loại đồ USER TỰ THÊM, không tính vào chi phí AI.
- Không đổi lại thuật toán chống chồng lấn (đã sửa ở TASK-037, verify lại không hồi quy với 2 món mới này).

## Dependencies

TASK-037 (COMPLETED, cùng đợt tự động nâng cấp) — dùng lại vòng lặp lưới an toàn chống chồng lấn vừa sửa.

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nút "+ Tủ lạnh"/"+ Bếp" xuất hiện trong panel "Nội thất trong phòng", thêm đúng model 3D thật (không phải khối hộp).
- Không chồng lấn với 4 món AI gốc trong kịch bản thêm cả 2 (phòng 5×5m).
- "Đặt lại bố trí" xoá đúng cả 2 món mới thêm.
- Console sạch lỗi.

## Testing

- Script Node độc lập trước khi deploy: 4 món AI gốc + Tủ lạnh + Bếp, phòng 5×5m → 0 cặp chồng lấn.
- Verify E2E qua Docker + browser thật (tài khoản/room "Phòng bếp"/job mới tạo qua API vì JWT phiên cũ hết hạn giữa các round) — click "+ Tủ lạnh" + "+ Bếp":
  - `read_network_requests` xác nhận `decor-fridge-2.glb`/`decor-stove.glb` tải 200.
  - JS đọc trực tiếp toạ độ `<rect>` trong `svg.room2d-plan` (bỏ khung phòng) xác nhận 6 món, 0 cặp chồng lấn.
  - Screenshot + zoom xác nhận tủ lạnh/bếp hiển thị đúng hình dạng thiết bị nhà bếp thật (không phải khối hộp), tách biệt rõ ràng với sofa/bàn/kệ/thảm/cây.
  - "Đặt lại bố trí" xoá đúng về 4 món AI gốc.
  - Console sạch lỗi xuyên suốt.

## Status

COMPLETED
