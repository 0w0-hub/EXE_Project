# TASK-165

## Title

Nút hiện/ẩn mật khẩu (👁) trên trang Đổi mật khẩu

## Goal

Ý tưởng từ ChatGPT round 34, đã vét trước qua Explore agent, xác nhận CHƯA CÓ ở bất kỳ đâu trong toàn app — `ChangePassword.jsx` (TASK-083) có 3 input `type="password"` thuần, không toggle state, không icon mắt; `Login.jsx` cũng chỉ có 1 input password thuần, không có pattern nào để tái dùng. Đây là lần đầu tiên khái niệm show/hide password được implement trong dự án.

- **Hiện/ẩn mật khẩu**: thêm icon "👁"/"🙈" (hoặc tương tự) cạnh mỗi ô mật khẩu trên trang Đổi mật khẩu, bấm để chuyển đổi `type="password"`↔`type="text"`, giúp user kiểm tra lại nội dung vừa gõ.

## Scope

- Trang Đổi mật khẩu (`ChangePassword.jsx` hoặc tên file tương ứng dưới `frontend/src/pages/`, agent tự xác nhận đường dẫn chính xác — TASK-083):
  - Cả 3 ô mật khẩu (mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu mới) đều có icon toggle riêng biệt (mỗi ô tự quản lý state ẩn/hiện độc lập, không dùng chung 1 state cho cả 3 — user có thể hiện ô này mà vẫn ẩn ô kia).
  - Chỉ đổi `type` attribute của input (`password`↔`text`) — KHÔNG đụng logic validate/submit/authentication hiện có.

## Out of scope

- KHÔNG áp dụng cho `Login.jsx`/`Register.jsx` (ngoài phạm vi task này — có thể làm round sau nếu cần, giờ chỉ tập trung đúng trang Đổi mật khẩu theo yêu cầu ChatGPT).
- Không đổi backend/API đổi mật khẩu.

## Dependencies

Trang Đổi mật khẩu hiện có (TASK-083).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Mỗi ô trong 3 ô mật khẩu có icon toggle riêng, bấm → nội dung ô đó hiện dạng chữ thường (`type="text"`), bấm lại → ẩn về `type="password"`. Toggle ô này KHÔNG ảnh hưởng trạng thái hiện/ẩn của 2 ô còn lại.
- Không hồi quy: luồng đổi mật khẩu chính (submit, validate, thông báo lỗi/thành công) hoạt động như cũ.
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`Projects.jsx`/`RoomNew.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-163/164.

## Coordinator verification

Dispatch cho 1 background agent, không đụng `Room3DViewer.jsx`/`Projects.jsx`/`RoomNew.jsx`. Agent xác nhận đúng file `ChangePassword.jsx`, thêm 3 state `useState` boolean ĐỘC LẬP (`showCurrentPassword`/`showNewPassword`/`showConfirmNewPassword`), icon toggle 👁/🙈 riêng cho mỗi ô, chỉ đổi `type` attribute — không đụng validate/submit.

`npm run build` PASS. Docker rebuild + Playwright TASK-098 regression: 3/3 PASS ngay lần đầu.

Verify E2E qua Claude in Chrome: cả 3 ô hiện đúng icon 👁 ban đầu. Điền nội dung khác nhau vào cả 3 ô, bấm toggle CHỈ ô đầu tiên → xác nhận qua đọc `type` attribute: ô 1 đổi thành `text`, ô 2 và 3 VẪN `password` — độc lập đúng, không dùng chung 1 state. Console sạch lỗi.

## Status

COMPLETED
