# TASK-138

## Title

Hiện vị trí món đang chọn + Center View + tooltip còn thiếu + Hoạt động gần đây

## Goal

4 ý tưởng từ ChatGPT round 21 (round hỏi ý tưởng lần 21). Đã vét trước 2 ý tưởng khác cùng batch — loại cả 2 TRƯỚC KHI giao việc:
- "Nút Đưa về 0° cho Rotation" — DƯ THỪA với chính tính năng vừa làm round trước: TASK-137 đã thêm ô nhập số cho góc xoay (`selectedRotationDeg` + `setSelectedRotationInput`) — gõ "0" vào ô đó đã đạt đúng hiệu quả "đặt riêng góc xoay về 0°, không đổi vị trí" mà ý tưởng này mô tả. Chính ChatGPT cũng tự đánh giá "giá trị thấp hơn vì đã có reset góc xoay tổng thể". Không làm thêm.
- "Khoá tỷ lệ khi thay đổi kích thước" — ChatGPT tự nêu điều kiện "nếu Homely không có thao tác scale/resize furniture thì bỏ ý này" — đọc code xác nhận ĐÚNG LÀ KHÔNG CÓ: kích thước mỗi món cố định theo category qua `furnitureSize()`, không có handle/thao tác scale nào cho từng món nội thất (khác kéo-resize PHÒNG, TASK-007, không liên quan). Loại theo đúng điều kiện ChatGPT tự đặt ra.

- **Hiển thị vị trí món đang chọn**: hiện toạ độ X/Z hiện tại (mét) của món đang chọn, chỉ đọc — bổ sung cho "Góc xoay" đã có (TASK-135/137), giúp biết chính xác vị trí thay vì chỉ áng chừng bằng mắt.
- **Center View**: đưa CAMERA về lại tâm phòng theo trục ngang (X/Z) sau khi user đã pan (kéo chuột phải) đi xa, GIỮ NGUYÊN khoảng cách/góc nhìn hiện tại — khác `resetView` (TASK-034, về hẳn góc nhìn mặc định cố định) và `focusAll` (TASK-127, canh theo bounding box nội thất).
- **Tooltip còn thiếu**: đọc lại code xác nhận 1 số nút trong dropdown "Góc nhìn ▾"/nhóm "món đang chọn" CHƯA có `title` ("⬆ Nhìn từ trên", "↺ Đặt lại góc nhìn", "🔭 Xem toàn bộ", "🔍 Phóng to món đã chọn") trong khi các nút khác cùng nhóm đã có — bổ sung cho nhất quán, đặc biệt hữu ích sau khi toolbar đã gộp dropdown (TASK-118).
- **Hoạt động gần đây**: popup nhỏ liệt kê vài thao tác vừa thực hiện gần nhất, tái dùng dữ liệu `history` (đã có label mô tả từng thao tác, TASK-102) — mở rộng từ dòng chữ đơn "Thao tác gần nhất: {label}" hiện tại (chỉ hiện 1 mục) sang danh sách vài mục gần nhất.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - Bridge state `selectedPosition` (object `{ x, z }` mét, làm tròn 1 chữ số thập phân, `null` khi chưa chọn) — cập nhật tại: `selectMesh()` (lúc chọn/bỏ chọn), nhánh kéo-thả thật trong `onPointerMove` (cùng chỗ đã tính `nextX`/`nextZ` cho `dragWallDistance`), phím mũi tên di chuyển tinh (`onKeyDown`), `centerSelectedRef`, `resetTransformRef`. Hiện text "📍 Vị trí: (x, z)m" cạnh dòng "Góc xoay" trong nhóm nút "món đang chọn".
  - Hàm `centerView()` mới (không cần ref-delegation vì chỉ cần `cameraRef`/`controlsRef` đã có sẵn ở ngoài effect, giống `resetView`/`focusAll`): tính `offset = camera.position - controls.target`, set `controls.target.x = 0; controls.target.z = 0` (giữ nguyên `target.y`), `camera.position = controls.target + offset`, `controls.update()`. Nút "🎯 Về giữa phòng" trong dropdown "Góc nhìn ▾" (cạnh "↺ Đặt lại góc nhìn"/"🔭 Xem toàn bộ") — LƯU Ý: khác hẳn nút "🎯 Về tâm phòng" đã có (TASK-135, di chuyển NỘI THẤT đang chọn) — cần đặt tên/nhãn phân biệt rõ ràng, tránh nhầm lẫn 2 nút cùng icon 🎯 cho 2 hành vi khác nhau (nội thất vs camera).
  - Thêm `title` cho 4 nút còn thiếu: "⬆ Nhìn từ trên", "↺ Đặt lại góc nhìn", "🔭 Xem toàn bộ", "🔍 Phóng to món đã chọn".
  - State `showRecentActions` (boolean, mặc định `false`). Nút toggle "🕘 Hoạt động gần đây" cạnh dòng "Thao tác gần nhất" hiện có — khi bật, hiện `<ul>` liệt kê `history.slice(-5).reverse().map(h => h.label)` (mới nhất lên đầu).
  - Thêm dòng mới vào bảng "❓ Phím tắt" cho Center View + Hoạt động gần đây.

