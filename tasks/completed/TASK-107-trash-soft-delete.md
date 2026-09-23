# TASK-107

## Title

Thùng rác — Xoá mềm và khôi phục thiết kế (Trash / Soft Delete & Restore)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 12 — ý tưởng ChatGPT đề xuất mới (hỏi lại lần 7 ngày 2026-09-17 tại `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`, sau khi dùng hết 6 ý tưởng round 10). Vấn đề thật: dự án hiện KHÔNG có bất kỳ endpoint xoá nào cho `DesignJob` (đã xác nhận qua `grep` — không có `@DeleteMapping` nào trong package `room`/`aidesign`) — user xoá nhầm 1 thiết kế (khi tính năng xoá được thêm sau này) sẽ mất dữ liệu vĩnh viễn ngay lập tức, không có cách khôi phục.

**Gộp luôn ý tưởng "Project Archive" (ChatGPT đề xuất cùng đợt) vào đây** — 2 ý tưởng trùng khái niệm "ẩn mà không xoá hẳn", làm cả 2 sẽ gây rối UX (2 khái niệm chồng chéo: archive vs trash). Thùng rác (xoá mềm + khôi phục + xoá vĩnh viễn) đầy đủ hơn, đã bao hàm giá trị của archive.

## Scope

- Migration Flyway mới **V10** (xác nhận `V9__design_job_custom_name.sql` là bản mới nhất tại thời điểm giao việc — `ls backend/src/main/resources/db/migration/` để xác nhận lại) — thêm cột `deleted_at DATETIME2 NULL` vào bảng `design_jobs` (NULL = chưa xoá, có giá trị = thời điểm xoá mềm).
- `DesignJob.java`: field `deletedAt` (Instant, nullable).
- `DesignJobRepository.java`: MỌI query hiện có dùng cho listing/lookup thông thường (`findByOwnerId...`, `listJobs` phía service) phải tự loại trừ `deletedAt IS NOT NULL` theo mặc định (đọc kỹ toàn bộ query hiện có trước khi sửa — bao gồm cả `listRecentJobs`/TASK-100 và bất kỳ chỗ nào khác dùng để hiển thị cho user, KHÔNG áp dụng cho `AdminDesignController`/Admin Data Explorer TASK-104, vốn cần thấy TOÀN BỘ dữ liệu kể cả đã xoá mềm để phục vụ tra cứu — admin KHÔNG bị lọc).
- `DesignController.java` — 3 endpoint mới:
  - `DELETE /api/v1/designs/jobs/{jobId}` — xoá mềm (set `deletedAt = now`), chỉ chủ sở hữu, đúng pattern kiểm tra ownership đã có (giống `toggleFavorite`/`setCustomName`).
  - `POST /api/v1/designs/jobs/{jobId}/restore` — khôi phục (set `deletedAt = null`).
  - `DELETE /api/v1/designs/jobs/{jobId}/permanent` — xoá VĨNH VIỄN, CHỈ cho phép khi job ĐÃ ở trong thùng rác (`deletedAt IS NOT NULL`) — tránh xoá nhầm trực tiếp không qua bước xoá mềm trước. Đọc kỹ quan hệ dữ liệu con (`design_results`, `design_furniture_items`, `design_share`/comments nếu có liên kết tới job này — xem `DesignResultWriter`/`DesignShare`) để xoá đúng thứ tự tránh vi phạm khoá ngoại, hoặc dùng cascade nếu DB đã cấu hình sẵn — tự kiểm tra kỹ bằng cách thử xoá thật trong lúc verify, không giả định.
  - `GET /api/v1/designs/trash` — danh sách job đã xoá mềm của user hiện tại (phân trang giống `listMine`), sắp theo `deletedAt` giảm dần.
- Frontend:
  - `frontend/src/pages/Projects.jsx`: thêm nút "🗑️" trên mỗi card (cạnh nút ✏️ đổi tên đã có từ TASK-106) — bấm xoá mềm, item biến mất khỏi danh sách ngay (optimistic hoặc gọi lại API, tự quyết định).
  - Trang mới `frontend/src/pages/Trash.jsx`, route mới `/trash` (yêu cầu đăng nhập, giống các route user thường khác trong `App.jsx`) — liệt kê job đã xoá mềm, mỗi item có nút "↺ Khôi phục" và "Xoá vĩnh viễn" (nút xoá vĩnh viễn PHẢI có bước xác nhận rõ ràng — ví dụ `window.confirm` hoặc modal, vì đây là hành động KHÔNG THỂ hoàn tác, tránh bấm nhầm).
  - Thêm link "🗑️ Thùng rác" vào đâu đó hợp lý trong điều hướng (menu "Tài khoản" dropdown ở `NavBar.jsx` đã có từ TASK-083/084/087 — đọc kỹ cấu trúc dropdown đó, thêm 1 mục mới theo đúng pattern các mục khác, KHÔNG tự nghĩ vị trí khác).

## Out of scope

