# TASK-042

## Title

Xoay tinh nội thất đang chọn 15°/lần bằng phím Q/E

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Nhấp đúp chỉ xoay được đúng 90° (TASK-034) — không đủ khi cần góc lệch nhỏ hơn (vd đặt ghế hơi chéo theo góc phòng). Tận dụng hạ tầng chọn món vừa thêm ở TASK-040 để bổ sung điều khiển xoay tinh.

## Scope

- `Room3DViewer.jsx#onKeyDown`: thêm 2 nhánh phím `q`/`Q` (xoay -15°) và `e`/`E` (xoay +15°) cho món đang chọn (`selectedMesh.rotation.y ± Math.PI / 12`), dùng chung điều kiện bảo vệ có sẵn từ TASK-040 (chỉ hoạt động khi chuột đang trên canvas + có món đang chọn) và chung khối đồng bộ label/viền chọn cuối hàm.
- Câu hướng dẫn dưới canvas (khi có món đang chọn) cập nhật thêm "Q/E để xoay 15°".

## Out of scope

- Không đổi hành vi nhấp đúp xoay 90° (TASK-034) — 2 cơ chế xoay tồn tại song song, phục vụ nhu cầu khác nhau (nhanh/thô vs tinh chỉnh).
- Không giới hạn số vòng xoay (rotation.y có thể vượt 360°, Three.js tự xử lý đúng về mặt hiển thị).

## Dependencies

TASK-040 (hạ tầng chọn món + phím tắt khi hover canvas), TASK-034 (nhấp đúp xoay 90°, cùng thao tác trên `rotation.y`).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Chọn 1 món, hover canvas, nhấn Q → xoay đúng -15°; nhấn E → xoay đúng +15° (đối xứng, quay ngược lại đúng vị trí ban đầu sau số lần bằng nhau).
- Không hồi quy: nhấp đúp vẫn xoay 90°, phím mũi tên/Delete vẫn hoạt động, "Đặt lại bố trí" khôi phục đúng góc xoay gốc.
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (đăng nhập lại tài khoản đã có vì JWT hết hạn giữa round, job "Phòng tắm"):
- Nhấp chọn sofa → xác nhận `li.is-selected` đúng.
- Hover canvas, nhấn `q` × 3 → zoom screenshot xác nhận sofa xoay ~45° (viền chọn nghiêng theo đúng hình dạng món).
- Nhấn `e` × 3 → zoom screenshot xác nhận sofa quay lại đúng góc ban đầu (đối xứng ngược lại).
- Console sạch lỗi xuyên suốt cả 2 lần xoay.

## Status

COMPLETED
