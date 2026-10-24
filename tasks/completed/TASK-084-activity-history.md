# TASK-084

## Title

Lịch sử hoạt động tài khoản (Activity History)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 3, ý tưởng lấy từ ChatGPT (cùng phiên hội thoại các round trước: `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) — "Activity History": user không có cách xem lại mình đã tạo/làm gì trên tài khoản theo thời gian.

**QUAN TRỌNG — không bịa dữ liệu**: KHÔNG tạo bảng "audit log" mới ghi lại mọi hành động (quá lớn cho 1 task, cần instrument code ở nhiều module). Thay vào đó, GHÉP lại timeline từ dữ liệu THẬT đã có sẵn trong DB (mỗi bản ghi đã có `createdAt` thật):
- Phòng đã tạo (`Room.createdAt`, module `room`).
- Job thiết kế đã tạo (`DesignJob.createdAt`, module `aidesign`).
- Chia sẻ công khai đã bật (`DesignShare.createdAt`, module `sharing`, TASK-078).

## Scope

### Backend

- Đọc `backend/src/main/java/com/homely/api/user/UserController.java`/`UserService.java` (nơi thêm endpoint mới — hợp lý nhất vì đây là dữ liệu "về tài khoản của tôi", không phải nghiệp vụ riêng của `room`/`aidesign`/`sharing`).
- Đọc nhanh `RoomRepository`, `DesignJobRepository` (module `aidesign`), `DesignShareRepository` (module `sharing`, TASK-078) để biết đúng tên method có sẵn hoặc thêm method `findByUserId`/tương đương nếu chưa có (theo đúng convention Spring Data JPA đã dùng trong dự án).
- Thêm `GET /api/v1/users/me/activity` (auth, chỉ dữ liệu CỦA CHÍNH user đang đăng nhập): gộp 3 nguồn trên thành 1 danh sách, mỗi item `{ type, description, createdAt }` (`type` ví dụ `ROOM_CREATED`/`DESIGN_GENERATED`/`DESIGN_SHARED`), sắp xếp mới nhất trước, giới hạn hợp lý (ví dụ top 50 — tự quyết định mức đơn giản đáp ứng đủ acceptance criteria, không cần phân trang phức tạp).
  - `description` là text tiếng Việt dựng từ dữ liệu THẬT đã có (ví dụ "Tạo phòng {roomType}", "Tạo thiết kế AI cho phòng {roomType}", "Bật chia sẻ công khai thiết kế") — KHÔNG bịa thêm thông tin không có trong record gốc.

### Frontend

- Trang mới `frontend/src/pages/ActivityHistory.jsx`, route `/account/activity` (yêu cầu đăng nhập, `ProtectedRoute`, đọc `App.jsx` trước để theo đúng cấu trúc).
  - Danh sách timeline đơn giản (icon/nhãn theo `type`, mô tả, thời gian `toLocaleString('vi-VN')` — theo đúng convention format thời gian đã dùng ở các trang khác, ví dụ `Projects.jsx`).
  - Không có hoạt động nào → thông báo rõ ràng, không phải trắng trang.
- `frontend/src/services/api.js`: thêm hàm gọi endpoint mới (đọc file trước — có thể đang bị agent khác cùng round sửa song song, ĐỌC LẠI nếu thấy cảnh báo thay đổi trên đĩa, chỉ thêm hàm của mình).
- KHÔNG tự thêm link vào `NavBar.jsx` — coordinator gộp thêm sau.

## Out of scope

- Không tạo bảng audit log mới / không instrument thêm code ghi log ở các module khác (xem lý do ở Goal).
- Không tính các hoạt động "xem" (view) — chỉ tính hành động tạo/thay đổi trạng thái thật đã có timestamp sẵn.
- Không đụng `NavBar.jsx`, `Dashboard.jsx`, `Room3DViewer.jsx`, `Projects.jsx`, `DesignResult.jsx`, module `notification` (TASK-082).

## Dependencies

`RoomRepository`, `DesignJobRepository`, `DesignShareRepository` (TASK-078), `UserController`/`UserService`.

## Affected Services

Backend (`user` module, thêm 1 endpoint đọc dữ liệu tổng hợp) + Frontend (trang mới + `api.js`).

## Acceptance Criteria

- `mvn test` PASS, `npm run build` PASS.
- Tài khoản có ít nhất 1 room + 1 job + 1 share thật → `GET /api/v1/users/me/activity` trả đủ cả 3 loại event, đúng thứ tự mới nhất trước (kiểm chứng bằng so sánh `createdAt` thật).
- Tài khoản khác (User B) gọi cùng endpoint → CHỈ thấy hoạt động của chính B, không thấy của user khác.
- Tài khoản mới toanh (chưa có gì) → trả danh sách rỗng, không lỗi 500.
- Trang `/account/activity` hiển thị đúng dữ liệu thật, không hardcode.
- Console sạch lỗi.

## Testing

- `mvn test` PASS, `npm run build` PASS — tự verify trước khi báo cáo xong.
- Verify API bằng `curl` trực tiếp tới backend đang chạy sẵn ở `http://localhost:8080` — có thể rebuild RIÊNG backend (`docker compose up -d --build backend`, KHÔNG rebuild `frontend`/`sqlserver`). Dùng tài khoản `task077-tester@example.com` (đã có nhiều room/job/1 share thật từ các round trước) để test case có dữ liệu, tự đăng ký thêm 1 tài khoản mới để test case rỗng + cách ly dữ liệu giữa 2 user.
- KHÔNG dùng Claude-in-Chrome, KHÔNG rebuild `frontend` container — coordinator gộp rebuild Docker đầy đủ + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành.
- Báo cáo lại rõ: file đã đổi, endpoint mới chính xác (path/method/response shape thật, ví dụ thật của 1 vài item).

## Status

COMPLETED

## Coordinator verification

Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật (`task077-tester@example.com`, đã có nhiều room/job/1 share thật): vào `/account/activity` qua dropdown "Tài khoản" → hiện đúng timeline thật (icon riêng theo loại: 🏠 tạo phòng, 🎨 tạo thiết kế AI, 🔗 bật chia sẻ), đúng thứ tự mới nhất trước, mô tả đúng dữ liệu thật (không hardcode). Console sạch lỗi. Không phát hiện lỗi mới nào.
