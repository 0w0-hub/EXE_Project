# TASK-151

## Title

"Đánh dấu tất cả đã đọc" cho thông báo + Phản hồi trực quan khi chạm trên mobile

## Goal

2 ý tưởng từ ChatGPT round 29 (cùng batch TASK-150), đã vét trước qua Explore agent — cả 2 đều CHƯA CÓ:

- "Notification Mark All Read" — `NotificationBell` (`NavBar.jsx`, TASK-082) chỉ đánh dấu đã đọc TỪNG thông báo khi click mở (`handleItemClick`), KHÔNG có hành động đánh dấu HÀNG LOẠT.
- "Mobile Tap Feedback" — `styles.css` chỉ có `:hover`, KHÔNG có `:active` nào cho `.card`/`button`/phần tử tương tác — trên thiết bị cảm ứng (không có hover thật), chạm vào không có phản hồi trực quan nào.

(Đã loại "Notification Read-on-Open" cùng batch — ĐÃ CÓ ĐẦY ĐỦ 100% qua `handleItemClick`, TASK-082.)

## Scope

- `frontend/src/components/NavBar.jsx` (khu vực `NotificationBell`):
  - Nút "Đánh dấu tất cả đã đọc" trong dropdown thông báo (chỉ hiện khi `unreadCount > 0`, tránh chiếm chỗ vô ích khi không có gì để đánh dấu).
  - Gọi API đánh dấu hàng loạt — kiểm tra `frontend/src/services/api.js` xem `notificationApi` đã có sẵn hàm nào cho việc này chưa; NẾU CHƯA có endpoint backend tương ứng, KHÔNG bịa API mới — thay vào đó gọi `markRead(id)` cho TỪNG thông báo chưa đọc hiện có trong danh sách đã tải (lặp qua state hiện có ở client, đúng tinh thần "không thêm dữ liệu backend mới" ChatGPT tự nêu), cập nhật `unreadCount` về 0 sau khi tất cả thành công.
- `frontend/src/styles.css`:
  - Thêm `:active` cho `.card`, `button:not(:disabled)`, và các phần tử tương tác khác đã có `:hover` tương ứng (đọc danh sách `:hover` hiện có trước, áp `:active` khớp/nhất quán — vd giảm nhẹ scale hoặc đổi độ sáng nền, hiệu ứng NHẸ, không gây giật/nhảy layout).

## Out of scope

- Không thêm API backend mới cho "mark all read" nếu chưa có sẵn (dùng vòng lặp `markRead` từng cái qua API hiện có).
- Không đổi animation/logic JS nào cho hiệu ứng chạm — THUẦN CSS.

## Dependencies

`NavBar.jsx` (`NotificationBell`, TASK-082), `services/api.js` (`notificationApi`), `styles.css` (danh sách `:hover` hiện có).

## Affected Services

Frontend only (có thể gọi API `markRead` hiện có nhiều lần, không thêm endpoint backend).

## Acceptance Criteria

- `npm run build` PASS.
- Có ≥1 thông báo chưa đọc → nút "Đánh dấu tất cả đã đọc" hiện đúng → bấm → toàn bộ thông báo chuyển trạng thái đã đọc, badge số lượng chưa đọc về 0/ẩn.
- KHÔNG có thông báo chưa đọc nào → nút KHÔNG hiện (không chiếm chỗ vô ích).
- `.card`/nút chính có phản hồi trực quan (`:active`) khi chạm/nhấn giữ — kiểm tra qua đọc `document.styleSheets` xác nhận rule đã deploy đúng.
- Không hồi quy: mở từng thông báo vẫn đánh dấu đã đọc đúng như cũ (TASK-082).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`Projects.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-150.

## Coordinator verification

Dispatch cho 1 agent (`NavBar.jsx`/`styles.css` riêng, song song TASK-150 trên `Projects.jsx`). **Phát hiện: giả định gốc của task (chưa có bulk endpoint) ĐÃ SAI** — agent tự kiểm tra kỹ trước khi code và tìm thấy `notificationApi.markAllRead()` (`services/api.js:143`) VÀ backend `PATCH /notifications/read-all` (`NotificationController.java:41-43`, `NotificationService.markAllRead()`) ĐÃ TỒN TẠI SẴN trên đĩa (phần backend của TASK-082, có trong working tree nhưng CHƯA COMMIT — lý do Explore agent vét trước đó bỏ sót, có thể do phạm vi grep chỉ giới hạn `frontend/src`). Agent quyết định dùng thẳng endpoint thật thay vì lặp `markRead()` từng cái như Scope dự phòng — quyết định kỹ thuật đúng đắn hơn (1 round-trip network thay vì N), vẫn đúng tinh thần "không bịa endpoint mới" vì endpoint đã có sẵn thật. `:active` CSS đọc toàn bộ `:hover` hiện có trước, mirror 1:1 từng selector, thêm block MỚI cuối file (không đè/định dạng lại gì cũ). `npm run build` PASS.

Coordinator verify: xác nhận qua đọc trực tiếp source backend (`NotificationController.java`/`NotificationService.java`) rằng endpoint THẬT SỰ tồn tại trên đĩa, không phải agent bịa. Build tổng hợp 2 task PASS. Docker rebuild frontend + Playwright TASK-098 (3/3 PASS) — backend KHÔNG cần rebuild (container backend đã chạy sẵn với đúng code này, container tuổi 4 giờ, có trước phiên hiện tại). Verify E2E qua Claude in Chrome: có 1 thông báo chưa đọc thật (badge đỏ trên chuông 🔔) → mở dropdown → nút "Đánh dấu tất cả đã đọc" hiện đúng → bấm → nút biến mất đúng (unreadCount về 0); **xác nhận backend call THẬT SỰ thành công (không chỉ optimistic UI)** bằng cách RELOAD TRANG HOÀN TOÀN rồi kiểm tra lại — badge KHÔNG quay lại, xác nhận trạng thái đã lưu server-side thật. Đọc trực tiếp `document.styleSheets` xác nhận đủ 7 rule `:active` đã deploy đúng, khớp selector `:hover` tương ứng. Console sạch lỗi.

## Status

COMPLETED
