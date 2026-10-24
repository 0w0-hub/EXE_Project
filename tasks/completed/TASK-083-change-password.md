# TASK-083

## Title

Đổi mật khẩu (Change Password)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 3, ý tưởng lấy từ ChatGPT (cùng phiên hội thoại các round trước: `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) — "Change Password": user hiện KHÔNG có cách nào tự đổi mật khẩu sau khi đăng ký (đọc `AuthController.java`/`AuthService.java` để xác nhận — chỉ có register/login/refresh).

## Scope

### Backend

- Đọc `backend/src/main/java/com/homely/api/auth/AuthController.java`, `AuthService.java`, `backend/src/main/java/com/homely/api/user/UserService.java` trước khi viết — theo đúng layering/convention đã có (KHÔNG tạo module mới, đây là mở rộng hợp lý của `auth`).
- Thêm `PATCH /api/v1/auth/password` (yêu cầu đăng nhập, `CurrentUser.id()` — xem cách các controller khác dùng, ví dụ `DesignController`): request `{ currentPassword, newPassword }`.
  - Validate `currentPassword` đúng bằng `PasswordEncoder` đã có (xem `SecurityConfig.passwordEncoder()`), sai → 400/401 rõ ràng (tự chọn mã lỗi hợp lý theo `rules/api/error-format.md`, nhất quán với các lỗi validation khác trong dự án).
  - `newPassword` tối thiểu theo đúng rule đã áp dụng lúc đăng ký (đọc `RegisterRequest.java` để biết validation hiện có — dùng LẠI, không đặt rule khác).
  - Đổi thành công → mã hoá bằng `PasswordEncoder`, lưu lại, trả 200. KHÔNG cần vô hiệu hoá JWT hiện tại (ngoài phạm vi — access token vẫn còn hạn tới khi hết hạn tự nhiên, đúng với thiết kế stateless hiện có).

### Frontend

- Trang mới `frontend/src/pages/ChangePassword.jsx`, route `/account/password` (yêu cầu đăng nhập — dùng `ProtectedRoute` như các route khác, đọc `App.jsx` trước để theo đúng cấu trúc).
  - Form 3 field: mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu mới (validate khớp nhau CLIENT-SIDE trước khi gọi API).
  - Thông báo rõ ràng khi thành công/thất bại (kể cả lỗi "mật khẩu hiện tại sai" từ backend).
- `frontend/src/services/api.js`: thêm hàm gọi endpoint mới (đọc file trước — file này có thể đang được agent khác cùng round sửa song song, nếu thấy cảnh báo "đã đổi trên đĩa" thì ĐỌC LẠI trước khi ghi, chỉ thêm hàm của mình, không xoá/sửa hàm người khác vừa thêm).
- KHÔNG tự thêm link vào `NavBar.jsx` — coordinator sẽ gộp thêm link tới TẤT CẢ trang mới của round này vào NavBar sau khi mọi agent xong (tránh nhiều agent cùng sửa `NavBar.jsx` một lúc).

## Out of scope

- Không vô hiệu hoá refresh token / đăng xuất các phiên khác khi đổi mật khẩu.
- Không thêm "quên mật khẩu" (khác tính năng — yêu cầu đổi khi ĐÃ đăng nhập, không phải quên).
- Không đụng `NavBar.jsx`, `Dashboard.jsx`, `Room3DViewer.jsx`, `Projects.jsx`, `DesignResult.jsx` — các agent khác trong round này có thể đang đụng file khác song song.

## Dependencies

`AuthController`/`AuthService`/`SecurityConfig.passwordEncoder()` (pattern mã hoá), `RegisterRequest.java` (rule validate mật khẩu có sẵn), `CurrentUser` (lấy user đang đăng nhập).

## Affected Services

Backend (`auth` module, thêm 1 endpoint) + Frontend (trang mới + `api.js`).

## Acceptance Criteria

- `mvn test` PASS, `npm run build` PASS.
- Đổi mật khẩu đúng (current password đúng, new password hợp lệ) → 200, đăng xuất rồi đăng nhập lại bằng mật khẩu MỚI thành công.
- Đổi với `currentPassword` sai → lỗi rõ ràng, KHÔNG đổi mật khẩu (verify bằng đăng nhập lại bằng mật khẩu CŨ vẫn còn hoạt động).
- `newPassword` không hợp lệ (không đạt rule tối thiểu) → lỗi validate rõ ràng.
- Không đăng nhập (không có token) gọi endpoint → 401.
- Console sạch lỗi.

## Testing

- `mvn test` PASS, `npm run build` PASS — tự verify trước khi báo cáo xong.
- Verify API bằng `curl` trực tiếp tới backend đang chạy sẵn ở `http://localhost:8080` — có thể rebuild RIÊNG backend (`docker compose up -d --build backend`, KHÔNG rebuild `frontend`/`sqlserver`) để áp dụng code Java mới. Tự đăng ký 1 tài khoản test mới qua API để không ảnh hưởng tài khoản của agent khác, test đủ các case ở Acceptance Criteria bằng cách đăng nhập lại thật sau khi đổi mật khẩu (xác nhận mật khẩu mới hoạt động, mật khẩu cũ không còn hoạt động).
- KHÔNG dùng Claude-in-Chrome, KHÔNG rebuild `frontend` container — coordinator gộp rebuild Docker đầy đủ + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành.
- Báo cáo lại rõ: file đã đổi, endpoint mới chính xác (path/method/request/response shape thật).

## Status

COMPLETED

## Coordinator verification

Coordinator gộp thêm dropdown "Tài khoản" vào `NavBar.jsx` (link tới `/account/password` cùng 2 trang mới khác của round này — xem `AccountMenu` component mới, tránh 4 agent cùng đụng `NavBar.jsx`). Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật (tài khoản mới đăng ký thật `task083-browsertest@example.com`):
- Vào `/account/password` qua dropdown "Tài khoản" → form hiện đúng 3 ô.
- Nhập sai mật khẩu hiện tại → hiện đúng "Mật khẩu hiện tại không đúng", không đổi.
- Nhập đúng mật khẩu hiện tại + mật khẩu mới hợp lệ → "Đổi mật khẩu thành công", form reset.
- Xác nhận thật qua `curl POST /auth/login`: mật khẩu CŨ → `401 INVALID_CREDENTIALS`; mật khẩu MỚI → `200` kèm token hợp lệ.
- Console sạch lỗi.
- Không phát hiện lỗi mới nào.
