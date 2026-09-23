# TASK-061

## Title

Bảng tra cứu phím tắt/thao tác chuột trong "Không gian 3D"

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Qua nhiều task (TASK-004, 034, 035, 040, 042, 052) đã tích luỹ khá nhiều thao tác chuột/phím tắt (kéo xoay/pan/zoom, kéo-thả món, nhấp đúp xoay 90°, nhấp chọn + phím mũi tên/Q/E/Delete, cảnh báo chồng lấn khi kéo). Trước đây các thao tác này chỉ được nêu rải rác trong 1 câu chú thích DUY NHẤT bên dưới canvas, mà nội dung câu đó lại đổi tuỳ theo có đang chọn món hay không — nghĩa là user không bao giờ thấy đủ TOÀN BỘ danh sách thao tác cùng lúc. Thêm 1 bảng tra cứu cố định, có thể bật/tắt, liệt kê đầy đủ tất cả thao tác trong 1 chỗ.

## Scope

- `Room3DViewer.jsx`: thêm state `showShortcutsHelp` (mặc định `false`, không phụ thuộc tab/selection).
- Thêm nút "❓ Phím tắt" vào hàng nút công cụ của tab "Không gian 3D" (cạnh nút "🌙 Buổi tối"/"☀️ Ban ngày"), bấm để bật/tắt (`aria-expanded`).
- Khi bật, hiện 1 danh sách `<ul>` ngay trên canvas 3D, liệt kê đủ 8 thao tác: kéo xoay/zoom nền phòng, kéo di chuyển 1 món, nhấp chọn/bỏ chọn, nhấp đúp xoay 90°, phím mũi tên di chuyển tinh, Q/E xoay 15°, Delete/Backspace xoá, kéo chấm đỏ đổi kích thước phòng.
- CSS mới `.room3d-shortcuts-help` trong `styles.css` (khung viền nhẹ, nền hơi khác nền trang, cỡ chữ nhỏ hơn mặc định).
- Không đổi câu chú thích động hiện có bên dưới canvas (TASK-040/034) — bảng tra cứu này là bổ sung, không thay thế, vì câu chú thích động vẫn hữu ích để biết ĐANG chọn món nào ngay lúc đó.

## Out of scope

- Không thêm phím tắt mới nào — chỉ tổng hợp lại các phím tắt đã có từ các task trước.
- Không tự động mở bảng lần đầu vào trang (tránh gây rối, chỉ hiện khi user chủ động bấm).
- Không đồng bộ trạng thái bật/tắt bảng này qua lại giữa các tab hay lưu lại giữa các lần tải trang (session-only, mặc định đóng mỗi lần mount).

## Dependencies

Không phụ thuộc thêm gì ngoài các thao tác đã có sẵn từ TASK-004, 034, 035, 040, 042, 052 (bảng chỉ tổng hợp lại thông tin, không đổi hành vi các thao tác đó).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nút "❓ Phím tắt" xuất hiện trong tab "Không gian 3D", bấm vào hiện đủ danh sách 8 thao tác, bấm lại lần nữa thì ẩn đi.
- Không ảnh hưởng các nút/tương tác khác (kéo-thả, chọn món, đổi tab, v.v.).
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật:
- `npm run build` PASS → Docker rebuild frontend.
- Mở job COMPLETED có sẵn (tài khoản `task054-tester`) → tab "Không gian 3D" → xác nhận nút "❓ Phím tắt" hiện trong hàng công cụ.
- Bấm nút → screenshot xác nhận bảng liệt kê đủ 8 dòng thao tác hiện ra ngay trên canvas.
- Bấm lại → xác nhận qua JS (`document.querySelector('.room3d-shortcuts-help')`) trả về `null` — đã đóng đúng.
- Chuyển qua tab "Sơ đồ mặt bằng" rồi quay lại tab "Không gian 3D" → scene dựng lại bình thường, không lỗi, bảng vẫn ở trạng thái đóng (không tự bật lại ngoài ý muốn).
- Console sạch lỗi mới (chỉ có 2 warning "Multiple instances of Three.js being imported" đã tồn tại từ trước, không liên quan tới thay đổi này).

## Status

COMPLETED
