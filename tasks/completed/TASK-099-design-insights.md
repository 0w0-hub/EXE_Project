# TASK-099

## Title

Thống kê thiết kế cá nhân (Design Insights)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 8 — ý tưởng "Design Insights" ChatGPT đề xuất mới (khác 21 ý tưởng round 1-7 đã làm, hỏi lại ChatGPT ngày 2026-09-17 tại `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`). Vấn đề thật: user có nhiều dữ liệu thiết kế (room, preference, furniture) nhưng chưa có nơi nào tổng hợp lại thành thông tin hữu ích ở mức TOÀN BỘ tài khoản (khác Achievements TASK-091 là huy hiệu mốc, khác budget breakdown TASK-026 là theo TỪNG thiết kế).

## Scope

- Backend: package mới `backend/src/main/java/com/homely/api/insights/` (Controller + Service + DTO, KHÔNG tạo bảng DB mới — chỉ tổng hợp từ dữ liệu có sẵn qua repository hiện có `RoomRepository`, `DesignJobRepository`, `RoomPreferenceRepository`, `DesignFurnitureItemRepository`/`DesignResultRepository`). Endpoint mới `GET /api/v1/insights/me` (JWT required, chỉ tính cho user hiện tại — đọc kỹ `SecurityConfig.java` để đăng ký route đúng pattern `/api/v1/**` đã bảo vệ, không cần sửa file này nếu route đã khớp pattern chung).
  - Tính đúng theo quy ước đã có ở TASK-093 (`duplicatedFromJobId` khác null nghĩa là job nhân bản, KHÔNG PHẢI job generate thật) — loại trừ các job nhân bản khỏi mọi số liệu bên dưới để không làm sai lệch thống kê:
    - `totalDesigns`: số `DesignJob` có `status = COMPLETED` và `duplicatedFromJobId IS NULL` thuộc user.
    - `mostCommonRoomType`: loại phòng (`Room.roomType`) xuất hiện nhiều nhất trong số phòng của user.
    - `mostCommonStyle`: giá trị `RoomPreference.style` (khác null/rỗng) xuất hiện nhiều nhất trong các preference gắn với phòng của user.
    - `totalFurnitureItems`: tổng số dòng `DesignFurnitureItem` gắn với các job COMPLETED không nhân bản của user (qua `DesignResult`/`resultId` — đọc kỹ `DesignResultWriter.java`/`DesignResult.java` để nối đúng quan hệ job → result → furniture item, KHÔNG đoán tên cột).
    - `averageBudget`: trung bình `RoomPreference.budget` (khác null) của các phòng user.
  - Nếu `totalDesigns == 0` (user chưa có thiết kế hoàn tất nào), vẫn trả 200 với các field còn lại là `null`/`0` — KHÔNG lỗi 404/500 (frontend tự quyết định ẩn card khi rỗng).
- Frontend: 1 component mới `frontend/src/components/DesignInsightsCard.jsx` (hoặc tên tương đương rõ nghĩa), gọi qua hàm mới trong `frontend/src/services/api.js` (thêm namespace `insightsApi`, đọc kỹ file hiện có để theo đúng pattern các namespace khác, ví dụ `usageApi`).
- **CHỈ sửa `frontend/src/pages/Dashboard.jsx` ở ĐÚNG 1 VỊ TRÍ**: chèn card mới ngay SAU khối `{usage && subscription && (...)}` (khối 3 `stat-tile`, kết thúc bằng `)}` — dòng ~130 tại thời điểm viết task này, phải tự đọc lại file thật để xác nhận số dòng chính xác vì có thể đã đổi) và TRƯỚC `{loading && <p>Đang tải...</p>}`. KHÔNG sửa bất kỳ chỗ nào khác trong file này (một task khác — TASK-100 — cũng đang sửa file này ở vị trí KHÁC, phía trên khối stat-tile; đọc lại file trước khi lưu để tránh ghi đè thay đổi của task kia nếu nó xong trước).

## Out of scope

- Không đổi Achievements (TASK-091), budget breakdown theo từng thiết kế (TASK-026), hay Admin System Health (TASK-094) — 3 tính năng đã có, không trùng phạm vi task này.
- Không thêm bảng DB mới, không thêm cột mới vào bảng có sẵn.
- Không tính "số lần chỉnh sửa/export" (ChatGPT gợi ý nhưng dự án hiện KHÔNG lưu vết edit/export nào — bịa số liệu là vi phạm nguyên tắc "never fabricate data"). Bỏ hẳn field này khỏi response.

## Dependencies

Không phụ thuộc TASK-100/TASK-101 (chạy song song) nhưng CÙNG sửa `frontend/src/pages/Dashboard.jsx` với TASK-100 — xem rõ vị trí chèn ở mục Scope để không xung đột.

## Affected Services

Backend (package mới `insights`) + Frontend (`Dashboard.jsx` 1 vị trí, `api.js` thêm namespace, 1 component mới).

## Acceptance Criteria

- `GET /api/v1/insights/me` trả đúng dữ liệu THẬT tính từ ít nhất 1 tài khoản có sẵn nhiều thiết kế (ví dụ `task077-tester@example.com`) — verify bằng `curl` kèm JWT thật, đối chiếu số liệu trả về khớp với số lượng thật đếm được qua các endpoint hiện có khác (ví dụ so khớp `totalDesigns` với số job COMPLETED thấy trên trang Projects).
- Tài khoản mới chưa có thiết kế nào → endpoint vẫn trả 200, card ẩn đúng ở frontend (không hiện "0 cho mọi thứ" gây khó hiểu).
- `mvn test` PASS, `npm run build` PASS.
- Không đổi hành vi bất kỳ trang/API nào khác đã có.

## Testing

- Tự verify bằng `curl` với JWT thật (đăng nhập tài khoản có dữ liệu) → đối chiếu số liệu.
- Không cần Claude-in-Chrome (coordinator sẽ tự verify UI thật ở vòng gộp cuối round).

## Status

COMPLETED

## Coordinator verification

Rebuild Docker đầy đủ (`docker compose build backend frontend` + recreate container) sau khi cả 3 agent round 8 (TASK-099/100/101) xong. Verify E2E thật qua Claude in Chrome (`task077-tester@example.com`) — Dashboard hiện đúng khối "Thống kê thiết kế của bạn" ngay dưới khối stat-tile: "Tổng số thiết kế đã hoàn thành: 6", "Loại phòng phổ biến nhất: BEDROOM", "Phong cách phổ biến nhất: Minimalist", "Tổng số món nội thất: 24", "Ngân sách trung bình: 13.333.333 đ" — số liệu thật, không bịa. Xác nhận đúng cả ở light mode lẫn dark mode (nền/chữ đổi màu nhất quán, không "đảo trắng"). Console sạch lỗi (đã bật console tracker từ lúc tải trang, `onlyErrors` trả rỗng). Không phát hiện lỗi mới.
