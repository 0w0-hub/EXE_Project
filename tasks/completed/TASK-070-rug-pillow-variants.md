# TASK-070

## Title

Thêm biến thể hình dáng mới cho Thảm (4th) và Gối tựa (2 biến thể mới)

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Thay vì thêm category hoàn toàn mới, round này tập trung đúng vế "hình dáng đồ" của chỉ đạo gốc — mở rộng SỐ BIẾN THỂ cho 2 category đã tồn tại nhưng còn ít lựa chọn hình dáng: "Thảm" (`rug`, 3 biến thể từ TASK-031/033) và "Gối tựa" (`pillow`, chỉ 1 biến thể duy nhất từ TASK-057).

## Scope

- `frontend/public/furniture/decor-rug-4.glb` (nguồn `rugDoormat.glb` — thảm chùi chân chữ nhật nhỏ, khác hẳn hình tròn/vuông/chữ nhật lớn đã có), `decor-pillow-2.glb` (nguồn `pillowBlue.glb`), `decor-pillow-3.glb` (nguồn `pillowLong.glb`) — cả 3 xác nhận header `glTF` hợp lệ, material name khớp quy ước, checksum không trùng file nào đã dùng.
- `Room3DViewer.jsx#STATIC_FURNITURE_MODELS`: `rug` từ 3 lên 4 biến thể; `pillow` từ 1 lên 3 biến thể.
- `CREDITS.txt` cập nhật nguồn 3 file mới.

## Out of scope

- Không đổi `DECOR_MODELS` (kho model riêng cho đồ trang trí tự động không tính chi phí, TASK-027) — dù dùng chung tên file `rug`, đây là hệ thống ĐỘC LẬP (thảm tự động đặt giữa phòng, không draggable). Chỉ mở rộng biến thể cho `STATIC_FURNITURE_MODELS` (user tự thêm qua nút "+ Thảm"/"+ Gối tựa").
- Không đổi `furnitureLayout.js#furnitureSize` — kích thước ước lượng cho mục đích chống chồng lấn giữ nguyên, chỉ hình dáng model thay đổi giữa các biến thể cùng category.

## Dependencies

TASK-031 (hạ tầng biến thể theo `pickStaticModel`/`hashSeed`), TASK-047/048 (bài học: phải đọc đúng thứ tự furniture thật + tính trước `hashSeed` để dự đoán biến thể sẽ được chọn, không giả định).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Tính trước bằng `hashSeed` cho room test thật xác nhận thêm "Thảm" ở đúng vị trí (index) sẽ chọn trúng biến thể mới (`decor-rug-4.glb`); tương tự cho "Gối tựa" (`decor-pillow-3.glb`).
- Cả 2 file tải 200, hiển thị đúng hình dạng khác biệt so với biến thể cũ.
- "Đặt lại bố trí" khôi phục đúng về 4 món AI gốc.
- Console sạch lỗi.

## Testing

- Tính trước bằng script Node độc lập (`hashSeed` sao chép đúng công thức từ `Room3DViewer.jsx`) cho room thật `99f49675-...` (đã xác nhận qua API `GET /api/v1/designs/jobs/{id}` khớp đúng room của job test) — xác nhận thêm "Thảm" làm món tự thêm ĐẦU TIÊN (index 4) trúng biến thể thứ 4 (`rugVariant=3`), thêm "Gối tựa" làm món tự thêm THỨ HAI (index 5) trúng biến thể thứ 3 (`pillowVariant=2`).
- Verify E2E qua Docker + browser thật (tài khoản `task062-tester`, re-login vì JWT + backend restart giữa round) — bấm đúng thứ tự "+ Thảm" rồi "+ Gối tựa"; `read_network_requests` (sau khi `clear: true` để tránh lẫn log tích luỹ từ các round trước trong cùng tab) xác nhận `decor-rug-4.glb` và `decor-pillow-3.glb` tải 200 đúng như dự đoán; zoom screenshot xác nhận thảm mới hình chữ nhật nhỏ khác biệt rõ với các thảm trước; "Đặt lại bố trí" khôi phục đúng 4 món AI gốc; console sạch lỗi xuyên suốt.

## Status

COMPLETED
