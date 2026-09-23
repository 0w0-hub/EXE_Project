# TASK-057

## Title

Thêm loại đồ Gối tựa/Sách trang trí

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Thêm 2 món trang trí nhỏ (Gối tựa, Sách trang trí) đi kèm sofa/kệ sách có sẵn — tăng cảm giác "có người ở" cho không gian, đúng tinh thần "thêm thật nhiều loại đồ, hình dáng đồ".

## Scope

- 2 model `.glb` mới (CC0 Kenney, xác nhận header `glTF` + tên material trước khi dùng — `carpet` (pillow, khớp `enhanceMaterial()`) và `carpetDarker`/`carpetWhite`/`plant`/`metal` (books — "carpetDarker" khớp qua `.includes('carpet')`, "plant" không khớp nhánh nào, giữ nguyên màu gốc, không lỗi)):
  - `pillow.glb` → `decor-pillow.glb`
  - `books.glb` → `decor-books.glb`
- `Room3DViewer.jsx`: thêm `pillow`/`books` vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI` ("Gối tựa"/"Sách trang trí"), `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS`, và nhóm "Phòng khách/chung" trong `FURNITURE_GROUPS` (TASK-055).
- `furnitureLayout.js#furnitureSize`: thêm kích thước `pillow` (0.35×0.15×0.35m) và `books` (0.3×0.25×0.2m) — món rất nhỏ.

## Out of scope

- Không thêm category AI thật — vẫn là loại đồ USER TỰ THÊM.

## Dependencies

TASK-037 (lưới an toàn chống chồng lấn, verify lại không hồi quy kể cả ở phòng rộng tối thiểu), TASK-055 (nhóm nút "+ thêm").

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nút "+ Gối tựa"/"+ Sách trang trí" xuất hiện đúng trong nhóm "Phòng khách/chung", thêm đúng model 3D thật.
- Không chồng lấn với 4 món AI gốc khi thêm cả 2, kể cả ở phòng rộng tối thiểu 1.5m (kịch bản đã gây lỗi ở TASK-054, nay đã sửa).
- "Đặt lại bố trí" xoá đúng cả 2 món mới thêm.
- Console sạch lỗi.

## Testing

- Script Node độc lập trước khi deploy: 4 món AI gốc + Gối tựa + Sách trang trí, phòng 1.5×5.0m (rộng tối thiểu) → 0 cặp chồng lấn.
- Verify E2E qua Docker + browser thật (phòng 1.5×5.0m có sẵn) — click "+ Gối tựa" + "+ Sách trang trí" (xác nhận đúng nằm trong nhóm "Phòng khách/chung"):
  - `read_network_requests` xác nhận `decor-pillow.glb`/`decor-books.glb` tải 200.
  - Zoom screenshot xác nhận sách trang trí hiển thị đúng hình chồng sách nhiều màu.
  - Chuyển tab "Sơ đồ mặt bằng", JS đọc trực tiếp toạ độ `<rect>` xác nhận 6 món, 0 cặp chồng lấn.
  - "Đặt lại bố trí" xoá đúng về 4 món AI gốc.
  - Console sạch lỗi xuyên suốt.

## Status

COMPLETED
