# TASK-104

## Title

Tra cứu dữ liệu nhanh cho Admin (Admin Data Explorer)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 10 — ý tưởng ChatGPT đề xuất mới (hỏi lại lần 6 ngày 2026-09-17). Vấn đề thật: `/admin/users` và `/admin/designs` (đã có từ lâu) chỉ cho xem TỪNG bảng riêng lẻ (danh sách user, danh sách design) — admin muốn tra cứu nhanh "1 user cụ thể có những room/design nào" hoặc "1 job cụ thể thuộc user nào" phải tự đối chiếu ID bằng tay giữa 2 trang, không có cách tra cứu xuyên bảng.

## Scope

- Backend — package `admin` có sẵn (đọc kỹ `AdminController`/`AdminService`/`AdminModerationController`/`AdminSystemHealthController` hiện có để theo đúng pattern RBAC `@PreAuthorize`/`hasRole('ADMIN')` đã dùng xuyên suốt, KHÔNG tự nghĩ cách xác thực khác):
  - Controller mới `AdminDataExplorerController` (hoặc mở rộng `AdminController` nếu ngắn gọn hơn — tự quyết định theo độ dài code, ưu tiên nhất quán với các admin controller khác đã tách riêng theo tính năng như `AdminModerationController`).
  - Endpoint `GET /api/v1/admin/explorer/user?email=...` (tìm đúng 1 user theo email, KHÔNG search mờ/like — dữ liệu nhạy cảm, tìm chính xác) → trả thông tin user (đã có sẵn qua `AdminService`, tái dùng) + danh sách room của user đó (id, roomType, createdAt) + với mỗi room, danh sách job (id, status, createdAt, isFavorite nếu TASK-103 đã merge trước — đọc lại `DesignJob.java` thời điểm code để biết chính xác field nào có, KHÔNG bịa field chưa tồn tại).
  - Endpoint `GET /api/v1/admin/explorer/job?jobId=...` (tìm 1 job theo UUID, trả về job + room liên kết + email chủ sở hữu — dùng để tra ngược "job này của ai").
  - Cả 2 endpoint: không tìm thấy → trả lỗi 404 đúng theo `ApiResponse`/exception pattern hiện có của dự án (đọc `GlobalExceptionHandler` hoặc tương đương), KHÔNG throw lỗi chung chung.
- Frontend:
  - Trang mới `frontend/src/pages/admin/AdminDataExplorer.jsx`, route mới `/admin/explorer` trong `App.jsx` (đọc kỹ khối các route `/admin/*` hiện có để thêm đúng vị trí + đúng guard `RequireAdmin`/tương đương đã dùng cho các route admin khác).
  - 2 ô tìm kiếm riêng biệt (theo email user / theo job ID), kết quả hiển thị dạng cây đơn giản (User → Room → Job) hoặc bảng lồng, đủ đọc được — không cần thiết kế phức tạp, đây là công cụ nội bộ cho admin.
  - Không tự thêm link điều hướng vào `AdminDashboard.jsx`/`NavBar.jsx` — coordinator sẽ tự làm phần "nối dây" này sau khi tất cả task trong round xong (tránh xung đột nếu có task khác cũng cần sửa `AdminDashboard.jsx`).

## Out of scope

- Không cho sửa/xoá dữ liệu qua trang này — THUẦN READ-ONLY (đã có `/admin/moderation` cho việc ẩn share, `/admin/users` cho đổi role — không lặp lại chức năng đó ở đây).
- Không thêm phân trang cho danh sách room/job trong kết quả tra cứu (số lượng thực tế mỗi user hiện tại rất nhỏ, không cần) — nếu muốn thận trọng, giới hạn hiển thị tối đa 20 room/job đầu tiên kèm ghi chú "và N room/job khác" thay vì phân trang đầy đủ.
- Không tự thêm field `isFavorite` nếu TASK-103 (chạy song song) chưa merge xong lúc agent này code — chỉ đọc field đã CÓ THẬT trong `DesignJob.java` tại thời điểm code, không đoán trước.

## Dependencies

Không phụ thuộc TASK-103 (chạy song song, không đụng file chung — cả 2 đều mở rộng package `aidesign`/`admin` nhưng ở các class/endpoint khác nhau).

## Affected Services

Backend (`admin` package) + Frontend (trang mới + 1 route mới trong `App.jsx`).

## Acceptance Criteria

- `mvn test` PASS, `npm run build` PASS.
- Tìm đúng email `task077-tester@example.com` → hiển thị đúng danh sách room/job thật của tài khoản đó (đối chiếu với trang Projects của chính tài khoản này).
- Tìm 1 jobId thật → hiển thị đúng room + email chủ sở hữu khớp.
- Tìm email/jobId không tồn tại → hiển thị đúng thông báo "không tìm thấy", không crash trang, không lỗi 500.
- Tài khoản KHÔNG phải admin gọi 2 endpoint mới → 403 đúng (test qua curl).
- Console sạch lỗi.

## Testing

Tự verify: `mvn test`, `npm run build`, `curl` với JWT admin thật (`task097-admin@homely.test` hoặc admin có sẵn — đọc `tasks/state/current-state.md` để tìm tài khoản admin đã tạo trước đó nếu cần) + JWT non-admin để test 403, verify qua Docker + browser nếu có kết nối Claude-in-Chrome trong phiên của agent (không bắt buộc — coordinator sẽ verify UI thật ở vòng gộp cuối round).

## Status

COMPLETED

## Coordinator verification

Sau khi agent hoàn thành (agent đã tự verify curl đầy đủ qua container tạm thời trong lúc `homely_backend` chưa rebuild — dọn sạch container tạm trước khi bàn giao), coordinator thêm link nhanh "🔎 Tra cứu dữ liệu" vào `AdminDashboard.jsx` (agent đúng theo yêu cầu không tự sửa file này). Rebuild Docker đầy đủ, verify lại qua `curl` trên container THẬT vừa rebuild — `GET /admin/explorer/user?email=task077-tester@example.com` → 200, đúng dữ liệu thật (room + job khớp trang Projects của tài khoản đó). Verify E2E qua Claude in Chrome (`task104-admin@homely.test`) — vào `/admin` thấy đúng 4 link nhanh (thêm "🔎 Tra cứu dữ liệu"), bấm vào điều hướng đúng `/admin/explorer`; tìm theo email → hiện đúng cây User → Room → Job với dữ liệu thật; tìm theo job ID không tồn tại (`00000000-...`) → hiện đúng "Không tìm thấy job với ID này.", không crash. Console sạch lỗi. Không phát hiện lỗi mới.
