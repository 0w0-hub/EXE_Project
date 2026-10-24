# TASK-110

## Title

Xem trước + kiểm tra ảnh phòng trước khi tải lên (Upload UX — Preview & Validate)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 14 — ý tưởng ChatGPT đề xuất mới (hỏi lại lần 8 ngày 2026-09-17 tại `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`). Vấn đề thật (đã đọc code `RoomNew.jsx` xác nhận trước khi giao việc): dropzone chọn ảnh phòng hiện tại CHỈ hiện lại tên file dạng text ("Đã chọn: ten-file.jpg") — KHÔNG có ảnh xem trước thật, KHÔNG hiện kích thước file, KHÔNG kiểm tra định dạng/dung lượng trước khi submit form (chỉ có `accept="image/*"` là gợi ý trình duyệt, không phải validate thật — user vẫn có thể chọn file không phải ảnh trên một số trình duyệt/hệ điều hành).

## Scope

- `frontend/src/pages/RoomNew.jsx`:
  - Khi chọn/kéo-thả file ảnh (`setPhotoFile`): tạo `URL.createObjectURL(file)` hiện ảnh xem trước THẬT ngay trong dropzone (thay thế hoặc bổ sung cạnh dòng "Đã chọn: ..."), nhớ `URL.revokeObjectURL` khi component unmount hoặc khi đổi file khác (tránh rò rỉ bộ nhớ — đọc kỹ cách `assetApi.fetchObjectUrl`/`Dashboard.jsx` đã revoke object URL ở nơi khác trong dự án để theo đúng pattern).
  - Hiện thêm kích thước file (đọc `file.size`, format dạng "X.X MB"/"X KB" cho dễ đọc).
  - Validate THẬT trước khi cho phép submit (không chỉ dựa vào `accept` của input):
    - Đúng định dạng ảnh (kiểm tra `file.type` bắt đầu bằng `image/`, whitelist `image/jpeg`, `image/png`, `image/webp` — KHÔNG chấp nhận SVG vì có thể chứa script, theo tinh thần bảo mật upload chung của dự án).
    - Giới hạn dung lượng **10MB** (khớp ĐÚNG `spring.servlet.multipart.max-file-size: 10MB` đã cấu hình sẵn trong `backend/src/main/resources/application.yml` — đã xác nhận trước khi giao task, KHÔNG tự đặt số khác; `frontend/nginx.conf` cho phép tới 15MB nên backend là giới hạn thật sự chặt hơn, dùng đúng số backend).
    - File không hợp lệ → hiện lỗi rõ ràng ngay tại chỗ (không cần submit mới biết), KHÔNG cho set vào `photoFile`/preview.
  - Thêm nút "✕ Bỏ ảnh"/"Đổi ảnh khác" để xoá lựa chọn hiện tại và chọn lại (hiện chưa có cách bỏ ảnh đã chọn ngoài tải lại trang — đọc kỹ code hiện tại để xác nhận đúng chưa có).

## Out of scope

- Không đổi endpoint upload ảnh ở backend (`RoomController`/asset upload hiện có) — CHỈ thêm validate/preview ở phía CLIENT trước khi gửi, giữ nguyên toàn bộ luồng submit/upload thật đã hoạt động.
- Không nén/resize ảnh phía client trước khi upload (ngoài phạm vi, giữ nguyên file gốc như hành vi hiện tại).
- Không đổi trang nào khác ngoài `RoomNew.jsx` (không có trang upload ảnh nào khác trong dự án hiện tại ngoài lúc tạo phòng mới).

## Dependencies

TASK-013 (dropzone gốc).

## Affected Services

Frontend only (`RoomNew.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Chọn 1 ảnh thật (kéo-thả hoặc bấm chọn) → hiện đúng ảnh xem trước thật (không phải icon giả) + đúng kích thước file dạng dễ đọc.
- Chọn 1 file KHÔNG phải ảnh (ví dụ .txt/.pdf đổi đuôi thành .jpg giả — test bằng cách tạo file thật có `type` sai qua `new File()` trong lúc verify) → hiện lỗi rõ ràng, KHÔNG cho vào trạng thái "đã chọn".
- Chọn ảnh quá giới hạn dung lượng đã xác định → hiện lỗi rõ ràng đúng số giới hạn.
- Bấm "✕ Bỏ ảnh" → quay lại đúng trạng thái dropzone trống ban đầu, `photoFile` về `null`.
- Submit form với ảnh hợp lệ đã chọn → luồng tạo phòng vẫn hoạt động đúng như trước (không hồi quy).
- Không rò rỉ object URL (revoke đúng khi đổi ảnh/rời trang — verify bằng cách đổi ảnh nhiều lần rồi kiểm tra không còn URL cũ treo qua console/Network nếu công cụ cho phép, hoặc review code xác nhận logic revoke đúng vị trí).
- Console sạch lỗi.

## Testing

Tự verify: `npm run build`, verify qua Docker + browser nếu có kết nối Claude-in-Chrome trong phiên của agent (khuyến khích vì đây là task UI trực quan — nên tự kiểm tra ảnh xem trước hiện đúng thật, không chỉ tin code). Không bắt buộc — coordinator sẽ verify UI thật ở vòng gộp cuối cùng của round này.

## Status

COMPLETED

## Coordinator verification

`npm run build` PASS. Rebuild Docker đầy đủ. Verify E2E qua Claude in Chrome (`task077-tester@example.com`) — vẽ 1 ảnh PNG thật qua canvas (200×150, có pixel thật), chọn qua input file thật (DataTransfer + dispatch change) → ảnh xem trước hiện đúng (khớp đúng nội dung đã vẽ, xác nhận qua screenshot), tên file "test-room.png" + dung lượng "1 KB" đúng, nút "✕ Bỏ ảnh" hoạt động đúng. Tạo `File` giả `type: text/plain` → đúng bị từ chối, hiện lỗi rõ ràng, không vào trạng thái "đã chọn". Console sạch lỗi. Chạy lại bộ Playwright TASK-098 làm regression — 3/3 PASS. Không phát hiện lỗi mới.
