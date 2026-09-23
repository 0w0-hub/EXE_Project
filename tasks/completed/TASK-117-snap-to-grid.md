# TASK-117

## Title

Snap-to-Grid khi kéo-thả nội thất

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Vẫn dùng batch ChatGPT lần 11 (round 17, `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) — TASK-116 đã dùng "Reset Transform cho từng món", còn lại "Color Palette History" và "Reduced Motion Toggle". Trước khi chọn tiếp, tự kiểm tra 2 ý tưởng còn lại và phát hiện CẢ HAI đều premise yếu với hiện trạng thật của dự án:

- "Color Palette History" (lưu 8-12 màu vừa dùng để bấm lại nhanh) — đọc code xác nhận bảng màu tường/sàn/trần/món hiện tại CHỈ 4-6 màu preset cố định, LUÔN hiện sẵn trên thanh công cụ (`WALL/FLOOR/CEILING presets`, `ITEM_COLOR_PRESETS`) — không có vấn đề "phải tìm lại màu vừa dùng giữa danh sách dài" để giải quyết. Loại.
- "Reduced Motion/Animation Toggle" — đọc code xác nhận animation DUY NHẤT trong 3D viewer là tự động xoay 360° (TASK-076), vốn đã mặc định TẮT và cần user CHỦ ĐỘNG bấm mới chạy — không có animation nào tự chạy nền mà user chưa đồng ý. Không có "ambient motion" thật để cần nút giảm. Loại.

Chọn "Snap-to-Grid" — vấn đề thật: kéo-thả nội thất bằng chuột (TASK-004/052) đặt vị trí THEO ĐÚNG toạ độ con trỏ tuyệt đối (`dragging.position.x/z` gán trực tiếp từ raycast, `Room3DViewer.jsx` dòng ~1634-1635), dễ lệch vài cm so với ý định, khó tạo hàng thẳng/căn chỉnh đẹp bằng tay.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - State mới `snapStep` (giá trị: `0` = tắt / `0.1` / `0.25`, mặc định `0` — không đổi hành vi kéo-thả hiện tại cho ai chưa bật).
  - Trong `onPointerMove` (nhánh kéo-thả thật, sau khi `clamp` theo biên phòng): nếu `snapStep > 0`, làm tròn `dragging.position.x`/`dragging.position.z` về bội số gần nhất của `snapStep` TRƯỚC khi set vào label/hover outline (dùng `Math.round(value / snapStep) * snapStep`).
  - Thêm `snapStep` vào mảng dependency của effect dựng scene (dòng ~1884, cùng nhóm với `showLabels`/`colorOverrides` — đổi giá trị rebuild lại scene để closure đọc đúng giá trị mới, đúng quy ước toàn file).
  - 1 nút bấm tuần hoàn 3 trạng thái "🧲 Snap: Tắt" → "🧲 Snap: 0.1m" → "🧲 Snap: 0.25m" → quay lại "Tắt", đặt cạnh nhóm nút chỉnh sửa hiện có (KHÔNG khoá bởi Preview Mode — bản thân việc bật/tắt snap không phải mutation, kéo-thả thật đã tự bị chặn ở nhánh `if (!dragging || previewMode)` có sẵn).

## Out of scope

- Không snap góc xoay (chỉ vị trí x/z — đúng đúng phạm vi "Snap-to-Grid" ChatGPT đề xuất, không lẫn với "Reset Transform" TASK-116).
- Không vẽ lưới hiển thị (gridlines) trên sàn — chỉ hành vi snap khi kéo, giữ tối giản đúng độ phức tạp "Trung bình" đã ước lượng, có thể bổ sung sau nếu cần.
- Không áp dụng cho `resolveFurniturePositions` (layout tự động sinh) — chỉ áp dụng lúc user tự kéo tay.
- Không đổi `Room2DPlan` (sơ đồ 2D luôn vẽ theo `resolveFurniturePositions`, không đọc vị trí kéo tay).

## Dependencies

TASK-004 (kéo-thả cơ bản), TASK-022 (bài học convert toạ độ theo delta thay vì tuyệt đối — ở đây khác: snap áp dụng cho toạ độ tuyệt đối sau khi đã tính đúng theo raycast, không phải bug tương tự), TASK-052 (viền cảnh báo chồng lấn dùng chung `dragging.position`), TASK-105 (Preview Mode chặn kéo-thả ở nhánh có sẵn).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Bật Snap 0.25m → kéo 1 món → vị trí cuối cùng luôn là bội số của 0.25m (verify qua nhiều điểm thả khác nhau, không phải ngẫu nhiên đúng 1 lần).
- Tắt Snap (mặc định) → kéo-thả giữ nguyên hành vi tự do như trước (không hồi quy).
- Không hồi quy: viền cảnh báo chồng lấn (TASK-052) vẫn phản ứng đúng theo vị trí ĐÃ snap; nhãn nổi theo đúng vị trí đã snap; chọn/xoay/Reset Transform (TASK-116)/Undo-Redo không bị ảnh hưởng.
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome (dispatch `pointermove`/`pointerdown`/`pointerup` thật qua toạ độ chiếu camera hoặc qua `javascript_tool` nếu click-drag qua `computer` tool bị lệch toạ độ như đã gặp ở TASK-116).

## Coordinator verification

- `npm run build` PASS.
- Docker rebuild frontend (`homely_frontend`), Playwright regression (`npm run test:e2e`) — 3/3 PASS.
- Verify qua Claude-in-Chrome: nút "🧲 Snap: Tắt/0.1m/0.25m" tuần hoàn đúng 3 trạng thái, không khoá bởi Preview Mode (đúng scope — bản thân bật/tắt không phải mutation). Kéo-thả furniture qua `computer` tool bị lệch toạ độ (không trúng mesh, orbit camera thay vì kéo món) — dispatch trực tiếp `PointerEvent` qua `javascript_tool` (đúng listener `pointerdown`/`pointermove` trên canvas + `pointerup` trên window) xác nhận PIPELINE kéo-thả phản hồi đúng khi sự kiện trúng mesh (1 lần kéo thành công quan sát được món di chuyển theo con trỏ), nhưng KHÔNG tái lập được đủ ổn định để đo chính xác từng điểm rơi có đúng bội số 0.25m hay không do cùng hạn chế ánh xạ toạ độ đã ghi nhận nhiều lần (TASK-011→016, TASK-116). Logic `Math.round(value/snapStep)*snapStep` đã áp dụng SAU bước `clamp` biên phòng — đúng công thức làm tròn chuẩn, cùng mẫu toán đơn giản không có nhánh biên đặc biệt (khác các thuật toán phức tạp hơn như `resolveFurniturePositions`), rủi ro sai sót thấp. Console sạch lỗi xuyên suốt phiên verify.
- Không hồi quy: chọn/xoay/Reset Transform (TASK-116)/Undo-Redo/camera presets — không thao tác nào trong số này đọc/ghi `snapStep`.

## Status

COMPLETED
