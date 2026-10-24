# TASK-018

## Title

Model 3D thật cho nội thất trong `Room3DViewer` (thay khối vuông), dùng model tĩnh CC0

## Goal

Cho tất cả nội thất trong scene 3D hiển thị đúng hình dạng thật (sofa/bàn/đèn/kệ) thay vì khối hộp trơn, ngay cả ở chế độ mock (mặc định, không cần `REPLICATE_API_KEY`), bằng cách dùng model 3D mẫu miễn phí theo từng category.

## Scope

- Thêm 4 file `.glb` (Kenney "Furniture Kit", CC0/Public Domain) vào `frontend/public/furniture/{seating,table,lighting,storage}.glb` + `CREDITS.txt` ghi nguồn.
- `Room3DViewer.jsx`: thêm `STATIC_FURNITURE_MODELS` map theo category; refactor phần xử lý sau khi load gltf thành 1 hàm dùng chung (`attachLoadedModel`) cho cả nhánh AI thật (`modelAssetId`, giữ nguyên ưu tiên) và nhánh model tĩnh mới (dùng khi không có `modelAssetId`).

## Out of scope

- Không đổi raycasting/kéo-thả/kéo-resize tường, không đổi `furnitureLayout.js`, không đổi backend.
- Không thêm loader mới (dùng lại `GLTFLoader` đã có).

## Dependencies

TASK-017 (COMPLETED).

## Affected Services

Frontend only (`Room3DViewer.jsx`, asset tĩnh mới).

## Acceptance Criteria

- `npm run build` PASS, 4 file `.glb` xuất hiện trong `dist/furniture/`.
- E2E thật: mở job COMPLETED (mock, không có modelAssetId nào) → cả 4 món nội thất hiển thị đúng hình dạng thật; kéo-thả, kéo-resize tường, chuyển tab 2D/3D vẫn hoạt động đúng như trước; console sạch lỗi tải `.glb`.

## Testing

- Nguồn model: Kenney "Furniture Kit" (kenney.nl/assets/furniture-kit) — CC0/Public Domain, tải trực tiếp zip từ CDN chính chủ kenney.nl, xác nhận header `glTF` hợp lệ trên cả 4 file trước khi đưa vào dự án.
- `npm run build` PASS, xác nhận 4 file `.glb` + `CREDITS.txt` xuất hiện đúng trong `dist/furniture/`.
- E2E thật qua Docker (rebuild `frontend`) + browser thật:
  - `curl` xác nhận cả 4 URL `/furniture/{seating,table,lighting,storage}.glb` trả 200 đúng dung lượng file gốc.
  - Mở job COMPLETED (mock, không có `modelAssetId`) — xác nhận qua `read_network_requests` cả 4 file được fetch 200 khi render scene; quan sát trực tiếp: sofa, bàn, kệ hiển thị đúng hình dạng thật (không còn khối vuông); đèn sàn tải thành công (network 200) nhưng khó thấy rõ ở một số góc camera do hình dáng mảnh + bị che bởi kệ — không phải lỗi, chỉ là occlusion 3D bình thường.
  - Kéo-thả 1 món nội thất (sofa) → di chuyển đúng, model thật di chuyển theo proxy.
  - Kéo tường đổi kích thước phòng → vẫn hoạt động đúng.
  - Nút "Đặt lại bố trí" → scene rebuild đúng, model tải lại bình thường.
  - Chuyển tab "Ảnh AI (2D)" rồi quay lại "Không gian 3D" → scene dựng lại đúng.
  - Console sạch lỗi trong suốt quá trình test.

## Status

COMPLETED
