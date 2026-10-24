# TASK-082

## Title

Trung tâm thông báo — báo khi thiết kế AI tạo xong (Notification Center — rút gọn)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 2, ý tưởng lấy từ ChatGPT (cùng phiên hội thoại TASK-077/078/079: `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) — "Notification Center": user hiện chỉ biết design đã tạo xong bằng cách đứng nhìn trang kết quả tự poll (2s/lần, xem `DesignResult.jsx`) hoặc tự vào lại "Dự án của tôi" kiểm tra — không có cách nào biết "có gì mới" nếu rời khỏi trang.

**THU HẸP PHẠM VI so với đề xuất gốc ChatGPT** (chỉ làm đúng 1 loại sự kiện THẬT SỰ có nguồn dữ liệu server thật, không bịa): CHỈ thông báo khi 1 design job của user chuyển sang `COMPLETED` hoặc `FAILED` — đây là sự kiện server-side thật, xác định rõ ràng, dễ trace. KHÔNG làm "export completed" (hành động client-side, server không biết), "shared design" (hành động của chính user, tự thông báo cho chính mình là thừa), "budget exceeded" (tính toán client-side tạm thời ở `Room3DViewer`, TASK-079, không phải state server biết).

## Scope

### Backend

- Đọc `backend/src/main/java/com/homely/api/aidesign/DesignJobProcessor.java` (dòng ~52/58/62, nơi set status `PROCESSING`/`COMPLETED`/`FAILED`) và module `template` (pattern Entity/Repository/dto/Controller/Service đơn giản) trước khi viết.
- Migration mới `backend/src/main/resources/db/migration/V5__notifications.sql` (kiểm tra đúng V1-V4 đã có trước khi đặt số — V4 đã dùng ở TASK-078, KHÔNG trùng số): bảng `notification` — `id UUID PK`, `user_id` (FK), `job_id` (FK, để link sang trang kết quả), `type NVARCHAR(30)` (giá trị `DESIGN_COMPLETED` hoặc `DESIGN_FAILED`), `message NVARCHAR(255)`, `is_read BIT DEFAULT 0`, `created_at`.
- Module mới `backend/src/main/java/com/homely/api/notification/` (package riêng theo ADR-0002, không nhét vào `aidesign`):
  - Entity/Repository/Service/Controller theo đúng layering đã có.
  - `DesignJobProcessor.java`: sau khi `job.setStatus("COMPLETED")` hoặc `job.setStatus("FAILED")` (chỗ đã xác định ở trên), gọi thêm 1 lời gọi tạo notification (ví dụ inject `NotificationService`, method `notifyJobStatus(job)` — tự đặt tên hợp lý). CHỈ THÊM lời gọi, KHÔNG đổi logic xử lý job hiện có.
  - `GET /api/v1/notifications` (auth, chỉ của chính user, sort mới nhất trước, có thể phân trang đơn giản hoặc giới hạn top 20 — tự quyết định theo mức đơn giản nhất đáp ứng đủ acceptance criteria).
  - `GET /api/v1/notifications/unread-count` (auth) — trả số nguyên.
  - `PATCH /api/v1/notifications/{id}/read` (auth, chỉ đánh dấu đúng notification CỦA CHÍNH user đó — check ownership như các module khác).
  - `PATCH /api/v1/notifications/read-all` (auth).

### Frontend

- `frontend/src/services/api.js`: thêm `notificationApi` (list, unreadCount, markRead, markAllRead) — đọc file trước để theo đúng pattern.
- `frontend/src/components/NavBar.jsx`: thêm icon chuông 🔔 (hoặc icon chữ nếu dự án không dùng icon library — kiểm tra file trước) có badge số chưa đọc, click mở dropdown danh sách thông báo gần nhất (message + thời gian + trạng thái đọc/chưa đọc), click 1 thông báo → đánh dấu đã đọc + điều hướng sang `/designs/{jobId}` (dùng `job_id` đã lưu). Poll `unread-count` định kỳ đơn giản (ví dụ mỗi 15-30s bằng `setInterval`, dọn dẹp đúng lúc unmount) — KHÔNG cần WebSocket/SSE, giữ đơn giản đúng quy mô MVP hiện tại.

## Out of scope

- Không làm "export completed"/"shared design"/"budget exceeded" (xem lý do ở Goal).
- Không đụng `Dashboard.jsx` (task khác trong round này — Onboarding — đang đụng file đó song song).
- Không đụng `Projects.jsx`, `Room3DViewer.jsx`, `DesignResult.jsx`.
- Không dùng WebSocket/SSE/push notification thật — polling đơn giản là đủ ở quy mô hiện tại.

## Dependencies

Module `template` (pattern tham khảo), `DesignJobProcessor.java` (điểm gắn sự kiện), `DesignService`/`RoomService` (pattern check ownership).

## Affected Services

Backend (module mới `notification`, migration V5, sửa nhỏ `DesignJobProcessor.java`) + Frontend (`NavBar.jsx`, `api.js`).

## Acceptance Criteria

- `mvn test` PASS, `npm run build` PASS.
- Tạo 1 design job mới (`AI_PROVIDER=mock`, xử lý gần như tức thì) → sau khi job chuyển `COMPLETED`, gọi `GET /api/v1/notifications` (curl, có token) → thấy đúng 1 notification mới `type=DESIGN_COMPLETED` đúng `job_id`.
- `GET /api/v1/notifications/unread-count` → đúng số lượng notification `is_read=false`.
- `PATCH /api/v1/notifications/{id}/read` → gọi lại `unread-count` giảm đúng 1.
- User A không đọc/thấy được notification của User B (test bằng 2 tài khoản, 403 hoặc không có trong danh sách — tự quyết định response phù hợp theo pattern ownership đã dùng ở module khác).
- Icon chuông ở `NavBar.jsx` hiện đúng badge số khi có thông báo chưa đọc, dropdown hiện đúng danh sách, click vào 1 thông báo điều hướng đúng trang kết quả + đánh dấu đã đọc.
- Console sạch lỗi.

## Testing

- `mvn test` PASS, `npm run build` PASS — tự verify trước khi báo cáo xong.
- Verify API bằng `curl` trực tiếp tới backend đang chạy sẵn ở `http://localhost:8080` — có thể rebuild RIÊNG backend (`docker compose up -d --build backend`, KHÔNG rebuild `frontend`/`sqlserver`, đúng quy ước round trước) để áp dụng migration V5 + code Java mới, test đủ các case ở Acceptance Criteria (tự tạo tài khoản/room/job mới qua API nếu cần, có thể dùng `task077-tester@example.com` / `Test1234!` có sẵn cho 1 tài khoản, tự đăng ký thêm 1 tài khoản B để test cách ly dữ liệu).
- KHÔNG dùng Claude-in-Chrome, KHÔNG rebuild `frontend` container — coordinator gộp rebuild Docker đầy đủ + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành.
- Báo cáo lại rõ: file đã đổi, endpoint mới chính xác (path/method/response shape thật) để coordinator verify UI đúng luồng.

## Status

COMPLETED

## Coordinator verification

Rebuild Docker (`docker compose up -d --build`, gộp chung với TASK-080/081) + verify E2E qua Docker + browser thật (`task080-onboard@example.com`):
- Tạo room + job mới qua API → job `COMPLETED` gần như tức thì (`AI_PROVIDER=mock`) → mở lại Dashboard → icon chuông hiện đúng badge đỏ "1".
- Bấm chuông → dropdown hiện đúng "Thiết kế AI của bạn đã hoàn thành." + thời gian thật.
- Bấm vào thông báo → điều hướng đúng sang `/designs/{jobId}` (đúng job vừa tạo) + badge biến mất (đã đánh dấu đọc).
- Console sạch lỗi.
- Không phát hiện lỗi mới nào (agent đã tự phát hiện + sửa 1 lỗi thật lúc tự verify — xem mục "Bug caught and fixed" trong báo cáo agent, đã fix trước khi bàn giao: SQL Server từ chối `ORDER BY` trùng lặp giữa tên method repository suy ra tự động và `Sort` tường minh truyền vào `PageRequest`).
