# TASK-072

## Title

Thêm 2 loại đồ mới: Bàn phím, Chuột máy tính

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Hoàn thiện bộ "máy tính bàn" (`computer`, TASK-064) bằng 2 phụ kiện đi kèm phổ biến — bàn phím và chuột, cả 2 rất nhỏ gọn (đặt trên mặt bàn).

## Scope

- `frontend/public/furniture/decor-keyboard.glb` (nguồn `computerKeyboard.glb`), `decor-mouse.glb` (nguồn `computerMouse.glb`) — cả 2 xác nhận header `glTF` hợp lệ, material name khớp quy ước, checksum không trùng file nào đã dùng.
- `Room3DViewer.jsx`: thêm category `keyboard`, `mouse` (cả 2 vào nhóm "Phòng ngủ", cạnh desk/computer/laptop) vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI`, `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS`, `FURNITURE_GROUPS`.
- `furnitureLayout.js#furnitureSize`: thêm kích thước `keyboard` (0.35×0.03×0.15) và `mouse` (0.08×0.04×0.12) — cả 2 rất nhỏ, gần như phẳng vì đặt trên mặt bàn.
- `CREDITS.txt` cập nhật nguồn 2 file mới.

## Out of scope

- Không thêm màn hình phụ/webcam hay phụ kiện bàn làm việc khác — chỉ 2 phụ kiện phổ biến nhất, tránh dàn trải quá nhiều item cực nhỏ ít giá trị thị giác.

## Dependencies

TASK-031 (hạ tầng loại đồ tự thêm), TASK-055 (`FURNITURE_GROUPS`), TASK-064 (category `computer` — bàn phím/chuột là phụ kiện đi kèm).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Script Node độc lập xác nhận không có chồng lấn mới ở phòng thực tế lẫn phòng hẹp tối thiểu.
- 2 nút "+ Bàn phím"/"+ Chuột máy tính" xuất hiện đúng nhóm "Phòng ngủ".
- Ô tìm kiếm (TASK-065/069) lọc đúng cả khi gõ không dấu (vd "ban phim", "chuot").
- Tab "Sơ đồ mặt bằng" hiển thị đủ số món, 0 cặp chồng lấn kể cả khi có 2 món trùng category (test thêm 2 "Chuột máy tính" liên tiếp).
- "Đặt lại bố trí" khôi phục đúng về 4 món AI gốc.
- Console sạch lỗi.

## Testing

- Script Node độc lập (`furnitureLayout.js`): 4 món AI gốc + keyboard/mouse, phòng 5×5m → 0 chồng lấn; phòng hẹp 1.5×5m → 0 chồng lấn.
- Verify E2E qua Docker + browser thật (tài khoản `task062-tester`, re-login vì JWT + backend restart giữa round, job "Phòng bếp test 062") — dùng ô tìm kiếm gõ "ban phim" (không dấu) lọc đúng ra "+ Bàn phím", gõ "chuot" lọc đúng ra "+ Chuột máy tính"; thêm 1 bàn phím + 2 chuột (test luôn trường hợp 2 món cùng category) → console sạch lỗi trong suốt quá trình tải model; chuyển tab "Sơ đồ mặt bằng", JS đọc trực tiếp toạ độ `<rect>` xác nhận đúng 7 món, 0 cặp chồng lấn (kể cả 2 chuột cùng loại tự tách nhau nhờ lưới an toàn TASK-037/054); "Đặt lại bố trí" khôi phục đúng 4 món AI gốc; console sạch lỗi xuyên suốt.

## Status

COMPLETED