- Không áp dụng xoá mềm cho `Room` (chỉ áp dụng cho `DesignJob`, đúng cấp độ mà Projects.jsx/Trash đang quản lý — 1 room có thể có nhiều job, xoá job không xoá room).
- Không tự động dọn rác sau N ngày (không có cron job/scheduled task nào trong dự án hiện tại — không tự thêm hạ tầng đó, ngoài phạm vi task).
- Không đổi hành vi tính lượt sử dụng gói (`usage/me`) — job đã xoá mềm/vĩnh viễn VẪN tính vào lượt đã dùng tháng đó (đã thật sự tiêu tốn 1 lượt generate, xoá không "hoàn" lại lượt — tránh lỗ hổng lách giới hạn gói bằng xoá-tạo lại liên tục).
- Không đổi `Room3DViewer.jsx`/`DesignResult.jsx`.

## Dependencies

TASK-080 (Projects.jsx), TASK-093 (usage limit, không đổi hành vi), TASK-100 (Recently Edited — phải tự loại trừ job đã xoá mềm), TASK-104 (Admin Data Explorer — KHÔNG lọc, admin thấy hết).

## Affected Services

Backend (`aidesign` package + migration V10 mới) + Frontend (`Projects.jsx`, trang `Trash.jsx` mới, `NavBar.jsx` thêm 1 link, `App.jsx` thêm 1 route, `api.js`).

## Acceptance Criteria

- `mvn test` PASS, `npm run build` PASS.
- Xoá mềm 1 job → biến mất khỏi Projects/Dashboard "Tiếp tục thiết kế" ngay; vào `/trash` → thấy đúng job đó.
- Bấm "Khôi phục" → job quay lại đúng vị trí trong Projects (không đổi `createdAt`, vẫn giữ đúng dữ liệu cũ).
- Bấm "Xoá vĩnh viễn" (sau khi xác nhận) → job biến mất khỏi cả Trash lẫn DB thật (verify bằng cách gọi lại API xác nhận 404); không để lại dữ liệu con mồ côi vi phạm khoá ngoại (verify không có lỗi 500 khi thao tác này).
- Gọi `DELETE .../permanent` cho 1 job CHƯA ở trong thùng rác (chưa xoá mềm trước) → đúng bị từ chối (400/409, không cho xoá thẳng).
- `usage/me` không đổi trước/sau khi xoá mềm hoặc vĩnh viễn 1 job đã tính vào lượt tháng này.
- Admin Data Explorer (TASK-104) vẫn tra cứu thấy job đã xoá mềm bình thường (không bị lọc).
- User khác không xoá/khôi phục được job không thuộc sở hữu (403/404 đúng pattern).
- Console sạch lỗi.

## Testing

Tự verify: `mvn test`, `npm run build`, `curl` với JWT thật — xoá mềm → xem trash → khôi phục → xoá mềm lại → xoá vĩnh viễn → xác nhận 404 khi gọi lại; test case xoá vĩnh viễn khi CHƯA xoá mềm (phải bị chặn); test `usage/me` không đổi; test xuyên chủ sở hữu. Verify qua Docker + browser nếu có kết nối Claude-in-Chrome trong phiên của agent (không bắt buộc — coordinator sẽ verify UI thật ở vòng gộp cuối, đặc biệt bước xác nhận trước khi xoá vĩnh viễn).

## Status

COMPLETED

## Coordinator verification

`mvn test`/`npm run build` PASS. Rebuild Docker đầy đủ. Tự verify curl matrix trên container THẬT vừa rebuild (đặc biệt case agent không tự làm được vì sandbox chặn tạo tài khoản admin qua SQL):
- Xoá mềm 1 job → `usage/me` giữ nguyên `used:6` trước/sau; `GET /trash` thấy đúng job.
- Khôi phục → job về lại `listMine` đúng.
- `POST restore` job không trong trash → đúng lỗi (agent đã test).
- `DELETE .../permanent` job CHƯA xoá mềm → đúng `400 JOB_NOT_IN_TRASH`.
- **Xác nhận Admin Data Explorer (TASK-104) và `admin/designs` KHÔNG lọc job đã xoá mềm** (gap duy nhất agent không tự verify được) — soft-delete 1 job rồi gọi `GET /admin/explorer/job?jobId=...` bằng JWT admin thật (`task104-admin@homely.test`) → vẫn trả đúng job + room + owner; `GET /admin/designs` vẫn liệt kê đúng jobId đó. Đúng như thiết kế.
Verify E2E qua Claude in Chrome (`task077-tester@example.com`) — bấm 🗑️ trên 1 card ở Projects → card biến mất ngay (8→7); vào `/trash` → đúng hiện job vừa xoá kèm cảnh báo rõ ràng; bấm "Khôi phục" → đúng "Thùng rác trống", job trở lại Projects. Link "🗑️ Thùng rác" trong dropdown "Tài khoản" hoạt động đúng. Console sạch lỗi. Chạy lại bộ Playwright TASK-098 làm regression — 3/3 PASS. Không phát hiện lỗi mới.
