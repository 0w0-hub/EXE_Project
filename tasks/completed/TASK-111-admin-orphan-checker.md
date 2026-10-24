# TASK-111

## Title

Kiểm tra dữ liệu mồ côi cho Admin (Admin Orphan Data Checker)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 14 — ý tưởng ChatGPT đề xuất mới (hỏi lại lần 8 ngày 2026-09-17). Vấn đề thật: qua nhiều task/migration (V1→V10) dự án đã tích luỹ nhiều bảng liên kết qua khoá ngoại LOGIC (không phải FK constraint cứng ở mọi nơi — kiểm tra thực tế khi code) — `design_jobs.room_id`/`preference_id`, `design_results.job_id`, `design_furniture_items.result_id`, `design_share.job_id`, `notifications.user_id`... Admin chưa có công cụ nào để tự kiểm tra xem có bản ghi nào bị "mồ côi" (tham chiếu tới ID không còn tồn tại — ví dụ do lỗi thao tác thủ công qua SQL trong quá khứ của chính các task trước) hay không.

## Scope

- Backend — package `admin` có sẵn (đọc kỹ `AdminController`/`AdminService`/`AdminDataExplorerController` (TASK-104) để theo đúng pattern RBAC `hasRole('ADMIN')` đã dùng xuyên suốt):
  - Controller mới `AdminDataIntegrityController` (hoặc mở rộng theo đúng cách các admin feature khác đã tách file riêng theo tính năng).
  - Endpoint `GET /api/v1/admin/integrity/orphans` — THUẦN READ-ONLY, chạy các kiểm tra sau bằng SQL/JPQL thật (không suy diễn, không bịa) và trả về danh sách bản ghi orphan tìm thấy (id + loại lỗi + bảng liên quan):
    1. `design_jobs` có `room_id` không tồn tại trong `rooms`.
    2. `design_jobs` có `preference_id` khác null nhưng không tồn tại trong `room_preferences`.
    3. `design_results` có `job_id` không tồn tại trong `design_jobs`.
    4. `design_furniture_items` có `result_id` không tồn tại trong `design_results`.
    5. `design_share` có `job_id` không tồn tại trong `design_jobs`.
    - Đọc kỹ tên bảng/cột THẬT trong các file migration (`backend/src/main/resources/db/migration/V1__init.sql` trở đi) trước khi viết query — KHÔNG đoán tên cột.
  - Mỗi loại kiểm tra trả về: tên kiểm tra, số lượng bản ghi orphan tìm thấy, danh sách ID cụ thể (giới hạn hiển thị tối đa 50 ID/loại kèm tổng số thật nếu nhiều hơn — tương tự cách TASK-104 giới hạn 20 rồi ghi "và N khác").
  - KHÔNG có endpoint sửa/xoá — chỉ báo cáo. Nếu tìm thấy orphan thật trong DB thật lúc verify, KHÔNG tự ý xoá dữ liệu — chỉ báo cáo lại cho coordinator quyết định.
- Frontend:
  - Trang mới `frontend/src/pages/admin/AdminDataIntegrity.jsx`, route mới `/admin/integrity` trong `App.jsx` (đúng pattern route admin khác, dùng `AdminRoute` guard).
  - Hiện kết quả từng loại kiểm tra dạng danh sách/thẻ, màu xanh nếu 0 orphan, màu cảnh báo nếu có orphan kèm danh sách ID.
  - KHÔNG tự thêm link vào `AdminDashboard.jsx`/`NavBar.jsx` — coordinator sẽ tự làm "nối dây" sau khi tất cả task trong round xong (đúng quy ước đã dùng nhiều lần, ví dụ TASK-104).

## Out of scope

- Không tự động xoá/sửa bản ghi orphan (chỉ báo cáo — quyết định xử lý nếu có là việc của coordinator/user sau khi xem báo cáo thật).
- Không kiểm tra MỌI bảng trong hệ thống — chỉ 5 mối quan hệ liệt kê ở Scope (đủ để có giá trị mà không quá phạm vi 1 task).
- Không đổi `Admin Data Explorer` (TASK-104) — công cụ khác, mục đích khác (tra cứu theo entity cụ thể, không phải quét toàn bộ tìm lỗi).

## Dependencies

TASK-104 (Admin Data Explorer — tham khảo pattern RBAC/route/UI admin read-only).

## Affected Services

Backend (`admin` package) + Frontend (trang mới + 1 route mới).

## Acceptance Criteria

- `mvn test` PASS, `npm run build` PASS.
- Gọi endpoint với JWT admin thật → trả đúng 5 mục kiểm tra, mỗi mục có số lượng thật (kỳ vọng 0 orphan trên dữ liệu hiện tại của dự án nếu mọi thao tác trước giờ đều sạch — đây CHÍNH LÀ kết quả mong đợi, không phải lỗi nếu tất cả đều 0).
- Tài khoản KHÔNG phải admin gọi endpoint → 403 đúng.
- Trang `/admin/integrity` hiện đúng kết quả thật, không crash dù có/không có orphan.
- Console sạch lỗi.

## Testing

Tự verify: `mvn test`, `npm run build`, `curl` với JWT admin thật (tài khoản có sẵn, ví dụ `task104-admin@homely.test` — đọc `tasks/state/current-state.md` để tìm tài khoản admin đã tạo trước đó) + JWT non-admin để test 403. Verify qua Docker + browser nếu có kết nối Claude-in-Chrome trong phiên của agent (không bắt buộc — coordinator sẽ verify UI thật ở vòng gộp cuối cùng của round này).

## Status

COMPLETED

## Coordinator verification

`mvn test`/`npm run build` PASS. Rebuild Docker đầy đủ. Thêm link nhanh "🩺 Kiểm tra dữ liệu" vào `AdminDashboard.jsx` (agent đúng theo yêu cầu không tự sửa file này). Tự verify curl trên container THẬT vừa rebuild: `GET /admin/integrity/orphans` với JWT admin thật → đúng 5 mục, tất cả `totalOrphanCount:0` (khớp báo cáo của agent — dữ liệu dự án sạch). Verify E2E qua Claude in Chrome (`task104-admin@homely.test`) — vào `/admin` thấy đúng 5 link nhanh; vào `/admin/integrity` → hiện đúng 5 thẻ kết quả màu xanh "✅ Không có bản ghi mồ côi" cho cả 5 mối quan hệ. Console sạch lỗi. Chạy lại bộ Playwright TASK-098 làm regression — 3/3 PASS. Không phát hiện lỗi mới.
