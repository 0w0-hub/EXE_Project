# TASK-020

## Title

Thêm nhiều biến thể model 3D nội thất + bảng chọn màu tường/sàn/trần trong `Room3DViewer`

## Goal

Theo yêu cầu user ("Thêm cho tôi nhiều mẫu 3D, màu sàn, ..."), làm rõ qua 2 câu hỏi lựa chọn:
1. Mỗi category nội thất (seating/table/lighting/storage) có thêm vài biến thể model thay vì chỉ 1 model cố định.
2. Cho user tự chọn màu tường/sàn/trần trong lúc xem (độc lập với màu AI thật).

## Scope

- Thêm 8 model `.glb` mới (cùng nguồn CC0 Kenney Furniture Kit đã dùng ở TASK-018, xác nhận header `glTF` hợp lệ trước khi thêm): `seating-2/3.glb`, `table-2/3.glb`, `lighting-2/3.glb`, `storage-2/3.glb` vào `frontend/public/furniture/`, cập nhật `CREDITS.txt`.
- `Room3DViewer.jsx`:
  - `STATIC_FURNITURE_MODELS` đổi từ 1 URL/category sang mảng 3 URL/category.
  - Thêm `pickStaticModel(category, roomId, index)` — hash chuỗi đơn giản (`hashSeed`) chọn 1 biến thể ổn định theo từng phòng (cùng phòng luôn ra cùng biến thể, phòng khác nhau có thể ra biến thể khác — tạo cảm giác đa dạng giữa các thiết kế mà không đổi hình lung tung mỗi lần render lại).
  - Thêm state `colorOverrides` (`{ wall, floor, ceiling }`, mặc định `null`) + UI hàng nút tròn chọn màu (`COLOR_PICKER_GROUPS`, mỗi nhóm 4-5 preset) ngay dưới canvas 3D, chỉ hiện ở tab "Không gian 3D". Có nút "Mặc định" để xoá override, quay lại màu AI thật/fallback.
  - `wallColor`/`floorColor`/`ceilingColor` ưu tiên `colorOverrides.*` nếu có, sau đó mới tới `colorForRole(colors, ...)`.
  - Thêm `colorOverrides` vào dependency array của effect dựng scene để đổi màu là rebuild lại scene (giống cơ chế `resetSignal` có sẵn).
- CSS: thêm `.room3d-color-swatch`, `.room3d-color-swatch-reset`, `.room3d-color-picker-label` — đặt tên có tiền tố `room3d-` vì phát hiện tên `.color-swatch` đã dùng cho khối hiển thị màu AI ở `DesignResult.jsx` (tên trùng sẽ đụng style + `querySelectorAll` lẫn lộn giữa 2 nơi).

## Out of scope

- Không đổi raycasting/kéo-thả/kéo-resize tường, không đổi backend, không đổi màu AI thật (`colors` prop) — override chỉ tồn tại phía client, không persist, không gửi lên server (giống hành vi kéo-thả nội thất đã có).
- Không thêm texture/vân bề mặt (chỉ đổi màu phẳng như tường/sàn/trần hiện có).
- Không thêm UI cho user tự chọn model nội thất theo ý muốn (chọn ngẫu nhiên ổn định theo phòng, không có dropdown chọn tay).

## Dependencies

TASK-019 (COMPLETED).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS, đủ 12 file `.glb` (4 category × 3 biến thể) + `CREDITS.txt` trong `dist/furniture/`.
- E2E thật qua Docker + browser:
  - Bảng màu Tường/Sàn/Trần hiện đúng dưới canvas 3D, click 1 màu → scene rebuild đúng màu đó, nút "Mặc định" xuất hiện; click "Mặc định" → quay lại đúng màu AI thật ban đầu.
  - Không đụng độ với `.color-swatch` sẵn có ở trang kết quả (khối hiển thị bảng màu AI) — xác nhận qua `querySelectorAll('.room3d-color-swatch')` trả đúng 14 phần tử (không lẫn 3 span màu AI).
  - Chuyển tab 2D/3D, "Đặt lại bố trí" vẫn hoạt động đúng sau khi thêm state mới.
  - Console sạch lỗi trong suốt quá trình test.
- Logic chọn biến thể model xác nhận đúng qua tính tay (Node script): cùng `roomId` luôn ra cùng kết quả; `roomId` khác nhau cho kết quả khác nhau ở ít nhất vài category.

## Testing

- Nguồn 8 model mới: cùng file `kit.zip` (Kenney Furniture Kit, CC0) đã tải và xác nhận ở TASK-018 (còn cache trong scratchpad phiên trước), giải nén lại đúng 8 file cần, xác nhận header `glTF` cho từng file trước khi copy vào `frontend/public/furniture/`.
- `npm run build` PASS lần 1 (phát hiện đụng độ class `.color-swatch` qua kiểm tra `querySelectorAll` trả 17 phần tử thay vì 14 — có 3 phần tử lạ từ `DesignResult.jsx`), sửa đổi tên class thành `room3d-color-swatch*`, build lại PASS, xác nhận `querySelectorAll` trả đúng 14.
- Docker rebuild `frontend` + browser thật (Claude in Chrome), job `1cb66743-1f03-4b1f-b733-e63b42394f91`:
  - Click swatch Sàn (#B08D63) + Tường (#3A3F4B) qua JS (tránh rủi ro lệch toạ độ click) → screenshot xác nhận tường đổi màu xanh navy đậm, sàn đổi màu gỗ walnut, cả 2 swatch có ring active, nút "Mặc định" xuất hiện đúng 2 nơi.
  - Click cả 2 nút "Mặc định" → screenshot xác nhận quay lại đúng màu AI/fallback ban đầu, ring active biến mất.
  - Chuyển tab "Ảnh AI (2D)" → "Không gian 3D" → scene dựng lại đúng, không lỗi.
  - `read_console_messages(onlyErrors=true)` — sạch lỗi trong toàn bộ quá trình.
- Logic `pickStaticModel`/`hashSeed` verify độc lập bằng Node script (copy y hệt logic) với 4 `roomId` khác nhau (bao gồm `undefined`) — xác nhận tính xác định (deterministic) và có phân tán kết quả khác nhau giữa các phòng.

## Status

COMPLETED
