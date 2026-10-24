# TASK-035

## Title

Viền sáng khi rê chuột qua nội thất + xuất sơ đồ 2D thành PNG

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Round này: 1 cải thiện UX cho 3D (gợi ý trực quan trước khi thao tác), 1 tính năng xuất cho 2D (đối xứng với "Tải ảnh" đã có cho 3D ở TASK-033).

## Scope

`frontend/src/components/Room3DViewer.jsx`:

- **Viền sáng khi hover**: 1 mesh viền dùng chung (`LineSegments` + `EdgesGeometry` khối lập phương đơn vị, scale/dịch theo món đang hover) — không đổi material của model thật (model có thể ẩn/lồng nhiều lớp con, đổi material rủi ro cao hơn). Tích hợp vào nhánh "không đang kéo/resize" của `onPointerMove` có sẵn (không cần listener mới, dùng lại raycasting). Viền theo dõi luôn món đang kéo (không chỉ lúc hover tĩnh). Thêm `pointerleave` để ẩn viền khi chuột rời khỏi canvas. Con trỏ chuột đổi thành `grab` khi hover 1 món.
- **Xuất sơ đồ 2D**: nút "📷 Tải sơ đồ" trong `Room2DPlan` — serialize SVG hiện tại → vẽ lên canvas ẩn (x2 độ phân giải cho nét) → tải PNG. Không dùng thư viện ngoài.

## Lỗi phát hiện + sửa trong lúc tự verify (trước khi coi là xong)

Khi tự kiểm tra cơ chế xuất ảnh bằng JS (không thực hiện hành động tải file thật — xem nguyên tắc dưới), phát hiện: `<img>` tải từ SVG blob không có `width`/`height` tường minh nên **kích thước tự nhiên (natural size) không khớp `viewBox` thật** (trả về 150×150 thay vì đúng kích thước sơ đồ, vd 260×260) — code gốc gọi `ctx.drawImage(img, 0, 0)` không ép kích thước đích, khiến ảnh xuất ra bị cắt/co lại chỉ còn 1 góc nhỏ thay vì toàn bộ sơ đồ. Sửa bằng cách ép rõ kích thước đích: `ctx.drawImage(img, 0, 0, viewBoxWidth, viewBoxHeight)` (đọc từ `svgElement.viewBox.baseVal`, không dùng kích thước tự nhiên của ảnh).

## Out of scope

- Không lưu trạng thái hover/viền vào đâu cả — thuần hiệu ứng hình ảnh tạm thời.
- Không thêm hover highlight cho đồ trang trí tự động (rug/plant/wall art — không nằm trong `draggables`, không tương tác được nên không cần gợi ý hover).

## Dependencies

TASK-034 (COMPLETED, cùng đợt tự động nâng cấp).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Rê chuột qua 1 món nội thất → viền trắng xuất hiện đúng quanh món đó, biến mất khi rê ra chỗ khác/rời canvas.
- Kéo 1 món → viền vẫn theo đúng vị trí món trong lúc kéo.
- Nút "Tải sơ đồ" tạo đúng PNG đầy đủ nội dung sơ đồ (không bị cắt góc) — xác nhận qua kiểm tra kích thước canvas + dữ liệu ảnh, không thực hiện hành động tải file thật trong phiên tự động.
- Không hồi quy: kéo-thả, kéo-resize, xoay (TASK-034), tab 2D/3D/sơ đồ.
- Console sạch lỗi.

## Testing

- `npm run build` PASS, Docker rebuild `frontend`.
- Verify qua browser thật (job `1cb66743-...`):
  - Dùng `computer.hover` rê chuột qua sofa → zoom xác nhận viền trắng hiện đúng quanh sofa; rê ra chỗ trống → viền biến mất.
  - Kéo sofa sang vị trí khác → xác nhận viền theo đúng vị trí mới trong lúc kéo (không đứng yên ở chỗ cũ).
  - Test cơ chế xuất PNG qua JS (không click nút thật, tránh trigger tải file — xem nguyên tắc "Downloading any file" cần xác nhận rõ ràng): phát hiện bug thật (ảnh xuất ra bị cắt do `drawImage` không ép kích thước đích), sửa, verify lại — canvas đúng 260×260 (khớp viewBox), PNG ~20KB (không rỗng/không bị cắt).
  - `read_console_messages(onlyErrors=true)` sạch lỗi xuyên suốt.

## Status

COMPLETED
