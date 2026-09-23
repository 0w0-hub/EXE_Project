# TASK-141

## Title

Khoá vị trí món + Isolate Selected + Lưới sàn + Highlight sàn khi kéo

## Goal

4 ý tưởng từ ChatGPT round 24 (round hỏi ý tưởng lần 24). Đã vét trước 2 ý tưởng khác cùng batch — loại cả 2 TRƯỚC KHI giao việc:
- "Reset màu về màu gốc" — ĐÃ CÓ 100%: đọc lại code xác nhận nút "Đặt lại màu" (`room3d-color-swatch-reset`, `pushHistory('Đặt lại màu "..."')`) đã tồn tại cạnh bảng màu của món đang chọn, xoá `itemColorOverrides[index]` để món trở lại đúng màu gốc.
- "Xem scene sạch trong Preview" — không làm round này: cần tái cấu trúc điều kiện hiện/ẩn của nhiều nhóm nút toolbar theo `previewMode` (rủi ro cao hơn 4 ý còn lại, tương tự lý do loại "Minimal UI" ở round 33) — để dành backlog nếu có nhu cầu rõ ràng hơn.

- **Khoá vị trí món nội thất**: toggle "🔒 Khoá"/"🔓 Mở khoá" cho món đang chọn — món bị khoá KHÔNG kéo/xoay được (nhầm lẫn) nhưng vẫn chọn/xem/đổi màu/xoá được bình thường.
- **Isolate Selected**: action tạm thời ẩn MỌI món khác, chỉ giữ món đang chọn hiển thị — khác "🪴 Chỉ nội thất" (TASK-139, ẩn đồ trang trí, giữ TẤT CẢ nội thất) — đây là focus vào ĐÚNG 1 món cụ thể.
- **Ẩn/hiện lưới 3D**: toggle đường lưới trên mặt sàn, ĐỘC LẬP với Snap-to-Grid (TASK-117) — tắt lưới không làm mất khả năng snap.
- **Highlight sàn khi kéo**: khi đang kéo 1 món, vùng sàn ngay dưới món được tô sáng nhẹ theo thời gian thực — thuần trực quan, không đổi cơ chế clamp/snap hiện có.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - State `lockedIndices` (`Set`, mặc định rỗng, KHÔNG persist) — ĐÚNG PATTERN `hiddenIndices` (TASK-109). Hàm `toggleLock(index)` tương tự `toggleVisibility`.
  - `onPointerDown`: khi bắt đầu kéo 1 món đã khoá, KHÔNG khoá `controls`/đặt `dragPlane` (giống cách `previewMode` đã xử lý — chỉ cho nhấp-chọn, không cho kéo thật).
  - `onPointerMove`: nhánh hover-only hiện tại kiểm tra `if (!dragging || previewMode)` — thêm điều kiện `|| lockedIndices.has(dragging.userData.index)` để món khoá luôn rơi vào nhánh hover-only (không bao giờ vào nhánh đổi vị trí thật).
  - `onKeyDown`: thêm 1 guard NGAY sau khi xác nhận `selectedMesh` tồn tại — nếu phím bấm là 1 trong các phím đổi vị trí/góc xoay (mũi tên, Q/E) VÀ món đang chọn đã khoá → bỏ qua (không chặn Delete/Backspace, giữ đúng phạm vi hẹp "chỉ chặn kéo/xoay nhầm").
  - `onDoubleClick`: kiểm tra khoá trên CHÍNH món bị double-click (không phải `selectedMesh` — double-click xoay được cả món chưa chọn) trước khi xoay 90°.
  - `rotateSelectedRef`/`setRotationRef` (nút xoay 15°, ô nhập góc xoay TASK-137): thêm guard khoá.
  - Vô hiệu hoá (không xoá khỏi UI) các nút xoay/Đặt lại vị trí-góc xoay/Về tâm phòng khi món đang chọn đã khoá — nhất quán với "khoá nghĩa là đóng băng vị trí/góc xoay toàn diện", không chỉ chặn phím tắt.
  - Nút toggle "🔒 Khoá món này" / "🔓 Mở khoá" trong nhóm nút "món đang chọn" (cạnh "🎯 Về tâm phòng").
  - Hàm `isolateSelected()` mới (ref-delegation `isolateSelectedRef`, đúng pattern `centerSelectedRef`) — set TẤT CẢ mesh khác trong `draggables` (trừ món đang chọn) `.visible = false` tạm thời; hàm `endIsolate()` khôi phục `.visible = true` cho tất cả (đơn giản hơn lưu trạng thái cũ vì `hiddenIndices`/`decorOnlyMode` áp dụng lại đúng ở lần render tiếp theo — xem Out of scope). Nút "🔎 Cô lập món này" khi CHƯA isolate, nút "↩️ Hiện lại tất cả" khi ĐANG isolate (state `isIsolating` boolean).
  - `THREE.GridHelper` mới, kích thước theo `width`/`length`, thêm 1 lần vào `scene`, `.visible` theo state `showGrid` (mặc định `false`, KHÔNG persist). Nút toggle "▦ Hiện lưới sàn" / "▦ Ẩn lưới sàn" trong dropdown "⋯ Thêm ▾".
  - Bridge state `dragFloorHighlight` (`{x, z}` hoặc `null`) — cập nhật trong nhánh kéo thật của `onPointerMove` (cùng chỗ tính `nextX`/`nextZ`). 1 `THREE.Mesh` phẳng dùng chung (`PlaneGeometry` kích thước theo footprint món đang kéo, material bán trong suốt màu accent) thêm 1 lần vào scene, position + kích thước cập nhật theo `dragFloorHighlight`, `.visible` theo có đang kéo hay không — ĐÚNG PATTERN mesh dùng-chung-dịch-chuyển của `hoverOutline`/`alignGuideX` (TASK-035/128), không tạo/xoá liên tục.

