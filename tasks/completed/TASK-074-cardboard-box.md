# TASK-074

## Title

Thêm loại đồ mới: Thùng carton (2 biến thể đóng/mở)

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Mọi loại đồ đã thêm từ trước tới giờ đều là nội thất "hoàn thiện" — thùng carton mang lại thẩm mỹ khác hẳn (cảnh "mới chuyển nhà, chưa dọn hết đồ"), đa dạng hoá thêm ngữ cảnh sử dụng của phòng.

## Scope

- `frontend/public/furniture/decor-box.glb` (nguồn `cardboardBoxClosed.glb`), `decor-box-2.glb` (nguồn `cardboardBoxOpen.glb`) — cả 2 xác nhận header `glTF` hợp lệ, material name khớp quy ước (`wood`/`woodDark`), checksum không trùng file nào đã dùng.
- `Room3DViewer.jsx`: thêm category `box` (2 biến thể, nhóm "Phòng khách/chung") vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI`, `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS`, `FURNITURE_GROUPS`.
- `furnitureLayout.js#furnitureSize`: thêm kích thước `box` (0.45×0.4×0.4, cỡ hộp chuyển nhà điển hình).
- `CREDITS.txt` cập nhật nguồn 2 file mới.

## Out of scope

- Không đặt giá cao — chi phí ước tính chỉ mang tính tượng trưng (50.000đ, tương tự cách định giá thấp cho các phụ kiện trang trí nhỏ khác như gấu bông/sách).

## Dependencies

TASK-031 (hạ tầng loại đồ tự thêm), TASK-055 (`FURNITURE_GROUPS`).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Script Node độc lập xác nhận không có chồng lấn mới ở phòng thực tế lẫn phòng hẹp tối thiểu (test với 2 thùng carton cùng lúc).
- Nút "+ Thùng carton" xuất hiện đúng nhóm "Phòng khách/chung".
- Ô tìm kiếm (TASK-065/069) tìm đúng khi gõ "thung" (không dấu, khớp cả "Thùng rác" lẫn "Thùng carton").
- Tab "Sơ đồ mặt bằng" hiển thị đủ số món, 0 cặp chồng lấn.
- "Đặt lại bố trí" khôi phục đúng về 4 món AI gốc.
- Console sạch lỗi.

## Testing

- Script Node độc lập (`furnitureLayout.js`): 4 món AI gốc + 2 "box", phòng 5×5m → 0 chồng lấn; phòng hẹp 1.5×5m → 0 chồng lấn.
- Verify E2E qua Docker + browser thật (tài khoản `task062-tester`, re-login vì JWT + backend restart giữa round, job "Phòng bếp test 062") — gõ "thung" (không dấu) vào ô tìm kiếm lọc đúng ra cả "+ Thùng rác" và "+ Thùng carton"; thêm 3 thùng carton liên tiếp → console sạch lỗi trong suốt quá trình tải model; zoom screenshot xác nhận hình thùng carton nâu đặc trưng, phân biệt rõ với mọi loại đồ khác; chuyển tab "Sơ đồ mặt bằng", JS đọc trực tiếp toạ độ `<rect>` xác nhận đúng 7 món, 0 cặp chồng lấn; "Đặt lại bố trí" khôi phục đúng 4 món AI gốc; console sạch lỗi xuyên suốt.

## Status

COMPLETED
