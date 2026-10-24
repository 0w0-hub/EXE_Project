# TASK-023

## Title

Thêm slug (đọc/chia sẻ được) vào đường dẫn trang Kết quả thiết kế

## Goal

Theo yêu cầu user ("thêm slug vào đường dẫn"), đổi URL trang kết quả từ `/designs/{jobId}` (chỉ UUID, không đọc được) sang có thêm đoạn slug mô tả (vd `/designs/{jobId}/phong-khach-modern`) — thuần cải thiện khả năng đọc/chia sẻ link, không đổi cách tra cứu dữ liệu.

## Scope

- `frontend/src/lib/slug.js` (mới): hàm `slugify(text)` — bỏ dấu tiếng Việt (kể cả "đ"/"Đ" không decompose qua NFD), lowercase, thay ký tự không phải a-z0-9 bằng `-`, cắt gọn dấu `-` thừa.
- `frontend/src/App.jsx`: thêm route `/designs/:jobId/:slug` (song song route cũ `/designs/:jobId`, cả 2 cùng render `DesignResult`) — dùng 2 `<Route>` riêng thay vì cú pháp optional-param để tương thích chắc chắn với mọi phiên bản `react-router-dom` đang dùng.
- `frontend/src/pages/RoomNew.jsx`: sau khi generate xong, build slug từ `roomType + style` đã nhập, điều hướng `/designs/{jobId}/{slug}` (fallback về URL không slug nếu slug rỗng).
- `frontend/src/pages/Projects.jsx`: link vào từng thiết kế trong danh sách build slug từ `job.roomType`, điều hướng kèm slug tương tự.
- `DesignResult.jsx` **không đổi** — `useParams()` chỉ đọc `jobId`, slug bị bỏ qua hoàn toàn khi tra cứu job (`designApi.getJob(jobId)`).

## Out of scope

- Không đổi backend/API, không lưu slug vào DB — slug hoàn toàn sinh ở client, không phải định danh.
- Không redirect/chuẩn hoá URL khi slug trong URL sai/thiếu (vd không tự `navigate(replace)` về slug đúng) — chấp nhận slug chỉ mang tính trang trí, không bắt buộc đúng.
- Không thêm slug cho các route khác (vd `/rooms/:id`) — chỉ áp dụng cho trang kết quả thiết kế theo đúng yêu cầu.

## Dependencies

TASK-022 (COMPLETED).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- E2E thật qua Docker + browser:
  - Click vào 1 thiết kế từ trang "Dự án của tôi" → URL có dạng `/designs/{jobId}/{slug}` (vd `phong-khach`), trang tải đúng dữ liệu.
  - Reload trực tiếp (hard navigate) vào URL có slug → vẫn tải đúng (không lỗi 404, không vỡ SPA fallback).
  - URL cũ không có slug (`/designs/{jobId}`) vẫn hoạt động bình thường (backward-compatible).
- Console sạch lỗi.

## Testing

- `npm run build` PASS.
- Docker rebuild `frontend` + browser thật (Claude in Chrome):
  - Vào "Dự án của tôi", click thẻ "Phòng khách" → xác nhận URL đổi thành `/designs/1cb66743-.../phong-khach`, nội dung trang đúng (dùng lại job đã biết trước đó).
  - Navigate thẳng (hard reload) vào chính URL có slug đó → tải lại đúng, không lỗi.
  - Navigate thẳng vào URL cũ không slug (`/designs/1cb66743-...`) → vẫn tải đúng như trước.
  - `read_console_messages(onlyErrors=true)` ở cả 3 lần điều hướng — sạch lỗi.

## Status

COMPLETED