## Out of scope

- `isolateSelected`/`endIsolate` KHÔNG cần nhớ trạng thái `hiddenIndices`/`decorOnlyMode` trước đó để khôi phục chính xác 100% — khi thoát isolate, effect dựng scene sẽ tự áp dụng lại đúng các state đó ở lần render kế tiếp (isolate chỉ là ghi đè `.visible` tạm thời trên mesh hiện tại của effect NÀY, không đổi state React).
- `lockedIndices`/`showGrid`/`isIsolating` KHÔNG persist qua `localStorage` (phiên xem hiện tại, giống đa số toggle khác).
- Không đổi cơ chế clamp/snap hiện có cho highlight sàn khi kéo — thuần trực quan.
- 2 ý tưởng đã loại ở mục Goal.

## Dependencies

TASK-109 (`hiddenIndices`, mẫu `lockedIndices`), TASK-105 (`previewMode`, mẫu chặn kéo-thật giữ nhấp-chọn), TASK-035/128 (mẫu mesh dùng chung dịch chuyển), TASK-137 (`setRotationRef`, cần thêm guard khoá).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Chọn 1 món, bấm "🔒 Khoá món này" → thử kéo bằng `PointerEvent` tổng hợp → món KHÔNG di chuyển. Thử nút Xoay trái/phải/ô nhập góc xoay → không đổi. Vẫn CHỌN được món khác/xem thông tin/đổi màu/xoá bình thường.
- Bấm "🔓 Mở khoá" → kéo/xoay lại hoạt động bình thường.
- Chọn 1 món, bấm "🔎 Cô lập món này" → mọi món khác biến mất, chỉ còn món đang chọn. Bấm "↩️ Hiện lại tất cả" → khôi phục đúng tất cả (kể cả món đang ẩn tạm qua 👁️/🙈 TASK-109 vẫn ẩn đúng như trước isolate, không bị lộ ra nhầm).
- Bấm "▦ Hiện lưới sàn" → lưới hiện trên mặt sàn, kích thước khớp phòng. Bấm lại → ẩn.
- Kéo 1 món (không khoá) → vùng sàn dưới món được tô sáng theo thời gian thực, biến mất khi thả chuột.
- Không hồi quy: kéo-thả tự do, Snap-to-Grid, Alignment Guides, khoảng cách tới tường, Về tâm phòng/góc xoay, Esc bỏ chọn, Preview Mode.
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome.

