# TASK-106

## Title

Đặt tên riêng cho thiết kế + Sắp xếp danh sách (Design Naming Assistant + Room & Design Sorting)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 11 — dùng nốt 2/3 ý tưởng còn dư từ round 10 (hỏi ChatGPT lần 6 ngày 2026-09-17, đã chọn 3/6 ý tưởng cho round 10: Favorites/Admin Data Explorer/Preview Mode). Gộp 2 ý tưởng còn lại thành 1 task DUY NHẤT (khác round 10) vì cả 2 CÙNG cần sửa `frontend/src/pages/Projects.jsx` và `DesignController.listMine`/`DesignService.listJobs` — giao cho 2 agent song song sẽ lặp lại đúng rủi ro xung đột đã né ở round 10 (Favorites/Sorting cùng đụng 1 method). Gộp lại 1 agent duy nhất làm cả 2, tương tự tinh thần TASK-098 (bản chất không tách song song được).

**Ý tưởng thứ 3 ChatGPT đề xuất cùng đợt — "Design Metadata Editor" — CỐ TÌNH KHÔNG LÀM**: cho phép sửa lại style/budget/room type sau khi đã tạo thiết kế có rủi ro khái niệm "sửa ngược lịch sử" — các trường này (`RoomPreference.style`/`budget`/...) là INPUT THẬT đã dùng để AI sinh ra kết quả (`estimatedCost`, decor description), nhiều tính năng đã có (Live Budget Guard TASK-079, Design Health Check TASK-101, budget-bar TASK-015) đều so sánh dựa trên preference GỐC này. Cho sửa lại sau sẽ làm các phép so sánh đó sai lệch với thực tế đã generate, vi phạm tinh thần "never fabricate/misrepresent data". Phần AN TOÀN duy nhất của ý tưởng này (đặt tên riêng dễ nhận biết) đã trùng hoàn toàn với "Design Naming Assistant" — không cần làm thêm.

## Scope

### Phần 1 — Design Naming Assistant

- Migration Flyway mới **V9** (đã xác nhận `V8__design_job_favorite.sql` — từ TASK-103 round 10 — là bản mới nhất tại thời điểm giao việc; `ls backend/src/main/resources/db/migration/` để xác nhận lại trước khi tạo file) — thêm cột `custom_name NVARCHAR(200) NULL` vào bảng `design_jobs` (nullable — `NULL` nghĩa là chưa đặt tên riêng, dùng tên tự sinh làm mặc định, không bịa giá trị mặc định).
- `DesignJob.java`: field `customName` (String, nullable).
- `DesignJobSummaryResponse`/`DesignJobResponse`: thêm `customName` (cuối record, không phá JSON cũ).
- `DesignController.java`: endpoint `PATCH /api/v1/designs/jobs/{jobId}/name` (body `{ "customName": "..." }`, cho phép gửi `null`/rỗng để XOÁ tên riêng, quay về tên tự sinh) — dùng đúng pattern kiểm tra chủ sở hữu đã có (`getOwnedJob`/tương đương, giống `toggleFavorite` từ TASK-103).
- Hàm tự sinh tên hiển thị (KHÔNG gọi LLM — thuần công thức từ dữ liệu đã có, ví dụ `${roomType} · ${style} · ${widthMeters}×${lengthMeters}m` hoặc rút gọn nếu thiếu field) — có thể viết ở backend (thêm field `suggestedName` tính sẵn vào response) HOẶC frontend (tính từ dữ liệu response đã có) — tự quyết định chỗ hợp lý hơn, ưu tiên backend nếu cần join `roomType`+`style` từ 2 bảng khác nhau mà frontend hiện chưa có sẵn cả 2 cùng lúc ở nơi hiển thị tên.
- Frontend: `frontend/src/pages/Projects.jsx` — mỗi card hiện `customName` nếu có, ngược lại hiện tên tự sinh; nút bút chì (✏️) mở ô nhập inline (không cần modal riêng) để đổi tên, Enter/blur để lưu, Esc để huỷ; để trống rồi lưu → quay về tên tự sinh (gọi API với `customName: null`).

### Phần 2 — Room & Design Sorting

- `DesignController.listMine`: thêm query param optional `sort` (string, giá trị hợp lệ: `createdAt_desc` (mặc định, giữ đúng hành vi cũ), `createdAt_asc`, `updatedAt_desc`, `roomType_asc`) — validate giá trị, không hợp lệ → dùng mặc định, KHÔNG lỗi 400 (tránh phá trải nghiệm nếu FE gửi giá trị cũ/lạ).
- `DesignService.listJobs`: nhận thêm tham số `sort`, map sang `Sort` object tương ứng (đọc kỹ cách `Pageable`/`Sort` đang được dựng ở `listMine` hiện tại, giữ nguyên `Sort.by("createdAt").descending()` làm mặc định khi `sort` rỗng/không hợp lệ).
- Frontend: `frontend/src/services/api.js` — `listMine` nhận thêm tham số `sort` (optional, backward-compatible). `Projects.jsx` — thêm dropdown "Sắp xếp theo" cạnh ô tìm kiếm, các lựa chọn: "Mới tạo trước" (mặc định), "Cũ nhất trước", "Cập nhật gần đây", "Tên loại phòng A-Z". Đổi lựa chọn → gọi lại API với `sort` mới (giữ nguyên `status`/`favoriteOnly` đang chọn).

