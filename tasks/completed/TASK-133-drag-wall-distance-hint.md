# TASK-133

## Title

Hiện khoảng cách tới tường khi kéo-thả nội thất

## Goal

Ý tưởng từ ChatGPT round 17 (xem `tasks/active/TASK-134-quick-rename-editor-header.md` mục Goal để biết 4 ý tưởng khác cùng batch bị loại và lý do cụ thể). Kéo-thả nội thất (TASK-004) đã kẹp biên trong phòng + có Snap-to-Grid (TASK-117) + Alignment Guides căn theo món KHÁC (TASK-128), nhưng chưa có cách nào biết khoảng cách THẬT tới tường khi đang kéo — user phải ước lượng bằng mắt nếu muốn đặt món cách tường đúng 1 khoảng cụ thể (vd "cách tường trái 1m để chừa lối đi").

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - Trong `onPointerMove` (nhánh kéo-thả thật, SAU khi đã có `nextX`/`nextZ` đã kẹp biên + áp snap): tính khoảng cách từ mép món đang kéo tới 2 mặt tường THẬT đã dựng (`backWall` tại `z = -halfL`, `leftWall` tại `x = -halfW` — đúng 2 tường có mesh thật, KHÔNG tính 2 cạnh mở không có tường). Dùng state bridge (đúng pattern `contextMenu`/`selectedFurnitureIndex`) — vd `dragWallDistance` (object `{ toLeft, toBack }` tính bằng mét, hoặc `null` khi không kéo) — set trong effect, đọc trong JSX ngoài effect.
  - Hiện dòng text nhỏ (không phải nhãn nổi trong không gian 3D — đơn giản hơn, tái dùng pattern `text-muted` đã có, đặt cạnh khu vực toolbar) dạng "📏 Cách tường trái: X.Xm · Cách tường sau: Y.Ym", CHỈ hiện khi đang kéo thật (`dragWallDistance !== null`).
  - Ẩn dòng text này khi kết thúc kéo (`onPointerUp`) hoặc khi không còn đang kéo (nhánh hover-only) — đúng cách `hideAlignGuides()` đã làm ở TASK-128.
  - Làm tròn khoảng cách tới 1 chữ số thập phân (đơn vị mét, khớp đơn vị toàn bộ phòng).

## Out of scope

- Không tự động căn chỉnh/snap vào khoảng cách cụ thể nào — THUẦN hiển thị thông tin, không đổi hành vi kéo-thả tự do hiện có (giống nguyên tắc Alignment Guides TASK-128).
- Không tính khoảng cách tới 2 cạnh phòng KHÔNG có tường thật (thiết kế phòng mở để camera nhìn xuyên vào — chỉ 2 mặt `backWall`/`leftWall` có mesh).
- Không hiện nhãn nổi trong không gian 3D (phức tạp hơn, không cần thiết cho mục tiêu "biết khoảng cách nhanh").

## Dependencies

TASK-004 (kéo-thả gốc), TASK-007 (halfW/halfL/kẹp biên), TASK-128 (mẫu bridging state + ẩn/hiện theo trạng thái kéo).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Kéo 1 món nội thất → dòng "📏 Cách tường trái/sau" hiện đúng số liệu, cập nhật theo thời gian thực khi kéo.
- Thả chuột → dòng text biến mất ngay, không sót lại.
- Không hồi quy: kéo-thả tự do, Snap-to-Grid (TASK-117), Alignment Guides (TASK-128, hoạt động độc lập song song), viền cảnh báo chồng lấn (TASK-052).
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome (dispatch `PointerEvent` thật qua toạ độ canvas tính chính xác trong cùng 1 lệnh — đúng kỹ thuật rút ra từ TASK-128; nếu vẫn không nhắm trúng mesh cụ thể được, chấp nhận verify qua code review + build/regression theo đúng tiền lệ TASK-117/128).

## Coordinator verification

- `npm run build` PASS (`✓ built in 2.50s`).
- Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS.
- Verify E2E qua Claude in Chrome trên job đã tạo trước đó (TASK-131/132): dispatch `PointerEvent` tổng hợp (pointerdown → 10 bước pointermove → pointerup) kéo "Bàn trung tâm" về gần tường trái, toạ độ tính từ `canvas.getBoundingClientRect()` đọc trong CÙNG 1 lệnh `javascript_exec` (đúng kỹ thuật đã rút ra từ TASK-128) — **THÀNH CÔNG NGAY LẦN THỬ ĐẦU TIÊN** (khác các lần thử thất bại trước ở TASK-128, có thể vì khung hình phòng nhỏ gọn hơn/mục tiêu ở gần tâm khung hình hơn). Screenshot xác nhận dòng "📏 Cách tường trái: 0.3m · Cách tường sau: 4.3m" hiện đúng phía trên khung 3D, cập nhật đúng theo vị trí kéo thật (món di chuyển sát tường trái, số liệu tương ứng ~0.3m). Thả chuột (`pointerup`) → xác nhận qua `querySelector` lặp lại sau 200ms rằng dòng text đã biến mất hoàn toàn, không sót lại.
- Console sạch lỗi (lọc đúng log `localhost`).
- Không phát hiện lỗi app mới, không hồi quy kéo-thả tự do/Snap-to-Grid/Alignment Guides (TASK-128, cả 2 tính năng hoạt động cùng lúc không xung đột — alignment guide không hiện trong ảnh vì không có món nào khác cùng x/z trong ngưỡng lúc đó, đúng logic).

## Status

COMPLETED
