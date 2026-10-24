# TASK-121

## Title

Chọn độ phân giải khi tải ảnh chụp cảnh 3D

## Goal

Round 19 (cùng batch ChatGPT với TASK-119/120 — xem Goal ở TASK-119 để biết đầy đủ 6 ý tưởng + lý do loại 3/6). Chọn "Export Resolution Presets" — vấn đề thật: `captureScreenshot()` (TASK-033) luôn chụp đúng kích thước canvas đang render (phụ thuộc kích thước khung xem trên màn hình, thường nhỏ hơn ảnh in ấn/chia sẻ chất lượng cao cần).

Đụng `Room3DViewer.jsx` → coordinator tự làm trực tiếp, không giao agent (đúng quy ước xuyên suốt dự án).

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - Thêm `rendererRef`/`sceneRef`/`handleResizeRef` (cùng pattern `cameraRef`/`controlsRef` đã có TASK-034/058) — gán trong effect dựng scene, null lúc cleanup — để hàm `captureScreenshot()` (nằm ngoài effect) truy cập được `renderer`/`scene`/`camera` thật và có cách phục hồi đúng kích thước ban đầu sau khi chụp.
  - `captureScreenshot(multiplier)`: nếu `multiplier > 1`, tạm `renderer.setSize(w*multiplier, h*multiplier)` + cập nhật `camera.aspect` (giữ nguyên vì tỉ lệ khung không đổi, chỉ phóng to độ phân giải) + `renderer.render(scene, camera)` 1 khung hình ở kích thước mới, `canvas.toDataURL()`, rồi gọi `handleResizeRef.current()` để phục hồi đúng kích thước hiển thị thật (tái dùng logic `handleResize` có sẵn, không viết lại).
  - Trong dropdown "⋯ Thêm ▾" (TASK-118): thay 1 nút "📷 Tải ảnh" bằng 3 nút "📷 Tải ảnh (Chuẩn)" / "📷 Tải ảnh (Cao — 2x)" / "📷 Tải ảnh (Ultra — 3x)", gọi `captureScreenshot(1)`/`captureScreenshot(2)`/`captureScreenshot(3)`.

## Out of scope

- Không đổi độ phân giải preview trên màn hình (chỉ đổi lúc chụp/tải, phục hồi ngay sau đó) — không ảnh hưởng hiệu năng render thường trực.
- Không thêm preset tuỳ chỉnh (custom width/height) — chỉ 3 mức cố định theo đúng đề xuất gốc.
- Không đụng `Room2DPlan` (SVG, không cần đổi độ phân giải theo kiểu raster).

## Dependencies

TASK-033 (`captureScreenshot` gốc), TASK-034/058 (pattern ref bridging camera/controls ra ngoài effect), TASK-118 (vị trí nút trong dropdown "⋯ Thêm").

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Tải ảnh "Chuẩn" → kích thước file ảnh khớp đúng kích thước khung xem hiện tại (không đổi so với hành vi cũ).
- Tải ảnh "Cao"/"Ultra" → ảnh tải về có kích thước pixel gấp đúng 2x/3x, nội dung khớp đúng góc nhìn hiện tại (không méo/lệch).
- Sau khi tải ảnh độ phân giải cao, khung xem 3D trên trang KHÔNG bị thay đổi kích thước/méo (phục hồi đúng).
- Không hồi quy các nút khác trong dropdown "⋯ Thêm"/toàn bộ toolbar.
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome (kiểm tra kích thước ảnh tải về qua `read_network_requests`/DOM nếu khả thi, hoặc xác nhận khung xem không vỡ sau khi tải ảnh độ phân giải cao).

## Coordinator verification

- `npm run build` PASS (gộp cùng TASK-119/120), Docker rebuild frontend, Playwright TASK-098 (3/3 PASS).
- Verify E2E qua Claude-in-Chrome bằng kỹ thuật đo thật: ghi đè tạm `document.createElement` để chặn thẻ `<a>` tải file (bắt `href` data-URL thay vì tải xuống thật), gọi trực tiếp nút "Tải ảnh (Ultra — 3x)" → decode data-URL thành `Image` để đọc đúng kích thước pixel thật — xác nhận ảnh xuất ra (2909×1410) gấp đúng ~3 lần kích thước buffer gốc (969×470, có tính `devicePixelRatio`). Đo `canvas.clientWidth/clientHeight` + `canvas.width/height` TRƯỚC và SAU khi chụp — xác nhận giống hệt nhau (862×418 CSS, 969×470 buffer) → khung xem KHÔNG bị méo/giật sau khi chụp độ phân giải cao, phục hồi đúng qua `handleResizeRef`.
- Không hồi quy: dropdown "⋯ Thêm" vẫn hoạt động đúng, khung 3D hiển thị bình thường sau khi chụp.
- Console sạch lỗi.

## Status

COMPLETED