## Coordinator verification

- `npm run build` PASS ngay lần đầu.
- Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS (chạy 2 lần — trước và sau khi sửa lỗi isolate phát hiện lúc verify).
- **Phát hiện + sửa 1 lỗi thật lúc verify E2E (không phải lúc code)**: bấm "🔎 Cô lập món này" trên "Bàn trung tâm" — screenshot cho thấy `mesh.visible` của các món khác ĐÃ đúng `false` (không raycast/kéo được), nhưng NHÃN NỔI (tên+giá, sprite riêng `mesh.userData.label`) của các món đó VẪN HIỆN — vì điều kiện tạo nhãn chỉ kiểm tra `showLabels && !isHiddenItem`, quên hẳn điều kiện isolate mới. Đây CHÍNH XÁC là bài học TASK-109 đã ghi rõ trong comment ("nhãn vẫn là object riêng không tự ẩn theo mesh cha — phải loại trừ tường minh") nhưng bản thân task này lại mắc lại lỗi tương tự khi thêm điều kiện isolate. Sửa bằng cách gộp `isHiddenItem`/isolate thành 1 biến dùng chung `isVisibleNow`, áp dụng nhất quán cho CẢ `mesh.visible` LẪN điều kiện tạo nhãn.
- Verify E2E qua Claude in Chrome trên job đã tạo trước đó (đăng nhập lại 2 lần do session hết hạn sau rebuild):
  - **Khoá món**: chọn "Bàn trung tâm", bấm "🔒 Khoá món này" → nút xoay/ô nhập góc xoay chuyển `disabled=true` (kiểm tra qua DOM, không phụ thuộc toạ độ). Dispatch `PointerEvent` kéo + phím mũi tên/Q (kèm `pointerenter` qua guard `pointerOverCanvas`) → vị trí/góc xoay GIỮ NGUYÊN `(0,0)m`/`0°`. Bấm "🔓 Mở khoá" → dispatch lại → vị trí đổi đúng thành `(0.1,0)m`, góc xoay đúng `345°` — xác nhận khoá/mở khoá hoạt động chính xác.
  - **Isolate**: sau khi sửa lỗi nhãn — bấm "🔎 Cô lập món này" → screenshot xác nhận CHỈ còn "Bàn trung tâm" (kệ/tủ + đèn sàn biến mất HOÀN TOÀN, kể cả nhãn), đồ trang trí (tranh tường/chậu cây) + chấm đỏ resize KHÔNG bị ảnh hưởng (đúng phạm vi — chỉ nội thất). Bấm "↩️ Hiện lại tất cả" → khôi phục đúng toàn bộ.
  - **Lưới sàn**: bấm "▦ Hiện lưới sàn" → screenshot xác nhận lưới tham chiếu hiện rõ trên mặt sàn, kích thước khớp phòng. Bấm lại → ẩn đúng.
  - **Highlight sàn khi kéo**: dispatch kéo 1 món (giữ pointer, chưa thả) → screenshot xác nhận vùng sàn teal bán trong suốt hiện đúng dưới món đang kéo, cùng lúc dòng "📏 Cách tường" (TASK-133) vẫn hoạt động song song không xung đột. Thả chuột → highlight biến mất ngay.
- Console sạch lỗi trong toàn bộ quá trình verify.
- Không phát hiện lỗi app mới khác, không hồi quy kéo-thả tự do/Snap-to-Grid/Alignment Guides/khoảng cách tới tường/Về tâm phòng/Esc bỏ chọn/Preview Mode.

## Status

COMPLETED
