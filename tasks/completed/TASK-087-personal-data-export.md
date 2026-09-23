# TASK-087

## Title

Xuất dữ liệu cá nhân (Personal Data Export)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 3, ý tưởng lấy từ ChatGPT (cùng phiên hội thoại các round trước: `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) — "Personal Data Export": user không có cách nào lấy dữ liệu của chính mình ra khỏi Homely (backup/tham khảo ngoài app).

## Scope

### Backend

- Đọc `backend/src/main/java/com/homely/api/user/UserController.java`/`UserService.java` (nơi thêm endpoint mới — cùng nhóm "về tài khoản của tôi" như TASK-084, nhưng khác hàm/endpoint, không xung đột trực tiếp nếu cả 2 agent đều chỉ THÊM hàm mới, không sửa hàm có sẵn — đọc kỹ file trước khi ghi, nếu thấy cảnh báo thay đổi trên đĩa thì ĐỌC LẠI trước khi thêm code của mình).
- Thêm `GET /api/v1/users/me/export` (auth): trả về JSON gồm — profile (`email`, `fullName`, `createdAt` — KHÔNG bao gồm password hash), danh sách room của user (roomType, kích thước, ngày tạo), danh sách design job (status, ngày tạo, estimatedCost, style/preference nếu có — không cần trả toàn bộ chi tiết furniture nếu quá phức tạp, tự quyết định mức hợp lý theo đúng gợi ý "giữ scope nhỏ" của ý tưởng gốc). Chỉ dùng dữ liệu THẬT đã có trong các repository hiện có (Room/DesignJob/preference nếu tiện) — KHÔNG bịa field mới.

### Frontend

- Trang mới `frontend/src/pages/ExportData.jsx`, route `/account/export` (yêu cầu đăng nhập, `ProtectedRoute`, đọc `App.jsx` trước).
  - Nút "Tải dữ liệu của tôi (.json)" gọi endpoint, tải file JSON về máy user (dùng `Blob`/`URL.createObjectURL` giống pattern `exportLayout()` đã có ở `Room3DViewer.jsx`, TASK-075 — CHỈ THAM KHẢO PATTERN, KHÔNG đụng file đó).
  - Hiện rõ đang tải/đã tải xong.
- `frontend/src/services/api.js`: thêm hàm gọi endpoint mới (đọc file trước, cùng lưu ý xung đột file như trên).
- KHÔNG tự thêm link vào `NavBar.jsx` — coordinator gộp thêm sau.

## Out of scope

- Không export dữ liệu nhị phân (ảnh/asset/model 3D) — chỉ metadata dạng text/số theo đúng đề xuất gốc "giữ scope nhỏ".
- Không làm tính năng "xoá tài khoản" (GDPR-style thường đi kèm nhưng đây là hành động phá huỷ dữ liệu — KHÔNG tự làm mà không hỏi, ngoài phạm vi round này).
- Không đụng `NavBar.jsx`, `Dashboard.jsx`, `Room3DViewer.jsx`, `Projects.jsx`, `DesignResult.jsx`, module `notification`/`sharing`.

## Dependencies

`UserController`/`UserService`, `RoomRepository`, `DesignJobRepository`.

## Affected Services

Backend (`user` module, thêm 1 endpoint) + Frontend (trang mới + `api.js`).

## Acceptance Criteria

- `mvn test` PASS, `npm run build` PASS.
- `GET /api/v1/users/me/export` (auth) trả đúng JSON: profile của CHÍNH user đó (không password hash), đúng số lượng room/job thật của user đó.
- User B gọi cùng endpoint → chỉ thấy dữ liệu của B, không lẫn dữ liệu của A.
- Không đăng nhập gọi endpoint → 401.
- Trang `/account/export` bấm nút tải về đúng file JSON hợp lệ (parse được).
- Console sạch lỗi.

## Testing

- `mvn test` PASS, `npm run build` PASS — tự verify trước khi báo cáo xong.
- Verify API bằng `curl` trực tiếp tới backend đang chạy sẵn ở `http://localhost:8080` — có thể rebuild RIÊNG backend (`docker compose up -d --build backend`, KHÔNG rebuild `frontend`/`sqlserver`). Dùng tài khoản `task077-tester@example.com` (đã có nhiều room/job thật) để test case có dữ liệu, tự đăng ký thêm 1 tài khoản mới để test cách ly dữ liệu.
- KHÔNG dùng Claude-in-Chrome, KHÔNG rebuild `frontend` container — coordinator gộp rebuild Docker đầy đủ + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành.
- Báo cáo lại rõ: file đã đổi, endpoint mới chính xác (path/method/response shape thật, ví dụ thật 1 phần response).

## Status

COMPLETED

## Coordinator verification

Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật (`task077-tester@example.com`): vào `/account/export` qua dropdown "Tài khoản" → bấm "Tải dữ liệu của tôi (.json)" → hiện đúng "Đã tải xong file dữ liệu.". Console sạch lỗi. Không phát hiện lỗi mới nào.
