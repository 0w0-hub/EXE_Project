# TASK-025

## Title

`Room3DViewer` nâng cấp thêm: giá nổi trên nhãn nội thất + chế độ toàn màn hình

## Goal

Theo lựa chọn user khi làm rõ "tiếp tục nâng cấp trang thiết kế" — tiếp nối hướng đã làm ở TASK-018→022, thêm 2 tính năng nhỏ cho khung nhìn 3D: hiện chi phí ước tính ngay trên nhãn nổi của từng món nội thất, và nút xem toàn màn hình.

## Scope

- `makeLabelSprite(text, cost)`: vẽ thêm dòng giá (`{cost.toLocaleString('vi-VN')} đ`, màu xanh lá nhạt) bên dưới tên món nếu `cost > 0`; tăng chiều cao canvas/sprite tương ứng khi có giá.
- Call site: `makeLabelSprite(item.name || 'Nội thất', item.estimatedCost)`.
- Nút "⛶ Toàn màn hình" phía trên canvas 3D — `mountRef.current.requestFullscreen()` / `document.exitFullscreen()`.
- Đổi mount div từ inline style sang `className="room3d-mount"` (CSS mới trong `styles.css`, có `:fullscreen` override height 100vh) — **bắt buộc** vì inline style luôn thắng CSS thường kể cả `:fullscreen`, nếu giữ inline style thì fullscreen sẽ không thực sự phóng to được.
- `handleResize` đổi từ dùng hằng số `VIEWPORT_HEIGHT` cố định sang đọc `mount.clientHeight` thật (đúng cả khi bình thường lẫn khi fullscreen), thêm listener `fullscreenchange` (bên cạnh `resize` có sẵn) để dựng lại canvas đúng kích thước khi vào/ra fullscreen.
- Tiện thể sửa 1 warning tồn đọng từ TASK-021: `THREE.PCFSoftShadowMap` đã bị deprecated từ three r186 (bản đang dùng), tự fallback về `PCFShadowMap` kèm warning — đổi thẳng sang `THREE.PCFShadowMap` để hết warning (không đổi hành vi, vì fallback vốn đã là giá trị này).

## Out of scope

- Không đổi model 3D, không đổi vị trí nhãn (offset trên đầu món đồ) — chỉ đổi nội dung/kích thước sprite khi có giá.
- Không thêm fallback UI khi fullscreen bị trình duyệt từ chối (permissions policy, iframe nhúng...) — chỉ bắt lỗi im lặng (`.catch(() => {})`) vì đây là tiện ích phụ, không phải chức năng chính.

## Dependencies

TASK-024 (COMPLETED, cùng đợt nâng cấp trang kết quả).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nhãn nổi trên mỗi món nội thất hiện đúng cả tên lẫn giá (2 dòng), đúng định dạng tiền Việt.
- Nút "Toàn màn hình" tồn tại, không throw lỗi chưa bắt (unhandled rejection) dù trình duyệt chấp nhận hay từ chối request.
- Không còn warning "PCFSoftShadowMap has been removed" trong console.
- Không hồi quy: kéo-thả nội thất, kéo-resize phòng, tab 2D/3D, bảng chọn màu/biến thể model.
- Console sạch lỗi.

## Testing

- `npm run build` PASS, Docker rebuild `frontend`.
- Verify qua browser thật (job `1cb66743-...`): zoom vào scene xác nhận nhãn hiện đúng 2 dòng (tên + giá, vd "Sofa/giường chính" / "10.500.000 đ") khớp đúng số liệu trong bảng "Danh sách nội thất".
- Xác nhận hết warning `PCFSoftShadowMap` qua `read_console_messages` sau khi reload trang với bundle mới (trước đó warning xuất hiện lặp lại mỗi lần dựng scene).
- Test nút "Toàn màn hình": dùng `find` tool lấy đúng ref phần tử rồi click qua `computer` tool (click theo toạ độ tay bị lệch, click vào đúng ref mới chuẩn) — phát hiện lỗi thật `TypeError: not granted` (Permissions Policy chặn fullscreen trong context tab do extension điều khiển tự động quản lý), không phải lỗi code (API dùng đúng chuẩn `requestFullscreen`/`exitFullscreen`, `document.fullscreenEnabled === true`). Thêm `.catch(() => {})` để không còn unhandled rejection nếu gặp tình huống tương tự với người dùng thật; xác nhận lại sau khi sửa — console sạch lỗi dù request vẫn bị môi trường này từ chối.
- Chuyển tab 2D/3D, reset bố trí không hồi quy sau các thay đổi.
- `read_console_messages(onlyErrors=true)` — sạch lỗi trong toàn bộ quá trình (trừ log lỗi fullscreen đã chủ động phân tích ở trên, đã xử lý xong).

## Status

COMPLETED
