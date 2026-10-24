# TASK-094

## Title

Trạng thái hệ thống cho Admin (Admin System Health — chỉ dữ liệu thật đo được)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 5 — ý tưởng "Admin System Health" ChatGPT đề xuất: admin hiện chỉ thấy số liệu NGHIỆP VỤ (`AdminDashboardController`/`AdminDashboardResponse` có sẵn — tổng user, tổng design job...) nhưng không có cách nhanh biết HỆ THỐNG có vấn đề gì không (job kẹt ở PROCESSING quá lâu, nhiều job FAILED gần đây, DB có phản hồi không).

## Scope

### Backend

- Đọc `backend/src/main/java/com/homely/api/admin/AdminDashboardController.java`, `AdminService.java`, `dto/AdminDashboardResponse.java` trước khi viết (mở rộng ĐÚNG file/pattern đã có, KHÔNG tạo controller mới nếu `AdminDashboardController` đã hợp lý cho 1 endpoint nữa).
- Thêm `GET /api/v1/admin/system-health` (auth, `@PreAuthorize("hasRole('ADMIN')")` giống các endpoint admin khác — đọc kỹ cách RBAC đã áp dụng, dùng LẠI đúng cách, không viết kiểu khác): trả về CHỈ dữ liệu THẬT đo được ngay lúc gọi, không bịa số liệu giả:
  - `databaseStatus`: "UP"/"DOWN" — thử 1 query đơn giản (ví dụ đếm user) trong `try/catch`, DOWN nếu exception.
  - `pendingJobsCount`: đếm `DesignJob` có `status = PENDING` hoặc `PROCESSING` NGAY LÚC NÀY (dữ liệu thật, không cache).
  - `failedJobsLast24h`: đếm `DesignJob` có `status = FAILED` VÀ `createdAt` trong 24h gần nhất.
  - `stuckJobsCount`: đếm job có `status = PROCESSING` NHƯNG `updatedAt` đã quá X phút (tự chọn ngưỡng hợp lý, ví dụ 10 phút — ghi rõ lý do chọn ngưỡng trong code/báo cáo) — dấu hiệu có thể job bị treo (không dùng để TỰ ĐỘNG sửa gì, chỉ hiển thị cảnh báo cho admin biết).
  - `checkedAt`: timestamp lúc gọi API (để hiển thị "Kiểm tra lúc...").

### Frontend

- `frontend/src/pages/admin/AdminDashboard.jsx`: đọc file trước, thêm 1 khối widget MỚI (không thay thế nội dung cũ) hiển thị đủ các số liệu trên, dùng đúng design token/class đã có (`.stat-tile` hoặc tương tự — xem file để biết đúng pattern). Màu sắc trạng thái: xanh nếu `databaseStatus=UP` và `stuckJobsCount=0`, cảnh báo (đỏ/vàng, dùng `--color-danger`/`--color-warning-*` có sẵn) nếu có bất thường.
- `frontend/src/services/api.js`: thêm hàm gọi endpoint mới.

## Out of scope

- Không tự động khắc phục job bị treo (chỉ hiển thị cảnh báo, không có nút "sửa"/"huỷ" job — đó là hành động phá huỷ dữ liệu, ngoài phạm vi, cần hỏi user nếu muốn làm sau).
- Không thêm poll tự động cho trang admin (chỉ tải khi vào trang/bấm làm mới — giữ đơn giản, khác `NotificationBell` vốn cần cập nhật liên tục).
- Không đụng `AdminUsers.jsx`, `AdminDesigns.jsx`, `NavBar.jsx`, `Room3DViewer.jsx`, `DesignResult.jsx`, `Projects.jsx`.

## Dependencies

`AdminDashboardController`/`AdminService` (module `admin`), `DesignJobRepository`.

## Affected Services

Backend (`admin` module, thêm 1 endpoint) + Frontend (`AdminDashboard.jsx` + `api.js`).

## Acceptance Criteria

- `mvn test` PASS, `npm run build` PASS.
- Gọi endpoint bằng tài khoản ADMIN thật → trả đủ 5 field, số liệu khớp với dữ liệu thật trong DB (kiểm chứng bằng cách tự đếm qua API khác đã có, ví dụ danh sách job admin).
- Gọi bằng tài khoản USER thường (không phải admin) → 403, đúng theo RBAC hiện có.
- Trang `/admin` (Dashboard admin) hiển thị đúng widget mới, không hồi quy nội dung cũ.
- Console sạch lỗi.

## Testing

- `mvn test` PASS, `npm run build` PASS — tự verify trước khi báo cáo xong.
- Verify API bằng `curl` trực tiếp tới backend đang chạy sẵn ở `http://localhost:8080` — có thể rebuild RIÊNG backend (`docker compose up -d --build backend`, KHÔNG rebuild `frontend`/`sqlserver`). Cần tài khoản ADMIN thật để test — kiểm tra `tasks/state/current-state.md`/log các session trước xem có sẵn tài khoản admin nào đã promote chưa; nếu không, tự promote 1 tài khoản test mới qua SQL trực tiếp vào container `homely_sqlserver` (đã có tiền lệ ở các task admin trước — tìm cách làm cũ trong lịch sử task nếu cần, hoặc dùng cách hợp lý nhất bạn biết) rồi re-login để lấy token có role ADMIN.
- KHÔNG dùng Claude-in-Chrome, KHÔNG rebuild `frontend` container — coordinator gộp rebuild Docker đầy đủ + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành.
- Báo cáo lại rõ: endpoint chính xác (path/method/response shape thật với số liệu thật).

## Status

COMPLETED

## Coordinator verification

Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật (`task094-admin@homely.test`, tài khoản agent đã tự promote qua SQL): vào `/admin` → hiện đúng khối "Trạng thái hệ thống" mới bên dưới nội dung cũ (không hồi quy) — "Cơ sở dữ liệu: Hoạt động" (xanh), "Job đang chờ/xử lý: 0", "Job lỗi 24h qua: 0", "Job nghỉ bị treo: 0", tất cả số liệu khớp trạng thái thật lúc test (không có job PENDING/PROCESSING/FAILED nào). Dark mode hiển thị đúng, không có vùng khó đọc. Console sạch lỗi. Không phát hiện lỗi mới nào.
