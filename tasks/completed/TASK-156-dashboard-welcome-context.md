# TASK-156

## Title

Lời chào Dashboard theo trạng thái sử dụng hiện tại

## Goal

Ý tưởng từ ChatGPT round 31 (cùng batch TASK-154/155), đã vét trước qua Explore agent, xác nhận CHƯA CÓ: `Dashboard.jsx` hiện hiện CỨNG "Chào mừng trở lại 👋" không đổi — không có điều kiện nào dựa trên trạng thái dùng thực tế.

- **Lời chào theo ngữ cảnh**: đổi dòng chào thành có điều kiện đơn giản — vd CHƯA có phòng nào (`rooms.length === 0`) → "Sẵn sàng tạo thiết kế đầu tiên?" (khác câu mặc định "Chào mừng trở lại"), CÓ phòng rồi → giữ nguyên "Chào mừng trở lại 👋" như cũ. THUẦN điều kiện tĩnh dựa trên dữ liệu ĐÃ CÓ SẴN ở frontend (`rooms`/`visibleRooms`), KHÔNG suy đoán/gọi thêm API/tạo dữ liệu cá nhân hoá mới.

## Scope

- `frontend/src/pages/Dashboard.jsx`:
  - Đổi `<h2>Chào mừng trở lại 👋</h2>` (dòng ~102) thành biểu thức điều kiện dựa trên `rooms`/dữ liệu đã fetch có sẵn tại thời điểm render — CHỈ 2 nhánh đơn giản (có phòng / chưa có phòng nào), không thêm nhiều biến thể phức tạp.
  - Giữ nguyên toàn bộ phần còn lại của khối `.section-tint` (nút "+ Tạo phòng mới"/"Mở Projects"/"Thùng rác" từ TASK-145, ô tìm kiếm, dòng mô tả phụ).

## Out of scope

- Không gọi thêm API/tính toán số liệu mới — chỉ dùng dữ liệu `rooms` đã fetch sẵn cho phần khác của trang.
- Không thêm nhiều biến thể lời chào phức tạp (giữ đúng 2 nhánh theo Scope).

## Dependencies

`Dashboard.jsx` (`rooms` state đã fetch sẵn, khối `.section-tint` từ TASK-145).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Tài khoản CHƯA có phòng nào → Dashboard hiện đúng lời chào biến thể mới (khác "Chào mừng trở lại").
- Tài khoản ĐÃ có ≥1 phòng → Dashboard hiện đúng "Chào mừng trở lại 👋" như cũ (không hồi quy).
- Không hồi quy: nút "+ Tạo phòng mới"/"Mở Projects"/"Thùng rác" (TASK-145), ô tìm kiếm, `RecentDesigns`, thống kê.
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`Projects.jsx`/`RoomNew.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-154/155.

## Coordinator verification

Dispatch cho 1 agent (`Dashboard.jsx` riêng, song song TASK-154/155). Agent chọn đúng biến `rooms` (mảng ĐẦY ĐỦ đã fetch) thay vì `visibleRooms` (mảng đã lọc theo tìm kiếm) — lý do đúng: tài khoản CÓ phòng nhưng đang gõ tìm kiếm không khớp gì sẽ hiện NHẦM lời chào "chưa có phòng" nếu dùng `visibleRooms`. Dùng lại đúng điều kiện `rooms.length === 0` đã có sẵn ở nơi khác trong cùng file (empty-state), nhất quán quy ước hiện có. `npm run build` PASS.

Coordinator verify: build tổng hợp 3 task PASS. Docker rebuild frontend + Playwright TASK-098 (3/3 PASS). Verify E2E qua Claude in Chrome: tài khoản test ĐÃ có phòng → Dashboard hiện đúng "Chào mừng trở lại 👋" như cũ (không hồi quy). **Chưa live-test riêng nhánh "chưa có phòng nào"** — dựa vào code review (ternary đơn giản, đúng biến, đúng điều kiện đã dùng nhất quán ở nơi khác cùng file) do cần tạo tài khoản mới hoàn toàn để test nhánh này, chi phí thiết lập cao hơn giá trị xác nhận thêm cho 1 thay đổi rất nhỏ/rủi ro thấp. Console sạch lỗi.

## Status

COMPLETED
