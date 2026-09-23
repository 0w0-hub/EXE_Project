# TASK-039

## Title

Thêm loại đồ Bồn cầu/Bồn tắm — mở rộng sang phòng tắm

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Sau khi mở rộng sang phòng bếp (TASK-038), thêm Bồn cầu và Bồn tắm để phòng tắm cũng có đồ phù hợp — hoàn thiện độ phủ 4 loại phòng phổ biến (khách/ngủ/bếp/tắm) thay vì chỉ 4 category AI chung chung.

## Scope

- 3 model `.glb` mới (CC0 Kenney, xác nhận header `glTF` + tên material qua đọc JSON chunk trước khi dùng — `toilet→decor-toilet.glb`, `toiletSquare→decor-toilet-2.glb`, `bathtub→decor-bathtub.glb`) vào `frontend/public/furniture/`, cập nhật `CREDITS.txt`. Tên material gồm `_defaultMat` (không khớp nhánh nào trong `enhanceMaterial()`, giữ nguyên material gốc — không lỗi) và `carpetWhite`/`metalLight`/`metalDark` (khớp nhánh có sẵn).
- `Room3DViewer.jsx`: thêm `toilet`/`bathtub` vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI` ("Bồn cầu"/"Bồn tắm"), `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS`.
- `furnitureLayout.js#furnitureSize`: thêm kích thước `toilet` (0.4×0.7×0.65m) và `bathtub` (0.8×0.55×1.7m — chiều sâu 1.7m, cùng lớp "món dẹt và dài" như giường ở TASK-037, dùng để verify lại lưới an toàn chống chồng lấn).

## Out of scope

- Không thêm category AI thật — vẫn là loại đồ USER TỰ THÊM.
- Không đổi thuật toán chống chồng lấn (TASK-037) — chỉ verify lại không hồi quy với món dài mới.

## Dependencies

TASK-038 (COMPLETED, cùng đợt tự động nâng cấp); dùng lại lưới an toàn chống chồng lấn từ TASK-037.

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nút "+ Bồn cầu"/"+ Bồn tắm" xuất hiện, thêm đúng model 3D thật (không phải khối hộp).
- Không chồng lấn với 4 món AI gốc khi thêm cả 2 (phòng 5×5m) — đặc biệt bồn tắm (món dài 1.7m).
- "Đặt lại bố trí" xoá đúng cả 2 món mới thêm.
- Console sạch lỗi.

## Testing

- Script Node độc lập trước khi deploy: 4 món AI gốc + Bồn cầu + Bồn tắm, phòng 5×5m → 0 cặp chồng lấn (xác nhận lưới an toàn TASK-037 xử lý đúng món dài mới, tương tự trường hợp giường).
- Verify E2E qua Docker + browser thật (tài khoản/room "Phòng tắm"/job mới tạo qua API vì JWT phiên cũ hết hạn giữa các round) — click "+ Bồn cầu" + "+ Bồn tắm":
  - `read_network_requests` xác nhận `decor-toilet-2.glb`/`decor-bathtub.glb` tải 200.
  - JS đọc trực tiếp toạ độ `<rect>` trong `svg.room2d-plan` (bỏ khung phòng) xác nhận 6 món, 0 cặp chồng lấn.
  - Screenshot + zoom xác nhận bồn tắm/bồn cầu hiển thị đúng hình dạng thiết bị vệ sinh thật, tách biệt rõ ràng.
  - "Đặt lại bố trí" xoá đúng về 4 món AI gốc.
  - Console sạch lỗi xuyên suốt.

## Status

COMPLETED