## Out of scope

- Không cho phép NHẬP trực tiếp toạ độ X/Z (chỉ đọc, đúng ChatGPT nêu "chỉ đọc state hiện có, không cần cho phép nhập" — khác góc xoay đã cho nhập ở TASK-137).
- 2 ý tưởng đã loại ở mục Goal.
- Không đổi cấu trúc `history`/`MAX_HISTORY` hiện có, chỉ hiển thị thêm.

## Dependencies

TASK-135/137 (`selectedRotationDeg`, chỗ đặt readout vị trí cạnh nhau), TASK-133 (mẫu bridge state cập nhật trong `onPointerMove`), TASK-102 (`history`, dữ liệu tái dùng cho Hoạt động gần đây), TASK-118 (dropdown "Góc nhìn ▾").

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Chọn 1 món → "📍 Vị trí: (x, z)m" hiện đúng toạ độ hiện tại. Kéo món → cập nhật theo thời gian thực. Di chuyển bằng phím mũi tên → cập nhật đúng.
- Pan camera ra xa (kéo chuột phải) rồi bấm "🎯 Về giữa phòng" (tên khác nút TASK-135) → camera quay về canh giữa phòng theo trục ngang, giữ nguyên khoảng cách/góc nhìn hiện tại (không nhảy về góc mặc định như "Đặt lại góc nhìn").
- Hover 4 nút trước đó thiếu tooltip → hiện chú thích đúng.
- Bấm "🕘 Hoạt động gần đây" → hiện danh sách vài thao tác gần nhất đúng thứ tự (mới nhất lên đầu).
- Không hồi quy: `resetView`, `focusAll`, `centerSelected` (TASK-135, không nhầm với `centerView` mới), kéo-thả, Snap-to-Grid, Alignment Guides, khoảng cách tới tường.
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome.

## Coordinator verification

- `npm run build` — **lỗi cú pháp phát hiện ngay lần build đầu**: khối `{showRecentActions && (...)}` đặt làm phần tử anh em (sibling) với `<div>` bên trong cùng 1 điều kiện `{(...) && (...)}` mà thiếu Fragment bọc ngoài — JSX chỉ chấp nhận 1 root element cho mỗi biểu thức. Sửa bằng cách bọc cả `<div>` lẫn `<ul>` mới trong `<>...</>`. Build lại PASS ngay sau khi sửa — đúng quy trình đã thiết lập (dùng Vite/Babel làm oracle cú pháp cho JSX phức tạp, tương tự TASK-126).
- Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS.
- Verify E2E qua Claude in Chrome trên job đã tạo trước đó (đăng nhập lại do session hết hạn sau rebuild):
  - **Vị trí món đang chọn**: chọn "Bàn trung tâm" → "📍 Vị trí: (0, 0)m" đúng (đã từng đưa về tâm phòng ở phiên verify TASK-135/136 trước). Dispatch phím mũi tên (2×→, 1×↑) — LƯU Ý phải dispatch thêm `pointerenter` trên canvas trước (đặt `pointerOverCanvas = true`) vì `onKeyDown` có guard `if (!pointerOverCanvas || previewMode) return`, nếu không phím mũi tên bị bỏ qua hoàn toàn — sau khi dispatch đúng, xác nhận "📍 Vị trí: (0.2, -0.1)m" đúng khớp 2×0.1m phải + 1×0.1m lên (trục z âm).
  - **Center View**: nút "🧭 Về giữa phòng" hiện đúng trong dropdown "Góc nhìn ▾", tên/icon khác rõ "🎯 Về tâm phòng" (TASK-135). Thử pan camera bằng `PointerEvent` chuột phải tổng hợp (không chắc mô phỏng đúng hành vi pan thật của OrbitControls trong môi trường test tự động) rồi bấm nút — không lỗi console, không crash, khung hình không có gì bất thường. Không xác nhận dứt điểm được hiệu ứng "giữ nguyên góc/khoảng cách" bằng hình ảnh (do không chắc pan tổng hợp có tác dụng thật) — bù lại bằng code review: công thức `offset = camera.position - target; target.set(0,target.y,0); camera.position = target + offset` bảo toàn đúng vector lệch, logic đơn giản không nhánh biên rủi ro.
  - **Tooltip còn thiếu**: đọc lại DOM xác nhận cả 4 nút ("Nhìn từ trên", "Đặt lại góc nhìn", "Xem toàn bộ", "Phóng to món đã chọn") đã có `title` đúng nội dung.
  - **Hoạt động gần đây**: thêm 2 món (Cây cảnh, Tủ/kệ) để có `history.length > 1` → bấm "🕘 Hoạt động gần đây" → danh sách hiện đúng 2 mục, đúng thứ tự mới nhất lên đầu ("Thêm Cây cảnh" trước "Thêm Tủ/kệ").
- Console sạch lỗi trong toàn bộ quá trình verify.
- Không phát hiện lỗi app mới, không hồi quy `resetView`/`focusAll`/`centerSelected` (TASK-135, không nhầm với `centerView` mới)/kéo-thả/Snap-to-Grid/Alignment Guides/khoảng cách tới tường.

## Status

COMPLETED
