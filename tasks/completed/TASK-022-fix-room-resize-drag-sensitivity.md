# TASK-022

## Title

Sửa lỗi kéo-resize kích thước phòng trong `Room3DViewer` nhảy vọt bất thường

## Goal

Theo yêu cầu user ("Kiểm tra và sửa nếu lỗi phần chỉnh sửa kích thước phòng"), kiểm tra thật kỹ tính năng kéo chấm đỏ đổi kích thước phòng (TASK-007) qua Docker + browser thật, tìm ra và sửa lỗi thật (không chỉ giả định).

## Phát hiện lỗi (root cause)

Tái hiện được lỗi thật: kéo chấm đỏ một khoảng rất nhỏ (~20-25px) khiến kích thước phòng nhảy thẳng lên mức tối đa `MAX_ROOM_METERS = 15` thay vì thay đổi tương ứng với khoảng kéo. Xác nhận qua API (`GET /api/v1/rooms/{id}`) trước/sau: phòng từ `9.39m` dài nhảy lên đúng `15.0m` (giá trị clamp tối đa) chỉ sau 1 thao tác kéo nhỏ.

Nguyên nhân trong `Room3DViewer.jsx#onPointerMove`: khi kéo, code gán **thẳng** toạ độ giao điểm ray-plane (tuyệt đối) làm kích thước mới — `currentLength = clamp(point.z * 2, MIN, MAX)` — thay vì tính theo **độ lệch (delta)** so với điểm bắt đầu kéo. Vì giao điểm ray-mặt phẳng phụ thuộc phối cảnh camera (càng xa camera, 1px chuột di chuyển tương ứng càng nhiều mét trong không gian 3D — đặc biệt rõ khi phòng đã lớn, handle càng xa camera), nên chỉ cần lệch nhẹ điểm bấm chuột so với tâm handle hoặc di chuột một chút cũng đủ khiến toạ độ tuyệt đối nhảy vọt.

## Scope

`frontend/src/components/Room3DViewer.jsx`:

- Thêm `resizeGrabPoint`, `resizeGrabWidth`, `resizeGrabLength` — lưu lại vị trí handle hiện tại (đã nằm đúng trên mặt phẳng resize) + kích thước phòng tại thời điểm `onPointerDown` bắt trúng handle.
- `onPointerMove`: tính kích thước mới = kích thước lúc bắt đầu kéo + **độ lệch** giữa giao điểm ray-plane hiện tại và điểm mốc lúc bắt đầu (`(point.x - resizeGrabPoint.x) * 2`, tương tự cho `z`), rồi mới `clamp`. Không còn gán thẳng toạ độ tuyệt đối.
- `onPointerUp`: reset `resizeGrabPoint = null` khi kết thúc kéo.

## Out of scope

- Không đổi cơ chế lưu (`PATCH /api/v1/rooms/{id}`), không đổi validate kích thước backend, không đổi UI/label.
- Không đổi hành vi khi lưu thất bại (rollback qua `resetSignal` giữ nguyên, đã verify hoạt động đúng — hiện thông báo lỗi + rebuild lại theo kích thước đã lưu gần nhất).

## Dependencies

TASK-021 (COMPLETED).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- E2E thật qua Docker + browser: kéo nhỏ (~20px) chỉ thay đổi kích thước một lượng tương ứng nhỏ (không nhảy lên/xuống giá trị clamp min/max); test cả 2 trục (width/length) độc lập, xác nhận qua API `GET /api/v1/rooms/{id}` khớp với lượng kéo thực tế.
- Không hồi quy: kéo-thả nội thất, chuyển tab 2D/3D, "Đặt lại bố trí", bảng chọn màu/biến thể model (TASK-020/021) vẫn hoạt động đúng sau khi phòng đổi kích thước.
- Console sạch lỗi trong suốt quá trình test.

## Testing

- Tái hiện lỗi TRƯỚC khi sửa: kéo ~25px trên handle "length" → `GET /api/v1/rooms/{id}` xác nhận `lengthMeters` nhảy thẳng từ `9.39` lên đúng `15.0` (max clamp) — xác nhận đúng là bug tuyệt đối-hoá toạ độ, không phải cảm giác chủ quan.
- Đọc lại code `onPointerDown`/`onPointerMove` xác nhận chính xác dòng gán tuyệt đối là nguyên nhân.
- Sửa code, `npm run build` PASS, Docker rebuild `frontend`.
- Verify SAU khi sửa qua Docker + browser thật (room reset về `5m × 5m` sạch để test dễ so sánh):
  - Kéo ~20px trên handle "length" → `GET /api/v1/rooms/{id}` xác nhận `lengthMeters` đổi từ `5.0` → `6.005` (đúng tỷ lệ với khoảng kéo, không nhảy vọt).
  - Kéo ~20-30px trên handle "width" → `widthMeters` đổi từ `5.0` → `5.506` (tương tự, đúng tỷ lệ, trục kia không đổi).
  - Xác nhận qua `elementFromPoint` trước mỗi lần kéo để đảm bảo toạ độ click đúng vào canvas (loại trừ khả năng lỗi do công cụ test, không phải do app).
  - Chuyển tab "Ảnh AI (2D)" ↔ "Không gian 3D" sau khi resize → kích thước phòng mới giữ nguyên đúng, không hồi quy.
  - "Đặt lại bố trí" hoạt động bình thường sau resize.
  - `read_console_messages(onlyErrors=true)` — sạch lỗi trong toàn bộ quá trình.
- Ghi nhận thêm (không phải bug code): trong lúc test gặp 401 do JWT hết hạn (đặc điểm môi trường đã biết) — xác nhận luồng lỗi hiện đúng thông báo "Không lưu được kích thước mới, thử lại." và rollback đúng theo kích thước đã lưu gần nhất (không phải bug resize).

## Status

COMPLETED
