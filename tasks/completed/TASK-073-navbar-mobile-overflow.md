# TASK-073

## Title

Sửa lỗi navbar gây cuộn ngang toàn trang trên màn hình hẹp (mobile)

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Kiểm tra khả năng hiển thị trên màn hình hẹp — khía cạnh chưa được verify kể từ round recode giao diện gốc (TASK-008/009) — vì trang "Kết quả thiết kế" (trọng tâm 2D/3D của ứng dụng) cũng cần xem tốt trên mobile.

## Lỗi phát hiện + sửa

Dùng kỹ thuật chèn `<iframe>` rộng 390px (giả lập viewport mobile, vì `resize_window` không đổi được kích thước viewport thật trong môi trường test tự động) để kiểm tra `document.documentElement.scrollWidth` so với `clientWidth`. Phát hiện TOÀN BỘ trang (`html`/`body`) bị cuộn ngang trên màn hình hẹp — nguyên nhân duy nhất là `.navbar` (`NavBar.jsx`): `display: flex` không có `flex-wrap`, chứa logo + 3 link + avatar + tên + nút đăng xuất trên 1 hàng ngang cố định, rộng hơn viewport 390px. Kiểm tra toàn bộ file `styles.css` xác nhận từ trước tới giờ CHỈ có đúng 1 breakpoint responsive (`@media max-width: 900px`, chỉ ẩn ảnh hero trang đăng nhập) — navbar (xuất hiện ở MỌI trang) chưa từng có xử lý responsive nào.

(Đã loại trừ `.table-wrap` — bảng "Danh sách nội thất" cũng có `scrollWidth` > viewport nhưng đã có sẵn `overflow-x: auto` từ trước, cuộn ĐÚNG bên trong khung riêng, không đẩy cả trang cuộn theo — không phải lỗi.)

## Scope

- `styles.css`: thêm `@media (max-width: 640px)` cho `.navbar`/`.navbar-nav` — cho phép `flex-wrap: wrap` (xuống dòng thay vì đè cứng 1 hàng), ẩn `.navbar-user` (tên đầy đủ, giữ avatar viết tắt + tooltip đủ dùng để nhận diện) để tiết kiệm không gian ngang.

## Out of scope

- Không đổi bố cục desktop (>640px) — navbar giữ nguyên 1 hàng ngang như cũ.
- Không rà soát responsive cho MỌI trang trong 1 round (phạm vi lớn, nhiều nguyên nhân khác nhau tuỳ trang) — chỉ sửa nguyên nhân gốc DUY NHẤT gây lỗi TOÀN CỤC (navbar dùng chung mọi trang), đã xác nhận qua spot-check nhanh 2 trang khác (Dashboard, trang kết quả thiết kế) hết cuộn ngang sau khi sửa.

## Dependencies

Không phụ thuộc task nào — bug tồn tại từ TASK-008 (`NavBar.jsx`/`.navbar` gốc), phát hiện lần đầu ở round này.

## Affected Services

Frontend only (CSS, không đổi `NavBar.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Ở viewport 390px: `document.documentElement.scrollWidth === clientWidth` (không còn cuộn ngang) trên trang "Kết quả thiết kế" và Dashboard.
- Navbar xuống dòng gọn gàng, đọc được đầy đủ (logo, link, avatar, nút đăng xuất).
- Desktop (viewport rộng như trước) không đổi hành vi.
- Console sạch lỗi.

## Testing

- Chèn `<iframe>` rộng 390px trỏ tới trang thật (kỹ thuật thay thế cho `resize_window` không hoạt động đúng trong môi trường test) — TRƯỚC khi sửa: xác nhận `scrollWidth` (383px) > `clientWidth` (370px), truy vết bằng cách quét toàn bộ DOM tìm phần tử có `scrollWidth` vượt viewport → xác định đúng `.navbar` (không phải `.table-wrap`, đã loại trừ vì có `overflow-x: auto` từ trước).
- Sau khi sửa: verify lại qua Docker + browser thật (tài khoản `task062-tester`, re-login vì JWT + backend restart giữa round) — `scrollWidth === clientWidth` (370 = 370, hết cuộn ngang) trên cả trang "Kết quả thiết kế" lẫn Dashboard; zoom screenshot xác nhận navbar xuống dòng gọn gàng, đọc được đầy đủ; screenshot desktop xác nhận layout cũ không đổi.
- Console sạch lỗi xuyên suốt.

## Status

COMPLETED
