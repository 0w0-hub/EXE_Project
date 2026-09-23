# TASK-048

## Title

Thêm biến thể model cho category Đèn và Tủ/kệ (4→6, 6→8)

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Sau TASK-047 (tăng `seating`/`table` lên 8 biến thể), hoàn thiện nốt 2 category AI cố định còn lại: `lighting` (vẫn 4 từ TASK-029) và `storage` (vẫn 6 từ TASK-029) — cân bằng cả 4 category AI ở mức đa dạng tương đương.

## Scope

- 4 model `.glb` mới (CC0 Kenney, xác nhận header `glTF` + tên material trước khi dùng — `wood`/`woodDark`/`metal`/`lamp`, khớp `enhanceMaterial()` có sẵn):
  - `lampSquareCeiling.glb` → `lighting-5.glb` (đèn trần)
  - `lampWall.glb` → `lighting-6.glb` (đèn tường)
  - `bathroomCabinet.glb` → `storage-7.glb` (tủ nhỏ có gương)
  - `kitchenCabinet.glb` → `storage-8.glb` (tủ bếp thấp)
- `Room3DViewer.jsx#STATIC_FURNITURE_MODELS`: `lighting` từ 4→6, `storage` từ 6→8.
- `CREDITS.txt` cập nhật nguồn 4 file mới.

## Out of scope

- Không đổi `furnitureSize()`/vị trí — đèn trần/đèn tường vẫn hiển thị neo sàn như mọi model khác (đơn giản hoá đã áp dụng nhất quán từ TASK-018, ví dụ gương/tranh tường cũng neo sàn).
- Không đổi cơ chế `pickStaticModel`/`hashSeed`.

## Dependencies

TASK-029 (thiết lập cơ chế biến thể), TASK-047 (cùng đợt cân bằng 4 category AI).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- 4 file mới phục vụ đúng qua nginx (200, header `glTF` hợp lệ).
- Phòng có hash trúng index mới (4/5 cho lighting, 6/7 cho storage) tải và hiển thị đúng hình dạng thật.
- Không hồi quy các phòng dùng index cũ.

## Testing

- Xác nhận header + material qua Node script trước khi deploy.
- Vì `pickStaticModel` chọn theo hash `roomId` không kiểm soát trực tiếp được, viết script Node tính trước `hashSeed` cho ~25 room ID thật (tạo qua API), dùng đúng THỨ TỰ CATEGORY THẬT của từng job (đọc qua API, không giả định thứ tự cố định — bài học từ lần tính sai ở TASK-047 do thứ tự AI trả về ngẫu nhiên) để tìm phòng trúng biến thể mới:
  - Phòng `c37e7865-...` (thứ tự thật: table[0], seating[1], storage[2], lighting[3]) → base item "Đèn sàn/đèn trang trí" tự động tải đúng `lighting-6.glb` (đèn tường, `read_network_requests` 200).
  - Cùng phòng, bấm "+ Tủ/kệ" (thêm ở index 4) → tải đúng `storage-8.glb` (kitchenCabinet, 200); zoom screenshot xác nhận hình tủ bếp thấp, khác hẳn kệ sách cao gốc.
  - Console sạch lỗi.

## Status

COMPLETED
