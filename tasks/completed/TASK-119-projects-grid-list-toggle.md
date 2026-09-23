# TASK-119

## Title

Chuyển đổi Grid ↔ List cho danh sách dự án

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 19 — hỏi lại ChatGPT lần 12 tại phiên `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`, được 6 ý tưởng: Breadcrumb trong Editor, Copy ID bằng một click, Đổi kiểu hiển thị Grid↔List, Dynamic Browser Title, Export Resolution Presets, Responsive Mobile Navigation. Trước khi giao việc, tự kiểm tra code:

- "Breadcrumb trong Editor" (Projects → Room → Design) — premise SAI: đọc `App.jsx` xác nhận KHÔNG có trang "Room" riêng biệt (route chỉ có `/rooms/new` để TẠO, không có `/rooms/:id` xem chi tiết) — tạo phòng và tạo thiết kế là 1 luồng, không phải 2 cấp điều hướng riêng. NavBar đã có sẵn link "Dự án của tôi" quay lại danh sách. Loại.
- "Copy ID bằng một click" — đọc `DesignResult.jsx` xác nhận Job ID ĐÃ có nút "📋 Sao chép" từ TASK-115; chỉ còn thiếu đúng 1 nút cho Room ID — quá nhỏ để làm 1 task riêng, giá trị thấp. Loại.
- "Responsive Mobile Navigation" (sidebar → drawer) — premise một phần sai: Homely dùng NavBar ngang, không có sidebar; TASK-073 đã sửa lỗi hồi quy thật (tràn ngang trang) bằng `flex-wrap` ở breakpoint 640px. Chuyển hẳn sang dạng drawer là redesign chủ quan hơn, quy mô lớn hơn 1 task nhỏ — để dành backlog, không làm round này.

Chọn 2/3 ý tưởng còn lại cho round này (không đụng nhau, giao song song được): "Đổi kiểu hiển thị Grid↔List" (TASK-119, task này) và "Dynamic Browser Title" (TASK-120). "Export Resolution Presets" đụng `Room3DViewer.jsx` → TASK-121, coordinator tự làm riêng.

Vấn đề thật của TASK-119: `Projects.jsx` (`tasks/completed/TASK-017-...`) chỉ có đúng 1 kiểu hiển thị — card grid (`.room-grid`, `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`). Khi có nhiều thiết kế, grid card chiếm nhiều chỗ dọc, khó lướt nhanh so với dạng list gọn hơn.

## Scope

- `frontend/src/pages/Projects.jsx`: thêm state `viewMode` (`'grid'` | `'list'`, mặc định `'grid'` — giữ nguyên trải nghiệm hiện tại cho ai chưa đổi), 2 nút toggle nhỏ (icon-only hoặc text ngắn "▦ Lưới" / "☰ Danh sách") đặt cạnh ô tìm kiếm/sắp xếp có sẵn.
- Ở `viewMode === 'list'`: render CÙNG dữ liệu (`filteredItems`) nhưng dạng hàng ngang gọn (tên/loại phòng, trạng thái, ngày tạo, nút yêu thích) thay vì card — có thể tái dùng phần lớn nội dung mỗi item, chỉ đổi layout container (class CSS mới `room-list` thay `room-grid`).
- Lưu lựa chọn vào `localStorage` (key mới `homely_projects_view_mode`) để giữ nguyên lựa chọn qua các lần ghé lại trang — theo đúng pattern đã dùng cho theme (TASK-088)/onboarding (TASK-081).
- `frontend/src/styles.css`: class `.room-list` mới (không đổi `.room-grid` hiện có).

## Out of scope

- Không đổi API/dữ liệu — `filteredItems` dùng lại y nguyên, chỉ đổi cách render.
- Không áp dụng cho `Dashboard.jsx`/`Templates.jsx` (chỉ đúng phạm vi `Projects.jsx` theo đề bài gốc).
- Không đụng `Room3DViewer.jsx`, không đụng `Projects.jsx` phần filter/sort/search có sẵn (chỉ thêm, không sửa logic cũ).

## Dependencies

TASK-017 (card grid gốc), TASK-080 (tìm kiếm), TASK-106 (sắp xếp), TASK-103 (yêu thích).

## Affected Services

Frontend only (`Projects.jsx`, `styles.css`).

## Acceptance Criteria

- `npm run build` PASS.
- Mặc định vào trang `/projects` vẫn hiện đúng grid như cũ (không hồi quy).
- Bấm "☰ Danh sách" → đổi đúng sang dạng list, đủ toàn bộ dữ liệu (tên/loại/trạng thái/ngày/yêu thích), filter/sort/search vẫn hoạt động đúng trên dữ liệu đang hiện (cả 2 chế độ).
- Tải lại trang → giữ đúng lựa chọn đã chọn trước đó (qua `localStorage`).
- Console sạch lỗi.

## Testing

Agent tự verify: `npm run build`, verify qua Docker + browser nếu có kết nối Claude-in-Chrome trong phiên của agent (khuyến khích). Không bắt buộc — coordinator sẽ verify UI thật ở vòng gộp cuối cùng của round này.

## Coordinator verification

- Agent báo cáo: sửa đúng 2 file trong scope (`Projects.jsx`, `styles.css`), giữ nguyên 100% logic filter/sort/search/favorite/rename cũ, `npm run build` PASS.
- Coordinator: build lại toàn bộ (gộp cùng TASK-120/121) PASS, Docker rebuild frontend, Playwright TASK-098 (3/3 PASS).
- Verify E2E qua Claude-in-Chrome: `/projects` mặc định hiện đúng grid; bấm "☰ Danh sách" → chuyển đúng sang list (xác nhận `document.querySelector('.room-list')` xuất hiện), đủ dữ liệu (tên/trạng thái/ngày/hành động). Tải lại trang → giữ đúng lựa chọn "Danh sách" qua `localStorage` (xác nhận `.room-list` vẫn hiện sau reload).
- Console sạch lỗi.

## Status

COMPLETED
