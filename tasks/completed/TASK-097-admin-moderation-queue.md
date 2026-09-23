# TASK-097

## Title

Hàng đợi kiểm duyệt thiết kế chia sẻ công khai cho Admin (Admin Content Moderation Queue)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 6 — ý tưởng "Admin Content Moderation Queue" ChatGPT đề xuất ở round 5. Vấn đề thật: từ TASK-078, user có thể bật chia sẻ công khai (`/share/{token}`) bất kỳ thiết kế nào — admin hiện KHÔNG có cách nào xem danh sách các thiết kế đang được chia sẻ công khai hay ẩn 1 thiết kế không phù hợp.

**Quyết định thiết kế quan trọng** (khác hành vi "chờ duyệt trước" mà tên gọi gốc có thể gợi ý): chia sẻ MỚI vẫn hoạt động NGAY LẬP TỨC khi user bật (giữ đúng hành vi TASK-078 đã có, không phá UX người dùng thật) — admin CHỈ có khả năng ẨN (reject) 1 chia sẻ đã có SAU KHI nó đã công khai, giống mô hình kiểm duyệt "hậu kiểm" phổ biến (post-moderation), không phải "duyệt trước" (pre-approval, sẽ làm chậm mọi user dù tuyệt đại đa số nội dung vô hại).

## Scope

### Backend

- Đọc kỹ trước khi viết: `backend/src/main/java/com/homely/api/sharing/DesignShare.java`, `ShareService.java`, `ShareController.java`, `PublicShareController.java`, migration `V4__design_share_comments.sql` (không trùng số — kiểm tra V1-V6 đã có, dùng `V7`).
- Migration `backend/src/main/resources/db/migration/V7__design_share_moderation.sql`: thêm cột `moderation_status NVARCHAR(20) NOT NULL DEFAULT 'APPROVED'` vào bảng `design_share` (mặc định `APPROVED` — giữ đúng hành vi hiện có, chia sẻ hoạt động ngay, không phá dữ liệu cũ).
- `PublicShareController` (đọc trước, sửa đúng chỗ): endpoint public `GET /api/v1/public/shares/{token}` hiện tại — thêm điều kiện: nếu `moderation_status = 'REJECTED'` → trả 404 giống hệt trường hợp `enabled=false` (không tiết lộ lý do cụ thể cho người xem công khai, tránh rò rỉ thông tin nội bộ).
- Module `admin` — thêm vào `AdminService`/1 controller mới `AdminModerationController` (theo đúng pattern `AdminSystemHealthController` TASK-094 vừa thêm — controller riêng vì path khác `/admin/dashboard`):
  - `GET /api/v1/admin/shares` (auth ADMIN): danh sách TẤT CẢ `design_share` (kể cả không thuộc admin) — mỗi item gồm `shareId`, `jobId`, `roomType` (join sang `design_jobs`/`rooms` nếu tiện, hoặc gọi qua `DesignService` như TASK-084 đã làm cross-module), `shareToken`, `enabled`, `moderationStatus`, `createdAt`, `commentCount` (đếm `design_comment` theo `share_id`). Hỗ trợ `?status=PENDING|APPROVED|REJECTED` filter đơn giản (dù mặc định mọi share mới đã `APPROVED`, giữ field `status` để tương lai có thể đổi default nếu cần — không tự thêm trạng thái PENDING thật nào lúc tạo, chỉ chừa chỗ).
  - `PATCH /api/v1/admin/shares/{shareId}/moderate` (auth ADMIN): body `{ status: "APPROVED" | "REJECTED" }`, cập nhật `moderation_status`. KHÔNG xoá dữ liệu (`design_share`/`design_comment` vẫn giữ nguyên, REJECTED chỉ ẩn khỏi endpoint public).

### Frontend

- Trang mới `frontend/src/pages/admin/AdminModeration.jsx`, route `/admin/moderation` (dùng `AdminRoute` như 3 trang admin khác, đọc `App.jsx` trước).
  - Bảng danh sách share (dùng class `.table` có sẵn, giống `AdminDesigns.jsx` — đọc file đó làm pattern tham khảo, KHÔNG sửa file đó).
  - Mỗi dòng có nút "Ẩn" (nếu đang APPROVED) / "Khôi phục" (nếu đang REJECTED) gọi endpoint moderate.
- `frontend/src/services/api.js`: thêm hàm gọi 2 endpoint mới.
- KHÔNG tự thêm link vào `NavBar.jsx` — coordinator gộp thêm sau (NavBar hiện chỉ có link `/admin` dashboard tổng, có thể cần thêm điều hướng phụ trong chính trang `/admin` hoặc để nguyên — tự quyết định hợp lý nhất, ghi rõ trong báo cáo).

