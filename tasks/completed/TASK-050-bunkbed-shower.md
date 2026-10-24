# TASK-050

## Title

Thêm biến thể Giường tầng + loại đồ mới Vòi sen đứng

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Mở rộng thêm 2 hướng: (1) Giường tầng — biến thể thứ 3 của category tự thêm `bed` (TASK-037), phù hợp phòng trẻ em/phòng ngủ chung; (2) Vòi sen đứng — loại đồ tự thêm mới cho phòng tắm, bổ sung cạnh Bồn tắm (TASK-039) vì phòng tắm thực tế thường có 1 trong 2 hoặc cả 2.

## Scope

- 3 model `.glb` mới (CC0 Kenney, xác nhận header `glTF` + tên material trước khi dùng — `wood`/`carpet`/`carpetWhite`/`metalDark`/`glass`, khớp `enhanceMaterial()` có sẵn; `_defaultMat` không khớp nhánh nào, giữ nguyên, không lỗi):
  - `bedBunk.glb` → `decor-bed-3.glb` (biến thể thứ 3 của `bed`, cùng kích thước hiển thị với 2 biến thể giường trước — model được scale-to-fit đồng nhất theo `furnitureSize('bed')`, giống mọi model khác dùng chung 1 category).
  - `shower.glb` → `decor-shower.glb`, `showerRound.glb` → `decor-shower-2.glb` (2 biến thể loại đồ mới `shower`).
- `Room3DViewer.jsx`: mảng `bed` trong `STATIC_FURNITURE_MODELS` từ 2→3; thêm `shower` vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI` ("Vòi sen đứng"), `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS`.
- `furnitureLayout.js#furnitureSize`: thêm kích thước `shower` (0.9×2.0×0.9m — khối vuông cao, mô phỏng buồng tắm kính).
- `CREDITS.txt` cập nhật nguồn 3 file mới.

## Out of scope

- Không đổi `furnitureSize('bed')` — giường tầng dùng chung box kích thước với 2 biến thể giường đơn/đôi trước, model tự scale-to-fit đồng nhất (có thể trông thấp hơn thực tế do bunk bed cao hơn giường thường, nhưng nhất quán với cách xử lý mọi biến thể khác trong category — không phải lỗi mới).
- Không đổi thuật toán chống chồng lấn — chỉ verify lại không hồi quy khi kết hợp Bồn tắm + Vòi sen đứng.

## Dependencies

TASK-037 (category `bed`), TASK-039 (Bồn tắm, cùng nhóm phòng tắm), TASK-037 (lưới an toàn chống chồng lấn).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nút "+ Vòi sen đứng" xuất hiện, thêm đúng model 3D thật (khối kính trong suốt, không phải khối hộp).
- Phòng có hash chọn trúng biến thể `bed` thứ 3 hiển thị đúng hình giường tầng có thang leo.
- Không chồng lấn với Bồn tắm khi thêm cả 2 (phòng 5×5m).
- "Đặt lại bố trí" xoá đúng các món tự thêm.
- Console sạch lỗi.

## Testing

- Script Node độc lập trước khi deploy: 4 món AI gốc + Bồn tắm + Vòi sen đứng, phòng 5×5m → 0 cặp chồng lấn.
- Verify E2E qua Docker + browser thật (2 job có sẵn từ round trước):
  - Job "Phòng khách" (room `f7e3f5d1-...`): bấm "+ Vòi sen đứng" → `read_network_requests` xác nhận `decor-shower.glb` tải 200; screenshot xác nhận buồng kính trong suốt hiển thị rõ ràng, tách biệt các món khác; console sạch lỗi.
  - Job khác (room `33cecd3c-...`, đã tính trước hash để chắc chắn trúng biến thể `bed` thứ 3): bấm "+ Giường" → `read_network_requests` xác nhận `decor-bed-3.glb` tải 200; zoom screenshot xác nhận hình giường tầng có thang, khác hẳn giường đơn/đôi trước; console sạch lỗi.
  - "Đặt lại bố trí" ở cả 2 job xác nhận khôi phục đúng về 4 món AI gốc.

## Status

COMPLETED
