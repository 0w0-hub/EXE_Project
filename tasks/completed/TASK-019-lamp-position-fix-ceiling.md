# TASK-019

## Title

Sửa lỗi đèn sàn bị khuất trong `Room3DViewer` + thêm trần nhà bán trong suốt

## Goal

Theo phản hồi user: (1) đèn sàn khó thấy trong scene 3D — kiểm tra xem có lỗi không; (2) thêm màu nền cho tường/sàn/trần (trần hiện chưa tồn tại trong scene).

## Scope

- `frontend/src/lib/furnitureLayout.js`: thêm `resolveFurniturePositions(items, widthMeters, lengthMeters)` — tính vị trí cho toàn bộ nội thất cùng lúc, có bước dàn đều (theo trục x) các món có `z` gần nhau (cùng "hàng" theo chiều sâu phòng) dựa theo kích thước thật, tránh chồng lấn. Giữ nguyên `resolveFurniturePosition` (heuristic text-matching per-item) không đổi.
- `frontend/src/components/Room3DViewer.jsx`:
  - Đổi sang gọi `resolveFurniturePositions` 1 lần cho cả mảng `furniture` thay vì gọi `resolveFurniturePosition` riêng từng món trong vòng lặp.
  - Thêm mesh trần nhà (`PlaneGeometry(width, length)` tại `y = height`), màu `CEILING_FALLBACK_COLOR` cố định (AI không có role "CEILING"), vật liệu bán trong suốt (`opacity: 0.35`, `DoubleSide`) vì camera bị khoá không xoay lên nhìn từ dưới (`controls.maxPolarAngle`), trần đặc sẽ luôn che khuất góc nhìn từ trên xuống.

## Out of scope

- Không đổi raycasting/kéo-thả, kéo-resize tường, tab 2D/3D, model GLB tĩnh (TASK-018), backend.
- Không đổi màu tường/sàn hiện có (`PRIMARY`/`SECONDARY` role từ AI) — đã xác nhận qua code (`MockAiDesignProvider`) đây là màu AI thật trả về theo từng job, không phải lỗi styling.

## Dependencies

TASK-018 (COMPLETED).

## Affected Services

Frontend only.

## Root cause (đèn sàn bị khuất)

Với job test (`1cb66743-...`): món `storage` (index 0, vị trí "Tường đối diện khu vực ngồi chính") và món `lighting` (index 2, vị trí "Góc phòng, gần cửa sổ") đều khớp heuristic đưa `z = -halfL * 0.85` (mép sau phòng), và `x` chỉ lệch ~0.15×halfW — với halfW mặc định, footprint của đèn sàn (0.3×0.3m) nằm gọn bên trong footprint của kệ sách (1.0×0.5m), khiến đèn bị che hoàn toàn. Không phải lỗi tải model (network vẫn 200 OK, xác nhận lại ở TASK-018) — là lỗi heuristic vị trí.

## Acceptance Criteria

- `npm run build` PASS.
- E2E thật qua Docker + browser (job `1cb66743-1f03-4b1f-b733-e63b42394f91`, mock mode):
  - Đèn sàn hiển thị rõ ràng, tách biệt khỏi kệ sách, không còn bị khuất.
  - Trần nhà xuất hiện dưới dạng mặt phẳng bán trong suốt phía trên, không chặn hoàn toàn tầm nhìn xuống nội thất.
  - Không hồi quy: kéo-thả nội thất, "Đặt lại bố trí", chuyển tab 2D/3D vẫn hoạt động đúng.
  - Console sạch lỗi.

## Testing

- Xác nhận thủ công qua `curl` API thật lấy đúng furniture list của job test, tính tay toạ độ trước/sau fix để xác nhận nguyên nhân và hiệu quả của thuật toán dàn đều.
- `npm run build` PASS.
- Docker rebuild `frontend` + browser thật (Claude in Chrome):
  - Screenshot xác nhận đèn sàn (có nhãn "Đèn sàn/đèn trang...") hiển thị tách biệt rõ ràng giữa kệ sách và bàn/sofa.
  - Zoom xác nhận hình dáng đèn sàn (chân đèn + chao đèn) hiển thị đầy đủ, không lỗi hình.
  - Xác nhận trần nhà render là mặt phẳng bán trong suốt ở đỉnh phòng (quan sát qua vài góc camera khác nhau).
  - Test "Đặt lại bố trí", chuyển tab "Ảnh AI (2D)" ↔ "Không gian 3D" — scene dựng lại đúng.
  - `read_console_messages(onlyErrors=true)` — sạch lỗi.

## Status

COMPLETED