## Out of scope

- Không làm "duyệt trước khi công khai" (xem quyết định thiết kế ở Goal).
- Không xoá cứng `design_share`/`design_comment` (chỉ ẩn qua `moderation_status`).
- Không đụng `AdminDashboard.jsx`, `AdminUsers.jsx`, `AdminDesigns.jsx` (chỉ ĐỌC `AdminDesigns.jsx` làm pattern, không sửa), `NavBar.jsx`, `DesignResult.jsx`, `SharedDesign.jsx` TRỪ đúng 1 điều kiện thêm vào `PublicShareController` (backend, không phải file frontend `SharedDesign.jsx`).

## Dependencies

Module `sharing` (TASK-078), `AdminSystemHealthController` (TASK-094, pattern controller admin mới), `AdminDesigns.jsx` (pattern bảng admin).

## Affected Services

Backend (`sharing` module sửa nhỏ + module `admin` thêm 1 controller, migration V7) + Frontend (trang mới + `api.js`).

## Acceptance Criteria

- `mvn test` PASS, `npm run build` PASS.
- `GET /api/v1/admin/shares` (ADMIN) → trả đúng danh sách share thật đang có (đối chiếu với dữ liệu đã tạo ở TASK-078/091 testing trước đó).
- `PATCH .../moderate` với `REJECTED` → gọi lại `GET /api/v1/public/shares/{token}` (không auth) → trả 404 (giống hệt case `enabled=false` cũ).
- `PATCH .../moderate` với `APPROVED` lại (khôi phục) → share công khai xem được bình thường trở lại.
- User thường (không phải ADMIN) gọi 2 endpoint mới → 403.
- Trang `/admin/moderation` hiển thị đúng danh sách + nút ẩn/khôi phục hoạt động qua UI.
- Console sạch lỗi.

## Testing

- `mvn test` PASS, `npm run build` PASS — tự verify trước khi báo cáo xong.
- Verify API bằng `curl` trực tiếp tới backend đang chạy sẵn ở `http://localhost:8080` — có thể rebuild RIÊNG backend (`docker compose up -d --build backend`, KHÔNG rebuild `frontend`/`sqlserver`). Dùng share thật đã có từ `task077-tester@example.com` (TASK-078 đã bật share cho ít nhất 1 job) + tài khoản admin đã có từ TASK-094 (`task094-admin@homely.test`, kiểm tra file/log TASK-094 để lấy đúng thông tin đăng nhập).
- KHÔNG dùng Claude-in-Chrome, KHÔNG rebuild `frontend` container — coordinator gộp rebuild Docker đầy đủ + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành.
- Báo cáo lại rõ: endpoint chính xác (path/method/request/response shape thật), quyết định về việc có thêm điều hướng nào tới `/admin/moderation` hay không.

## Status

COMPLETED

## Coordinator verification

Agent phát hiện thêm 1 việc đáng làm (không phải lỗi, mà là khoảng trống UX có thật): `/admin/users` và `/admin/designs` vốn đã tồn tại từ lâu nhưng CHƯA TỪNG có điều hướng nào trong app (chỉ vào được bằng gõ URL trực tiếp) — nếu không xử lý, `/admin/moderation` mới sẽ rơi vào đúng tình trạng tương tự. Coordinator thêm 1 dải link nhanh (👤 Người dùng / 🎨 Thiết kế / 🛡️ Kiểm duyệt chia sẻ) vào đầu `AdminDashboard.jsx` — additive, không đụng nội dung cũ, giải quyết cùng lúc cho cả 3 trang admin con.

Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật (`task097-admin@homely.test`, tài khoản agent tự tạo — không tái dùng được tài khoản admin TASK-094 vì mật khẩu không được ghi lại, đúng nguyên tắc bảo mật): vào `/admin` → 3 link nhanh hiện đúng → bấm "Kiểm duyệt chia sẻ" → bảng hiện đúng 3 share thật, đúng số bình luận từng dòng. Bấm "Ẩn" 1 dòng → badge đổi đúng "Đã ẩn" + nút đổi thành "Khôi phục" → xác nhận qua `curl` trực tiếp: `GET /api/v1/public/shares/{token}` (không auth) trả đúng 404. Bấm "Khôi phục" → xác nhận lại `curl` trả đúng 200 (khôi phục thành công, không để lại dữ liệu bẩn trong DB dùng chung). Console sạch lỗi. Không phát hiện lỗi mới nào (khác phát hiện của agent về thiếu điều hướng admin, đã xử lý ở trên).
