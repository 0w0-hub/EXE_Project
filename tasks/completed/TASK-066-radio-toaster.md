# TASK-066

## Title

Thêm 2 loại đồ mới: Đài radio, Máy nướng bánh mì

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Mở rộng thêm loại đồ từ phần kho model Kenney Furniture Kit chưa dùng — đài radio là đồ trang trí phòng khách phổ biến, máy nướng bánh mì là phụ kiện bếp nhỏ đi cùng lò vi sóng/máy pha cà phê đã có (TASK-062/064).

## Scope

- `frontend/public/furniture/decor-radio.glb` (nguồn `radio.glb`), `decor-toaster.glb` (nguồn `toaster.glb`) — cả 2 xác nhận header `glTF` hợp lệ, material name khớp quy ước hiện có, checksum không trùng bất kỳ file nào đã dùng trước đó.
- `Room3DViewer.jsx`: thêm category `radio` (nhóm "Phòng khách/chung"), `toaster` (nhóm "Phòng bếp/ăn") vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI`, `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS`, `FURNITURE_GROUPS`.
- `furnitureLayout.js#furnitureSize`: thêm kích thước `radio` (0.3×0.25×0.2) và `toaster` (0.25×0.2×0.2) — cả 2 rất nhỏ gọn.
- `CREDITS.txt` cập nhật nguồn 2 file mới.

## Out of scope

- Không thêm biến thể màu/hình dáng khác cho 2 loại đồ này (chỉ 1 model mỗi loại, giống cách làm với các phụ kiện nhỏ trước đó như pillow/books/hood/laptop).

## Dependencies

TASK-031 (hạ tầng loại đồ tự thêm), TASK-055 (`FURNITURE_GROUPS`), TASK-062/064 (microwave/coffeemachine — toaster đi cùng nhóm phụ kiện bếp).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Script Node độc lập xác nhận không có chồng lấn mới ở phòng thực tế lẫn phòng hẹp tối thiểu.
- 2 nút "+ Đài radio"/"+ Máy nướng bánh mì" xuất hiện đúng nhóm phòng.
- Tab "Sơ đồ mặt bằng" hiển thị đủ số món, 0 cặp chồng lấn.
- "Đặt lại bố trí" khôi phục đúng về 4 món AI gốc.
- Console sạch lỗi.

## Testing

- Script Node độc lập (`furnitureLayout.js`): 4 món AI gốc + radio/toaster, phòng 5×5m → 0 chồng lấn; phòng hẹp 1.5×5m → 0 chồng lấn.
- Verify E2E qua Docker + browser thật (tài khoản `task062-tester`, re-login vì JWT + backend restart giữa round, job "Phòng bếp test 062") — 2 nút đúng nhóm ("Phòng khách/chung"/"Phòng bếp/ăn"); thêm cả 2 → console sạch lỗi trong suốt quá trình tải model; zoom screenshot xác nhận cả 2 hiện trong scene kèm nhãn tên+giá đúng (hình dạng nhỏ, khó phân biệt rõ ở góc camera mặc định — giới hạn quan sát, không phải lỗi ứng dụng, đã bù bằng console sạch lỗi làm bằng chứng chính); chuyển tab "Sơ đồ mặt bằng", JS đọc trực tiếp toạ độ `<rect>` xác nhận đúng 6 món, 0 cặp chồng lấn; "Đặt lại bố trí" khôi phục đúng 4 món AI gốc; console sạch lỗi xuyên suốt.

## Status

COMPLETED
