# TASK-029

## Title

Thêm nhiều biến thể model 3D hơn cho mỗi loại nội thất

## Goal

Theo yêu cầu user ("Tiếp tục nâng cấp. Có mỗi loại nội thất cần nhiều mẫu hơn") — mỗi category (`seating/table/lighting/storage`) từ TASK-020 chỉ có 3 biến thể, tăng lên nhiều hơn để đa dạng hơn giữa các phòng/thiết kế.

## Scope

- Lấy thêm 10 model `.glb` mới từ file `kit.zip` (Kenney Furniture Kit, CC0) còn cache trong scratchpad phiên trước — xác nhận header `glTF` hợp lệ cho từng file trước khi thêm, và đọc material name của từng file (script Node parse JSON chunk, giống TASK-027) để xác nhận vẫn khớp quy ước đặt tên chung (`wood/carpet(Blue)/metal/glass/lamp`) — không cần sửa `enhanceMaterial` vì đã match theo substring.
- Thêm vào `frontend/public/furniture/`: `seating-4/5/6.glb`, `table-4/5/6.glb`, `lighting-4.glb`, `storage-4/5/6.glb`. Cập nhật `CREDITS.txt`.
- `Room3DViewer.jsx#STATIC_FURNITURE_MODELS`: mở rộng từ 3 lên 6 biến thể cho `seating`/`table`/`storage`, lên 4 cho `lighting` (kho model phù hợp cho đèn đứng độc lập hạn chế hơn — các model đèn còn lại trong kit là đèn trần/đèn tường gắn cố định, scale-to-fit đứng tự do sẽ trông sai hình dạng nên không thêm).

## Out of scope

- Không đổi cơ chế chọn biến thể (`pickStaticModel`/`hashSeed` từ TASK-020, vẫn ổn định theo `roomId`).
- Không thêm category nội thất mới.

## Dependencies

TASK-028 (COMPLETED).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS, đủ 22 file `.glb` nội thất (4 category × biến thể) + 2 file trang trí trong `dist/furniture/`.
- Cả 10 file mới trả 200 khi fetch trực tiếp qua URL.
- Các phòng khác nhau (roomId khác nhau) hiển thị biến thể model khác nhau rõ rệt (xác nhận qua 2 job thật khác room).
- Không hồi quy: thêm/xoá nội thất (TASK-028), vật liệu nâng cấp (TASK-027), kéo-thả, kéo-resize, tab 2D/3D, bảng chọn màu.
- Console sạch lỗi.

## Testing

- Đọc JSON chunk 10 file mới bằng Node script — xác nhận material name (`wood`, `carpetBlue`, `metal`, `glass`, `lamp`, và 1 `_defaultMat` không khớp branch nào — an toàn, bỏ qua không enhance, không phải lỗi).
- `npm run build` PASS, xác nhận `dist/furniture/` có đủ 22+2 file.
- Docker rebuild `frontend`, verify qua browser thật với 2 job khác room (`1cb66743-...` "Phòng khách" và `32395f07-...` "Phòng ngủ"):
  - `curl` xác nhận cả 10 URL model mới trả 200.
  - Job "Phòng ngủ" hiển thị rõ biến thể khác (sofa xanh — material `carpetBlue`, kệ thấp mở kiểu mới) so với job "Phòng khách" (sofa hồng, kệ sách kiểu cũ) — xác nhận trực quan qua zoom.
  - Test đặt lại bố trí sau khi xem — không hồi quy.
  - `read_console_messages(onlyErrors=true)` sạch lỗi trên cả 2 job.

## Status

COMPLETED