### Vị trí chèn trong Projects.jsx (đọc lại file thật trước khi sửa — đã bị TASK-103 sửa ở round trước, có thêm checkbox "⭐ Chỉ hiện yêu thích" phía trên dải TABS)

- Dropdown sắp xếp: đặt CẠNH ô tìm kiếm hiện có (cùng hàng hoặc ngay dưới, tự quyết định theo bố cục hợp lý).
- Tên riêng + nút bút chì: trong từng card, KHÔNG đụng vị trí checkbox so sánh (TASK-077)/icon yêu thích (TASK-103) đã có trên mỗi card — thêm dòng tên MỚI, không thay thế `<h3>` hiện có (có thể đổi nội dung `<h3>` để hiện tên thật, tự quyết định miễn không vỡ layout đã có).

## Out of scope

- KHÔNG làm "Design Metadata Editor" (lý do ở Goal).
- Không sắp xếp lại lưới PHÒNG ở Dashboard — chỉ áp dụng cho trang Projects (danh sách thiết kế).
- Không nhớ lựa chọn sort qua `localStorage` giữa các phiên — session-only (state React thường), giữ đơn giản.
- Không đổi `DesignResult.jsx`/`Room3DViewer.jsx`.

## Dependencies

TASK-080 (tìm kiếm), TASK-103 (favorites, cùng file `Projects.jsx`/`listMine` — đọc lại code thật của TASK-103 trước khi sửa để không ghi đè, đặc biệt tham số `favoriteOnly` đã có trong `listMine`/`designApi.listMine`).

## Affected Services

Backend (`aidesign` package + 1 migration mới V9) + Frontend (`Projects.jsx`, `api.js`).

## Acceptance Criteria

- `mvn test` PASS, `npm run build` PASS.
- Card chưa đặt tên riêng → hiện đúng tên tự sinh từ dữ liệu thật (không bịa). Bấm ✏️, gõ tên mới, Enter → tên mới hiện ngay, gọi API xác nhận `customName` lưu đúng; tải lại trang vẫn giữ tên đã đặt (persist thật, không phải local-only).
- Xoá trắng tên rồi lưu → quay lại đúng tên tự sinh.
- Đổi dropdown sắp xếp qua từng lựa chọn → thứ tự danh sách đổi đúng (đối chiếu tay ít nhất 1 lần bằng cách so sánh timestamp/tên thật giữa các card).
- Kết hợp sort + filter trạng thái + "chỉ yêu thích" + tìm kiếm cùng lúc → không hồi quy nhau (mỗi điều kiện độc lập, không loại trừ lẫn nhau ngoại trừ status/tìm kiếm vốn đã độc lập từ trước).
- Không hồi quy: phân trang, checkbox so sánh 2 thiết kế, filter yêu thích (TASK-103), filter trạng thái.
- Console sạch lỗi.

## Testing

Tự verify: `mvn test`, `npm run build`, `curl` với JWT thật (đặt tên, xoá tên, thử từng giá trị `sort`), verify qua Docker + browser nếu có kết nối Claude-in-Chrome trong phiên của agent (không bắt buộc — coordinator sẽ verify UI thật ở vòng gộp cuối cùng).

## Status

COMPLETED

## Coordinator verification

`mvn test`/`npm run build` PASS. Rebuild Docker đầy đủ (`docker compose build backend frontend` + recreate). Chạy lại bộ Playwright TASK-098 làm regression — 3/3 PASS. Verify E2E qua Claude in Chrome (`task077-tester@example.com`) — trang Projects hiện đúng dropdown "Sắp xếp theo" (4 lựa chọn đúng như task file) cạnh ô tìm kiếm, mọi card hiện đúng tên tự sinh (vd "LIVING_ROOM · Hien dai · 4×4m") thay vì chỉ `roomType` thô, có link "✏️ Đổi tên" trên từng card. Bấm đổi tên → ô nhập inline hiện đúng, gõ tên mới + Enter → tên đổi ngay; TẢI LẠI TRANG (hard reload, không chỉ re-render) → tên vẫn giữ nguyên — xác nhận persist thật qua backend, không phải state cục bộ. Đổi sort sang "Tên loại phòng A-Z" → đúng nhóm "L..." (Living Room/LIVING_ROOM) trước "P..." (Phong khach/Phong ngu); đổi sang "Cũ nhất trước" → đúng thứ tự thời gian tăng dần (12:21:19 → 13:53:06). Console sạch lỗi. Không phát hiện lỗi mới.
