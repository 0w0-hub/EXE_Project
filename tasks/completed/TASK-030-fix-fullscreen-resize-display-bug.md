# TASK-030

## Title

Sửa lỗi hiển thị khi đổi kích thước phòng lúc đang ở chế độ toàn màn hình `Room3DViewer`

## Goal

Theo yêu cầu user ("Sửa lỗi: khi ở chế độ toàn màn hình của 3D và thay đổi kích thước phòng thì bị lỗi hiển thị") — tìm và sửa lỗi thật.

## Root cause

Effect dựng scene 3D (`Room3DViewer.jsx`) tạo `camera`/`renderer` lúc khởi tạo bằng hằng số cố định `VIEWPORT_HEIGHT` (420, kích thước mặc định KHÔNG fullscreen), thay vì đọc kích thước thật của `mount` tại thời điểm đó. Cơ chế tự sửa kích thước (`handleResize()`, thêm ở TASK-025) chỉ được gọi khi có sự kiện `resize`/`fullscreenchange` — nhưng khi kéo-resize phòng thành công, `onRoomResized` cập nhật `room` prop ở component cha → **toàn bộ effect dựng scene chạy lại từ đầu** (teardown + setup mới, do `room` nằm trong dependency array) — bước setup mới này KHÔNG tự động kích hoạt sự kiện `resize`/`fullscreenchange`, nên camera/renderer mới dựng lại bị sai kích thước (theo `VIEWPORT_HEIGHT` mặc định) trong khi khung hiển thị thật đang là toàn màn hình (100vh qua `.room3d-mount:fullscreen`) — gây lỗi hiển thị (scene nhỏ/lệch/méo tỉ lệ trong khung to).

## Scope

`frontend/src/components/Room3DViewer.jsx`: gọi `handleResize()` một lần ngay sau khi định nghĩa xong (thay vì chỉ chờ sự kiện bên ngoài) — đảm bảo mọi lần effect dựng scene (dù do đổi tab, đổi `room`, đổi màu, hay bất kỳ dependency nào khác) đều tự khớp đúng kích thước `mount` thật ngay lập tức, không phụ thuộc việc có sự kiện resize nào xảy ra sau đó hay không.

## Out of scope

- Không đổi cơ chế toàn màn hình (`toggleFullscreen`, TASK-025) hay CSS `:fullscreen`.
- Không đổi cơ chế kéo-resize phòng (TASK-007/022).

## Dependencies

TASK-029 (COMPLETED, cùng đợt nâng cấp).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Sau khi scene dựng lại (bất kỳ nguyên nhân nào) trong lúc khung hiển thị đã to hơn mặc định (fullscreen hoặc tương đương), canvas tự khớp đúng kích thước khung ngay lập tức, không cần thêm thao tác gì khác.
- Không hồi quy: hành vi bình thường (không fullscreen) vẫn đúng như cũ.
- Console sạch lỗi.

## Testing

- Đọc trực tiếp code xác nhận chính xác root cause (dòng tạo `camera`/`renderer` dùng `VIEWPORT_HEIGHT` cố định, `handleResize` chỉ gắn qua event listener, không có lời gọi ban đầu).
- Không thể trực tiếp trigger Fullscreen API thật trong phiên test tự động (bị môi trường chặn "not granted" — đã ghi nhận ở TASK-025) → verify bằng cách **mô phỏng tương đương**: chèn `<style>` ép `.room3d-mount { height: 900px !important }` (đúng cơ chế mà CSS `:fullscreen` sẽ áp dụng thật), sau đó ép effect dựng lại scene qua đường KHÔNG liên quan resize (chuyển tab "Ảnh AI (2D)" rồi quay lại "Không gian 3D" — cùng code path teardown+setup như khi `room` prop đổi) — xác nhận qua JS: canvas tự khớp đúng `898px` (≈900, trừ border) ngay lập tức sau khi dựng lại, không cần thêm sự kiện resize nào khác.
- Trước đó test với `window.dispatchEvent(new Event('resize'))` xác nhận cơ chế đồng bộ kích thước cơ bản (đã có từ TASK-025) vẫn hoạt động đúng khi có sự kiện thật — làm rõ ranh giới giữa phần đã đúng (đồng bộ theo event) và phần bị thiếu (đồng bộ ngay lúc dựng lại, không phụ thuộc event) mà TASK-030 bổ sung.
- Trong lúc test tình cờ nghi ngờ 1 job thật (`1cb66743-...`) hiển thị "lỗi" (scene nhỏ xíu giữa khung xanh to) — xác minh qua `GET /api/v1/rooms/{id}` cho thấy phòng đang ở kích thước cực đoan `5.5m × 15m` (dữ liệu test còn sót lại từ phiên TASK-022 trước, không phải bug) — reset về `5m × 5m` để có baseline sạch cho các test tiếp theo.
- `npm run build` PASS, Docker rebuild `frontend`, verify qua browser thật — console sạch lỗi trong toàn bộ quá trình test (bao gồm cả việc chèn/gỡ style mô phỏng).

## Status

COMPLETED
