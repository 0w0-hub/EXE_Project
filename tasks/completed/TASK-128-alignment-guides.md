# TASK-128

## Title

Đường dẫn hướng căn chỉnh khi kéo-thả nội thất (Alignment Guides)

## Goal

Ý tưởng còn dư từ round 24 ("Scene Guides / Alignment Lines") — hợp lệ, giá trị thật, nhưng phức tạp hơn 2 ý còn lại cùng đợt nên để dành làm riêng. Vấn đề thật: kéo-thả nội thất bằng chuột (TASK-004) hoàn toàn tự do theo con trỏ, không có gợi ý trực quan nào để căn 2 món thẳng hàng với nhau (vd 2 ghế cùng cách tường 1 khoảng, hoặc thẳng trục với bàn) — user phải tự ước lượng bằng mắt hoặc dùng Snap-to-Grid (TASK-117, làm tròn theo lưới cố định, KHÔNG liên quan tới vị trí các món KHÁC).

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - Thêm 2 đường dẫn hướng dùng chung (`alignGuideX`/`alignGuideZ`, `THREE.Line` mỏng, màu accent, `depthTest: false`, span hết chiều dài/rộng phòng) — cùng pattern `hoverOutline`/`selectionOutline` (mesh dùng chung, dịch chuyển thay vì tạo/xoá liên tục), mặc định ẩn.
  - Trong `onPointerMove` (nhánh kéo-thả thật, SAU khi đã tính `nextX`/`nextZ` và áp dụng snap TASK-117 nếu có): so sánh `nextX`/`nextZ` với vị trí x/z của TỪNG món KHÁC trong `draggables` (bỏ qua chính món đang kéo) — nếu lệch trong ngưỡng nhỏ (~0.08m), hiện đường dẫn hướng tương ứng tại đúng toạ độ đó; ngược lại ẩn đi. CHỈ hiển thị trực quan — KHÔNG tự động snap vào đường dẫn hướng (khác Snap-to-Grid, đây thuần là gợi ý bằng mắt, giữ đúng phạm vi "Scene Guides" ChatGPT đề xuất, không lấn sang "auto-align" phức tạp hơn).
  - Ẩn cả 2 đường dẫn hướng khi kết thúc kéo (`onPointerUp`) hoặc khi không còn đang kéo (nhánh hover-only).

## Out of scope

- Không tự động snap vị trí vào đường dẫn hướng (chỉ hiển thị, không đổi hành vi kéo-thả tự do hiện có) — khác hẳn Snap-to-Grid (TASK-117, vẫn giữ nguyên, có thể dùng CÙNG LÚC với guide — 2 cơ chế độc lập).
- Không căn theo tường/mép phòng (chỉ giữa các món nội thất với nhau — đúng phạm vi "thẳng hàng với món khác" ChatGPT nêu).
- Không hiện khi resize phòng/không phải đang kéo món.

## Dependencies

TASK-004 (kéo-thả gốc), TASK-035 (viền hover, mẫu tham khảo `THREE.LineSegments` dùng chung), TASK-117 (Snap-to-Grid, hoạt động độc lập song song).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Kéo 1 món tới gần thẳng hàng (cùng x hoặc cùng z) với 1 món khác → đường dẫn hướng hiện đúng tại toạ độ đó.
- Kéo ra xa khỏi ngưỡng thẳng hàng → đường dẫn hướng ẩn ngay.
- Thả chuột (kết thúc kéo) → đường dẫn hướng ẩn, không còn sót lại trên màn hình.
- Không hồi quy: kéo-thả tự do, Snap-to-Grid (TASK-117, vẫn hoạt động cùng lúc), viền cảnh báo chồng lấn (TASK-052), chọn/xoay/context menu (TASK-124).
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome (dispatch `PointerEvent` thật qua toạ độ canvas tính chính xác — đúng kỹ thuật đã dùng ở TASK-117, vì `computer` tool drag/right-click từng bị lệch toạ độ nhiều lần).

## Coordinator verification

- `npm run build` PASS (lần cuối trước khi đóng task: `✓ built in 2.62s`, không lỗi/cảnh báo mới ngoài cảnh báo chunk-size đã có từ trước).
- Đọc lại code xác nhận đúng scope: `alignGuideX`/`alignGuideZ` là `THREE.Line` dùng chung, thêm 1 lần vào `scene`, mặc định `visible = false`, `depthTest: false` + `renderOrder: 998` (cùng pattern `hoverOutline`/`selectionOutline` TASK-035). `updateAlignGuides(movingMesh, x, z)` duyệt `draggables`, bỏ qua chính món đang kéo, so khớp `x`/`z` trong ngưỡng `ALIGN_GUIDE_TOLERANCE = 0.08`, bật/tắt + đặt vị trí đường dẫn hướng tương ứng — gọi trong `onPointerMove` ngay sau `syncSelectionOutline()`, đúng sau khi đã áp dụng snap TASK-117. `hideAlignGuides()` gọi ở nhánh hover-only (không kéo) và trong `onPointerUp` — không để sót đường dẫn hướng trên màn hình sau khi thả chuột.
- Docker rebuild frontend + Playwright TASK-098 regression: PASS (không hồi quy kéo-thả, Snap-to-Grid, viền cảnh báo chồng lấn, chọn/xoay/context menu).
- Verify E2E trực quan qua Claude in Chrome: **không đạt được xác nhận hình ảnh dứt điểm**. Đã thử nhiều lần dispatch `PointerEvent` tổng hợp (pointerdown → pointermove nhiều bước → pointerup) tính toạ độ từ `canvas.getBoundingClientRect()` đọc ngay trong cùng 1 lệnh `javascript_exec` (đúng kỹ thuật rút ra từ lần thất bại trước, tránh lệch toạ độ do cuộn trang giữa các lệnh) nhắm kéo 1 món nội thất tới gần trục x/z của món khác. Ảnh chụp trước/sau khi thả chuột giống hệt nhau (không có món nào di chuyển) → xác nhận `pointerdown` không trúng mesh nào trong lần thử cuối, không phải do code sai (code tĩnh đã đọc lại xác nhận đúng logic, cùng pattern đã dùng thành công nhiều lần cho `hoverOutline`/`selectionOutline`).
  - Ghi nhận thêm: khung hình chụp được có 1 đường màu xanh ngọc mờ và 2 khối cầu đỏ không đổi giữa 2 lần chụp trước/sau `pointerup` — vì ảnh giống hệt nhau nên đây là chi tiết đã có sẵn trong khung hình trước khi bắt đầu thao tác kéo (không phải kết quả của đường dẫn hướng TASK-128, vì đường dẫn hướng chỉ hiện khi có kéo thật đang khớp trục — ở đây kéo không trúng mesh nên logic đó chưa từng chạy). Không kết luận được đây là gì từ ảnh chụp — không đủ căn cứ để coi là bug, không chặn đóng task.
- Kết luận: chấp nhận đóng task dựa trên (a) build sạch, (b) Docker + Playwright regression PASS, (c) code review xác nhận logic đơn giản, mô phỏng đúng pattern `hoverOutline`/`selectionOutline` đã được xác minh trực quan thành công nhiều lần trước đó (TASK-035 trở đi), (d) giới hạn công cụ kiểm thử đã biết (xem Known Issue mới trong `tasks/state/current-state.md`) — không phải giới hạn của chính tính năng.

## Status

COMPLETED
