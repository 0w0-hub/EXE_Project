# TASK-064

## Title

Thêm 2 loại đồ mới: Máy tính bàn, Máy pha cà phê

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Mở rộng thêm loại đồ user có thể tự thêm từ phần kho model Kenney Furniture Kit chưa dùng (67 model còn lại sau TASK-062) — máy tính bàn đi cùng Bàn làm việc/Laptop đã có (TASK-037/059), máy pha cà phê là phụ kiện bếp phổ biến.

## Scope

- `frontend/public/furniture/decor-computer.glb` (nguồn `computerScreen.glb`), `decor-coffeemachine.glb` (nguồn `kitchenCoffeeMachine.glb`) — cả 2 xác nhận header `glTF` hợp lệ, material name khớp quy ước hiện có, và checksum không trùng bất kỳ file nào đã có trong dự án (rút kinh nghiệm từ lỗi thật ở TASK-062).
- `Room3DViewer.jsx`: thêm category `computer` (nhóm "Phòng ngủ", cạnh desk/laptop), `coffeemachine` (nhóm "Phòng bếp/ăn") vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI`, `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS`, `FURNITURE_GROUPS`.
- `furnitureLayout.js#furnitureSize`: thêm kích thước `computer` (0.4×0.35×0.15, màn hình mỏng) và `coffeemachine` (0.3×0.4×0.3, máy nhỏ gọn).
- `CREDITS.txt` cập nhật nguồn 2 file mới.

## Out of scope

- Không thêm bộ phụ kiện đầy đủ (bàn phím/chuột riêng) — chỉ 1 model màn hình đại diện cho "máy tính bàn", đơn giản hoá giống cách "tv"/"laptop" chỉ có 1 hình khối chính.

## Dependencies

TASK-031 (hạ tầng loại đồ tự thêm), TASK-055 (`FURNITURE_GROUPS`), TASK-037/059 (desk/laptop — máy tính bàn đi kèm), TASK-038 (fridge/stove — máy pha cà phê đi kèm phòng bếp).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Script Node độc lập xác nhận không có chồng lấn mới do 2 category này gây ra ở phòng thực tế lẫn phòng hẹp tối thiểu.
- 2 nút "+ Máy tính bàn"/"+ Máy pha cà phê" xuất hiện đúng nhóm phòng.
- Cả 2 model tải không lỗi (console sạch, không có exception/404 khi thêm), hiển thị hình dạng khác biệt (không phải khối hộp fallback).
- Tab "Sơ đồ mặt bằng" hiển thị đủ số món, 0 cặp chồng lấn.
- "Đặt lại bố trí" khôi phục đúng về 4 món AI gốc.
- Console sạch lỗi.

## Testing

- Script Node độc lập (`furnitureLayout.js`): 4 món AI gốc + computer/coffeemachine, phòng 5×5m → 0 chồng lấn; phòng hẹp 1.5×5m → 0 chồng lấn (cả 2 món đều rất nhỏ nên không gây áp lực không gian).
- Verify E2E qua Docker + browser thật (tài khoản `task062-tester`, re-login vì JWT hết hạn giữa round, job "Phòng bếp test 062" 5×5m) — 2 nút đúng nhóm ("Phòng ngủ"/"Phòng bếp/ăn"); thêm cả 2 (2 lần mỗi loại để double-check) → 8 món tổng, console sạch lỗi trong suốt quá trình tải model (không có 404/exception nào xuất hiện — 1 lần `read_network_requests` không bắt được request do tool chỉ theo dõi request phát sinh SAU khi được gọi lần đầu, không phải lỗi ứng dụng); zoom screenshot xác nhận cả 2 hiện hình dạng riêng biệt (không phải khối hộp fallback); chuyển tab "Sơ đồ mặt bằng", JS đọc trực tiếp toạ độ `<rect>` (loại rect nền) xác nhận đúng 8 món, 0 cặp chồng lấn; "Đặt lại bố trí" khôi phục đúng 4 món AI gốc; console sạch lỗi xuyên suốt.

## Status

COMPLETED
