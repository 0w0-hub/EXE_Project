# TASK-027

## Title

Thêm đồ trang trí phụ + nâng cấp vật liệu chính nội thất trong `Room3DViewer`

## Goal

Theo lựa chọn user khi được hỏi "nâng cấp thêm cho mô hình 3D theo hướng nào" — 2 trong 3 hướng đã chọn:
1. Tự động thêm đồ trang trí phụ (thảm, cây cảnh, tranh tường) cho phòng đỡ trống.
2. Nâng cấp vật liệu chính của nội thất (thêm vân gỗ/vải) thay vì màu phẳng tuyệt đối từ model gốc.

(Hướng thứ 3 — cho phép thêm/xoá nội thất — tách riêng ở TASK-028.)

## Phát hiện trước khi code

Đọc trực tiếp JSON chunk của cả 12 file `.glb` nội thất hiện có (script Node parse GLB header) — xác nhận Kenney Furniture Kit **không có texture/image nào cả**, chỉ có `baseColorFactor` phẳng theo material, và tên material nhất quán trên toàn bộ 12 model: `wood`, `carpet` (vải bọc), `metal`, `glass`, `lamp`. Đây là cơ sở để áp nâng cấp vật liệu theo tên, dùng chung cho mọi model mà không cần đổi từng model riêng lẻ.

## Scope

`frontend/src/components/Room3DViewer.jsx`:

- **Đồ trang trí (không thuộc dữ liệu AI, không tính chi phí, không draggable)**:
  - Tải thêm 2 model CC0 Kenney: `decor-rug.glb` (rugRound), `decor-plant.glb` (pottedPlant) vào `frontend/public/furniture/`, cập nhật `CREDITS.txt`.
  - `loadDecorModel(url, position, targetSize)` — scale-to-fit theo kích thước lớn nhất của model, đặt tại `position` trên sàn. Đặt: 1 thảm giữa phòng (dưới bàn trung tâm), 2 chậu cây ở 2 góc mở phía trước (không có tường, ít trùng nội thất chính theo xu hướng heuristic layout).
  - `addWallArt(accentColor, ...)` — tranh treo tường trừu tượng vẽ bằng canvas (`makeWallArtTexture`, nhuộm theo màu accent của thiết kế), gắn khung viền tối, đặt lệch dương-x trên tường sau (tránh trùng vị trí nội thất thường lệch âm-x theo heuristic).
- **Nâng cấp vật liệu**: `enhanceMaterial(material)` — theo tên material (`wood`/`carpet`/`metal`/`glass`/`lamp`):
  - `wood` → `makeWoodGrainTexture` (vân gỗ vẽ canvas, nhuộm theo đúng `material.color` gốc).
  - `carpet`/`fabric` → `makeFabricTexture` (nhiễu vải mờ).
  - `metal` → tăng `metalness`/giảm `roughness`.
  - `glass` → trong suốt nhẹ, `roughness` thấp.
  - `lamp` → giảm nhẹ `roughness`.
  - Gọi trong `attachLoadedModel` (dùng chung cho cả model AI thật lẫn model tĩnh CC0 — không cần đổi 2 lần) và trong `loadDecorModel`.

## Out of scope

- Không đổi model nội thất chính (hình dạng), chỉ đổi material.
- Không cho phép user tắt/bật hay tuỳ biến đồ trang trí — luôn tự động thêm, không có toggle UI (đúng như hướng "Recommended" user chọn).
- Không tính đồ trang trí vào chi phí/ngân sách (không phải nội thất AI thật).

## Dependencies

TASK-026 (COMPLETED).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS, `decor-rug.glb`/`decor-plant.glb` xuất hiện trong `dist/furniture/`.
- E2E thật: thảm/2 chậu cây/tranh tường hiển thị đúng vị trí, không chồng lấn nghiêm trọng với nội thất chính; console sạch lỗi (kể cả khi model tải lỗi — có `catch` im lặng, không có fallback hình khối vì đồ trang trí không bắt buộc).
- Không hồi quy: kéo-thả, kéo-resize, tab 2D/3D, bảng chọn màu, biến thể model.

## Testing

- Đọc JSON chunk 12 file `.glb` bằng Node script — xác nhận tên material nhất quán (`wood`/`carpet`/`metal`/`lamp`/`glass`) trước khi code `enhanceMaterial`.
- Tải + xác nhận header `glTF` hợp lệ cho 2 model trang trí mới trước khi thêm vào dự án (cùng nguồn CC0 Kenney đã dùng, cache sẵn từ TASK-018).
- `npm run build` PASS, Docker rebuild `frontend`.
- Verify qua browser thật (job `1cb66743-...`): zoom xác nhận thảm dưới bàn, 2 chậu cây ở góc mở, khung tranh + tranh trừu tượng trên tường sau; `read_network_requests` xác nhận `decor-rug.glb`/`decor-plant.glb` tải 200; `read_console_messages(onlyErrors=true)` sạch lỗi trong suốt quá trình thêm vật liệu + đồ trang trí.

## Status

COMPLETED
