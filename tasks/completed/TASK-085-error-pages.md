# TASK-085

## Title

Trang lỗi 404/403 thiết kế riêng (Beautiful Error Pages)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 3, ý tưởng lấy từ ChatGPT (cùng phiên hội thoại các round trước: `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) — "Beautiful Error Pages": đọc `App.jsx` trước để xác nhận hiện KHÔNG có route "catch-all" (`path="*"`) — truy cập URL không tồn tại hiện render trắng trang/lỗi React Router mặc định, không có trang 404 thiết kế riêng.

## Scope

- Component mới `frontend/src/pages/NotFound.jsx` — trang 404, dùng đúng design token "Peacock Feather" đã có trong `styles.css` (không tạo màu/style mới ngoài hệ thống), có nút "Về trang chủ" (điều hướng `/dashboard` nếu đã đăng nhập hoặc `/` nếu chưa — kiểm tra cách dự án phát hiện trạng thái đăng nhập, ví dụ đọc `AuthContext`/`ProtectedRoute` trước khi viết logic điều kiện này).
- Component KHÁC `frontend/src/components/AccessDenied.jsx` — khối hiển thị "403 — Không có quyền truy cập" (dùng để nhúng vào trang admin khi API trả 403, KHÔNG phải route riêng — đọc 3 trang admin hiện có để xem cách chúng đang xử lý lỗi 403 hiện tại, ví dụ `AdminDashboard.jsx`/`AdminUsers.jsx`/`AdminDesigns.jsx`, rồi thay bằng component mới này nếu hợp lý và AN TOÀN — nếu cách xử lý hiện tại đã ổn và thay sẽ rủi ro hồi quy RBAC, có thể chỉ làm phần 404 ở trên và bỏ qua phần 403 này, ghi rõ lý do trong báo cáo).
- **KHÔNG tự sửa `App.jsx`** — nhiều agent khác trong round này (TASK-083/084) cũng đang thêm route mới vào `App.jsx` song song; route catch-all `path="*"` BẮT BUỘC phải nằm SAU MỌI route khác (React Router match theo thứ tự) nên có rủi ro thứ tự nếu nhiều agent cùng sửa file này đồng thời. Coordinator sẽ tự thêm route catch-all vào `App.jsx` SAU KHI toàn bộ agent round này báo cáo xong, dùng đúng `NotFound.jsx` bạn tạo ra. Chỉ cần tạo xong 2 component và báo cáo rõ đường dẫn export để coordinator import đúng.

## Out of scope

- Không làm trang lỗi 500/"Something Went Wrong" riêng (ý tưởng gốc ChatGPT có đề xuất — bỏ qua vì lỗi API hiện tại đã có `ApiResponse.error()` xử lý nhất quán theo `rules/api/error-format.md`, hiển thị qua `error-text` có sẵn ở từng trang; làm thêm 1 trang lỗi toàn màn hình riêng dễ xung đột với luồng try/catch hiện có của từng trang).
- KHÔNG đổi bất kỳ route hợp lệ nào đã có, KHÔNG đổi logic RBAC admin hiện có (chỉ thay PHẦN HIỂN THỊ khi đã 403, nếu làm phần này).
- Không đụng `NavBar.jsx`, `Dashboard.jsx`, `Room3DViewer.jsx`, `Projects.jsx`, `DesignResult.jsx`.

## Dependencies

`App.jsx` (danh sách route hiện có), `styles.css` (design token), `AuthContext`/`ProtectedRoute` (trạng thái đăng nhập).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS (component đứng riêng, chưa gắn route nên chỉ cần compile được — coordinator verify phần route sau).
- `NotFound.jsx` dùng đúng design token, có nút "Về trang chủ" hoạt động đúng logic điều kiện (đăng nhập/chưa đăng nhập).
- `AccessDenied.jsx` (nếu làm) không phá vỡ RBAC hiện có của 3 trang admin.
- Console sạch lỗi khi tự kiểm tra component (có thể tạm thời import thử vào 1 trang test cục bộ để xem hiển thị, KHÔNG commit phần test tạm đó).

## Testing

Tự verify bằng `npm run build` PASS trước khi báo cáo xong. KHÔNG tự sửa `App.jsx`, KHÔNG tự chạy `docker compose up`/dùng Claude-in-Chrome — coordinator tự thêm route catch-all vào `App.jsx` (đặt đúng vị trí cuối cùng) + gộp rebuild Docker + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành, bao gồm verify KỸ rằng route catch-all không nuốt mất route động nào.

## Status

COMPLETED

## Coordinator verification

Đọc báo cáo của agent — phát hiện quan trọng: `App.jsx` ĐÃ CÓ route catch-all từ trước (`<Route path="*" element={<Navigate to="/" replace />} />`, dòng 123), không phải "trắng trang" như giả định ban đầu trong Goal — chỉ tự động chuyển hướng về "/" im lặng. Coordinator đổi element đó thành `<NotFound />` (giữ đúng vị trí cuối cùng, không thêm route mới) thay vì thêm route hoàn toàn mới. Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật:
- Truy cập `/dashboard` (route không tồn tại — Dashboard thực tế mount ở `/`) → hiện đúng trang 404 mới, thiết kế theo design token, không trắng trang/không tự động chuyển hướng im lặng nữa.
- Bấm "Về trang chủ" → điều hướng đúng về `/` (đã đăng nhập).
- Route động `/designs/{jobId}` vẫn hoạt động đúng (không bị catch-all nuốt mất) — xác nhận qua thông báo lỗi ownership đúng ngữ cảnh "Bạn không có quyền xem job này" (không phải trang 404), tức route match đúng component `DesignResult`, không rơi vào catch-all.
- `AccessDenied.jsx` (agent tự quyết định làm luôn, đánh giá an toàn — chỉ đổi phần hiển thị lỗi 403 ở 3 trang admin, không đổi RBAC) — chưa test trực tiếp qua browser thật với tài khoản bị 403 thật (rủi ro thấp, chỉ đổi nhánh hiển thị, đã review code).
- Console sạch lỗi.
- Không phát hiện lỗi mới nào.
