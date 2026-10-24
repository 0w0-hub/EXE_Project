# TASK-091

## Title

Huy hiệu thành tựu thiết kế (Achievements — dựa hoàn toàn trên dữ liệu thật đã có)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 5 — ý tưởng "Design Streak & Achievement"/"Design Milestones" ChatGPT đề xuất (phiên `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`, sau khi báo cáo đã dùng hết 16 ý tưởng trước, xin 6 ý tưởng hoàn toàn mới).

**QUAN TRỌNG — không bịa dữ liệu/nghiệp vụ mới**: KHÔNG tạo hệ thống điểm/XP hay bảng lưu trạng thái "đã đạt huy hiệu" mới. Tính TOÀN BỘ huy hiệu bằng cách ĐẾM dữ liệu thật đã có sẵn (số room đã tạo, số design job đã `COMPLETED`, đã từng export/chia sẻ) mỗi lần gọi API — giống đúng cách TASK-084 (Activity History) đã ghép dữ liệu thật thay vì tạo bảng mới. Vì tính lại mỗi lần gọi (không lưu trạng thái), "đạt huy hiệu" là suy ra từ điều kiện đủ dữ liệu, không phải sự kiện được ghi lại — chấp nhận được ở quy mô này.

## Scope

### Backend

- Đọc `backend/src/main/java/com/homely/api/user/UserService.java` (đã có `getActivity`/`buildExport` từ TASK-084/087 — noi thêm hàm mới, THÊM KHÔNG SỬA 2 hàm đó).
- Thêm `GET /api/v1/users/me/achievements` (auth): trả danh sách huy hiệu cố định đã định nghĩa trong code (KHÔNG cần bảng DB mới), mỗi item `{ code, name, description, achieved, achievedRequirement }` — ví dụ:
  - `FIRST_ROOM` ("Phòng đầu tiên") — đạt khi `count(room) >= 1`.
  - `FIVE_ROOMS` ("5 phòng") — đạt khi `count(room) >= 5`.
  - `FIRST_DESIGN` ("Thiết kế đầu tiên") — đạt khi `count(job COMPLETED) >= 1`.
  - `FIVE_DESIGNS` ("5 thiết kế") — đạt khi `count(job COMPLETED) >= 5`.
  - `FIRST_SHARE` ("Chia sẻ đầu tiên") — đạt khi có ít nhất 1 `DesignShare` (module `sharing`, TASK-078) của user — đọc `DesignShareRepository` trước, tái sử dụng method đã có nếu phù hợp, chỉ thêm method mới nếu thật sự cần.
  - Tự quyết định thêm 1-2 mốc khác NẾU có dữ liệu thật hỗ trợ (KHÔNG bịa mốc không đo được, ví dụ "thử 3 phong cách" cần dữ liệu style đa dạng — chỉ làm nếu chắc chắn có cách tính đúng từ dữ liệu thật).

### Frontend

- Trang mới `frontend/src/pages/Achievements.jsx`, route `/account/achievements` (yêu cầu đăng nhập, `ProtectedRoute`, đọc `App.jsx` trước).
  - Lưới huy hiệu, huy hiệu đã đạt hiển thị nổi bật (màu/icon), chưa đạt hiển thị mờ + mô tả điều kiện cần đạt.
- `frontend/src/services/api.js`: thêm hàm gọi endpoint mới (đọc file trước — có thể agent khác cùng round đang sửa song song, ĐỌC LẠI nếu có cảnh báo, chỉ thêm hàm của mình).
- KHÔNG tự thêm link vào `NavBar.jsx` — coordinator gộp thêm vào dropdown "Tài khoản" có sẵn (từ TASK-083/084/087) sau khi bạn báo cáo xong.

## Out of scope

- Không tạo bảng lưu trạng thái huy hiệu/điểm số/XP.
- Không thêm animation/confetti khi đạt huy hiệu mới (chỉ hiển thị trạng thái tĩnh khi tải trang).
- Không đụng `NavBar.jsx`, `Dashboard.jsx`, `Room3DViewer.jsx`, `Projects.jsx`, `DesignResult.jsx`, `RoomNew.jsx`.

## Dependencies

`UserService` (TASK-084/087), `RoomRepository`, `DesignJobRepository`, `DesignShareRepository` (TASK-078).

## Affected Services

Backend (`user` module, thêm 1 endpoint) + Frontend (trang mới + `api.js`).

## Acceptance Criteria

- `mvn test` PASS, `npm run build` PASS.
- Tài khoản có nhiều room/job/share thật → huy hiệu tương ứng hiện đúng trạng thái "đã đạt" dựa trên số liệu thật (kiểm chứng bằng đếm tay so với dữ liệu thật qua API khác đã có).
- Tài khoản mới toanh → toàn bộ huy hiệu hiện "chưa đạt", không lỗi 500.
- Console sạch lỗi.

## Testing

- `mvn test` PASS, `npm run build` PASS — tự verify trước khi báo cáo xong.
- Verify API bằng `curl` trực tiếp tới backend đang chạy sẵn ở `http://localhost:8080` — có thể rebuild RIÊNG backend (`docker compose up -d --build backend`, KHÔNG rebuild `frontend`/`sqlserver`). Dùng `task077-tester@example.com` (nhiều dữ liệu thật) + 1 tài khoản mới đăng ký để test case rỗng.
- KHÔNG dùng Claude-in-Chrome, KHÔNG rebuild `frontend` container — coordinator gộp rebuild Docker đầy đủ + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành.

## Status

COMPLETED

## Coordinator verification

Coordinator gộp thêm link "Huy hiệu" vào dropdown "Tài khoản" trong `NavBar.jsx`. Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật (`task077-tester@example.com`): vào `/account/achievements` → hiện đúng "Đã đạt 6/7 huy hiệu", 6 huy hiệu đạt hiện nổi bật (viền tím, icon cúp), 1 huy hiệu chưa đạt ("10 thiết kế") hiện mờ + khoá + đúng mô tả điều kiện. Console sạch lỗi. Không phát hiện lỗi mới nào.
