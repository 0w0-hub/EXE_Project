# TASK-047

## Title

Thêm biến thể model cho category Ghế/sofa và Bàn (6→8 mỗi loại)

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Quay lại đúng yêu cầu gốc mở đầu chuỗi nâng cấp này ("mỗi loại nội thất cần nhiều mẫu hơn" — TASK-029): 2 category AI cố định `seating`/`table` đang dừng ở 6 biến thể mỗi loại từ TASK-029, trong khi các round gần đây chủ yếu thêm CATEGORY mới (custom) chứ chưa tăng thêm biến thể của 4 category AI gốc.

## Scope

- 4 model `.glb` mới (CC0 Kenney, xác nhận header `glTF` + tên material qua đọc JSON chunk trước khi dùng — toàn bộ chỉ dùng `wood`/`carpet`, khớp `enhanceMaterial()` có sẵn):
  - `bench.glb` → `seating-7.glb` (ghế dài/băng ghế)
  - `chairRounded.glb` → `seating-8.glb` (ghế bành bo tròn)
  - `tableCloth.glb` → `table-7.glb` (bàn phủ khăn trải bàn)
  - `tableCoffeeSquare.glb` → `table-8.glb` (bàn trà vuông)
- `Room3DViewer.jsx#STATIC_FURNITURE_MODELS`: mảng `seating`/`table` từ 6 → 8 phần tử mỗi loại.
- `CREDITS.txt` cập nhật nguồn 4 file mới.

## Out of scope

- Không đổi `lighting`/`storage` (vẫn 4/6 biến thể như TASK-029) — round này chỉ tập trung 2 category còn thiếu cân đối nhất.
- Không đổi `furnitureSize()` — biến thể mới cùng category nên dùng chung kích thước hiển thị đã có.
- Không đổi thuật toán `pickStaticModel`/`hashSeed` — chỉ mở rộng độ dài mảng nguồn, cơ chế chọn ổn định theo phòng giữ nguyên.

## Dependencies

TASK-029 (thiết lập cơ chế biến thể theo category + `pickStaticModel`).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- 4 file mới phục vụ đúng qua nginx (200, đúng header `glTF`).
- Với phòng có hash chọn trúng index 6/7 (biến thể mới), model tải và hiển thị đúng hình dạng thật (không phải khối hộp, không lỗi console).
- Không hồi quy các phòng đã dùng index 0-5 (biến thể cũ giữ nguyên vị trí trong mảng, không bị xáo trộn).

## Testing

- Xác nhận header + material qua Node script trước khi deploy (như mọi lần thêm model).
- Verify E2E qua Docker + browser thật: vì `pickStaticModel` chọn theo hash của `roomId` (server-generated, không kiểm soát được), viết script Node tính trước `hashSeed` cho ~15-25 room ID thật (tạo qua API) để tìm phòng mà việc thêm 1 món tự thêm (luôn nằm ở index cố định = số món hiện có) sẽ trúng index 6/7:
  - Phòng `56e423df-...`: `+ Ghế/sofa` (thêm ở index 4) → `hashSeed % 8 = 7` → tải đúng `seating-8.glb` (`read_network_requests` xác nhận 200), zoom screenshot xác nhận hình ghế bành bo tròn khác hẳn khối sofa.
  - Phòng `75e7ba17-...`: `+ Bàn` (thêm ở index 4) → `hashSeed % 8 = 7` → tải đúng `table-8.glb` (200), screenshot xác nhận bàn vuông nhỏ riêng biệt.
  - Console sạch lỗi ở cả 2 phòng test.

## Status

COMPLETED
