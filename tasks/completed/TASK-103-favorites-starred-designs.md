# TASK-103

## Title

Đánh dấu thiết kế yêu thích (Favorites / Starred Designs)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 10 — ý tưởng ChatGPT đề xuất mới (hỏi lại lần 6 ngày 2026-09-17 tại `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`, sau khi dùng hết 26 ý tưởng cũ). Vấn đề thật: `task077-tester@example.com` đã có 6+ thiết kế hoàn thành (xem trang Projects) nhưng không có cách nào đánh dấu 1-2 thiết kế quan trọng để quay lại nhanh — phải lướt/tìm mỗi lần.

## Scope

- Migration Flyway MỚI: `database/migrations/V8__design_job_favorite.sql` (hoặc đúng đường dẫn migration thật của dự án — đọc `backend/src/main/resources/db/migration/` để xác nhận đường dẫn chính xác, KHÔNG đoán) — thêm cột `is_favorite BIT NOT NULL DEFAULT 0` vào bảng `design_jobs`. **QUAN TRỌNG: dùng ĐÚNG số hiệu V8** (không tự ý đổi số — task khác trong cùng round KHÔNG đụng migration nào khác nên V8 chắc chắn còn trống tại thời điểm bắt đầu; xác nhận lại bằng cách `ls backend/src/main/resources/db/migration/` trước khi tạo file, phải thấy V7 là file mới nhất).
- `DesignJob.java`: thêm field `isFavorite` (boolean, mặc định `false`).
- `DesignJobSummaryResponse`/`DesignJobResponse` (đọc kỹ 2 DTO này trước — đều là record, thêm field vào CUỐI để không phá JSON các nơi đang dùng): thêm `isFavorite`.
- `DesignController.java`: endpoint mới `POST /api/v1/designs/jobs/{jobId}/toggle-favorite` (toggle qua lại true/false, trả về `DesignJobResponse` mới nhất) — đúng pattern route `/jobs/{jobId}/...` đã có (`duplicate`).
- `DesignController.listMine`: thêm query param optional `favoriteOnly` (boolean, mặc định `false`) — khi `true`, chỉ trả job có `isFavorite = true` (kết hợp AND với filter `status` nếu có, không thay thế).
- `DesignService.java`: thêm `toggleFavorite(ownerId, jobId)` (đọc kỹ pattern `duplicateJob`/`getJobWithResult` để xác thực đúng chủ sở hữu trước khi cho phép, tránh lỗi bảo mật — user A không được đánh dấu yêu thích job của user B) + mở rộng `listJobs` nhận thêm tham số `favoriteOnly`.
- `frontend/src/services/api.js`: thêm `designApi.toggleFavorite(jobId)`, mở rộng `designApi.listMine` nhận thêm tham số `favoriteOnly` (optional, giữ backward-compatible với cách gọi cũ không truyền tham số này).
- `frontend/src/pages/Projects.jsx`:
  - Icon ⭐/☆ (đã yêu thích/chưa) ở góc mỗi card, bấm gọi `toggleFavorite` rồi cập nhật lại đúng item đó trong `items` (không cần fetch lại toàn bộ danh sách).
  - 1 checkbox/toggle "⭐ Chỉ hiện yêu thích" đặt NGAY TRÊN dòng `TABS` hiện có (dòng render các pill Tất cả/Hoàn thành/...), KHÔNG chèn vào trong mảng `TABS` (đây là filter ĐỘC LẬP/kết hợp AND với status, khác bản chất filter loại trừ lẫn nhau của TABS).

## Out of scope

- Không thêm "yêu thích" cho `Room` (thực thể phòng) — chỉ cho `DesignJob` (mỗi lần generate là 1 bản ghi riêng, đúng với những gì Projects.jsx đang liệt kê).
- Không đổi `Dashboard.jsx`/`RecentDesigns.jsx` (TASK-100) — không thêm hiển thị yêu thích ở đó, giữ nguyên phạm vi.
- Không sửa `Room3DViewer.jsx`/`DesignResult.jsx` — 2 file này có task khác (coordinator tự làm) đang đụng trong CÙNG round, tránh xung đột.
- Không sửa "Room & Design Sorting" — ý tưởng khác từ cùng lần hỏi ChatGPT, để dành round sau.

## Dependencies

TASK-080 (tìm kiếm trên Projects), TASK-085 (không liên quan trực tiếp nhưng cùng file). Không phụ thuộc TASK-104 (Admin Data Explorer, chạy song song, không đụng file chung).

## Affected Services

Backend (`aidesign` package + 1 migration mới V8) + Frontend (`Projects.jsx`, `api.js`).

## Acceptance Criteria

- `mvn test` PASS, `npm run build` PASS.
- Bấm ⭐ trên 1 card → icon đổi trạng thái ngay (không cần reload), gọi lại API xác nhận `isFavorite: true` thật trong response.
- Bật "Chỉ hiện yêu thích" → danh sách chỉ còn đúng các job đã đánh dấu; tắt lại → về danh sách đầy đủ như cũ.
- Kết hợp filter trạng thái (vd "Hoàn thành") + "Chỉ hiện yêu thích" → đúng cả 2 điều kiện (AND), không phải OR.
- User khác không đánh dấu được job không thuộc sở hữu của mình (test qua curl: 403/404 đúng theo pattern lỗi hiện có của dự án).
- Không hồi quy: phân trang, tìm kiếm, checkbox so sánh 2 thiết kế (TASK-077), filter trạng thái hiện có.
- Console sạch lỗi.

## Testing

Tự verify: `mvn test`, `npm run build`, `curl` với JWT thật (2 tài khoản khác nhau để test case 403/404 xuyên chủ sở hữu), verify qua Docker + browser nếu có kết nối Claude-in-Chrome trong phiên của agent (không bắt buộc — coordinator sẽ verify UI thật ở vòng gộp cuối round cùng TASK-104/105).

## Status

COMPLETED

## Coordinator verification

Rebuild Docker đầy đủ (`docker compose build backend frontend` + recreate) sau khi cả 2 agent round 10 (TASK-103/104) xong + TASK-105 (coordinator tự làm) xong. `mvn test`/`npm run build` PASS. Tự chạy lại `curl` matrix mà agent đã đề nghị (agent không tự làm được vì bị chặn `docker compose restart`):
- Toggle favorite ON cho job thật của `task077-tester@example.com` → response `isFavorite: true` đúng.
- `GET /designs?favoriteOnly=true` → đúng chỉ trả 1 job (job vừa đánh dấu).
- `GET /designs?favoriteOnly=true&status=FAILED` (kết hợp AND với status không khớp) → đúng trả rỗng — xác nhận AND không phải OR.
- Toggle favorite bằng JWT của user khác (`task104-user@homely.test`, không sở hữu job) → đúng `403 JOB_ACCESS_DENIED`.
- Toggle lại về `false` để dọn sạch dữ liệu test.
Verify E2E qua Claude in Chrome (`task077-tester@example.com`) — trang Projects hiện đúng checkbox "⭐ Chỉ hiện yêu thích" phía trên dải TABS; bấm ⭐/☆ trên 1 card → đổi trạng thái ngay không cần tải lại; bật filter → đúng chỉ còn 1 card yêu thích; bỏ yêu thích lúc filter đang bật → đúng card biến mất, hiện "Chưa có thiết kế nào ở trạng thái này" (đúng ngữ nghĩa AND-filter). Console sạch lỗi. Chạy lại bộ Playwright TASK-098 làm regression — 3/3 PASS. Không phát hiện lỗi mới.
