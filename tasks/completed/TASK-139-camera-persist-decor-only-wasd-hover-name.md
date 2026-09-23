# TASK-139

## Title

Giữ camera qua mọi lần dựng lại scene + Chỉ nội thất + WASD + tên khi hover

## Goal

4 ý tưởng — 1 loại từ ChatGPT round 22 (round hỏi ý tưởng lần 22, TỰ tổng quát hoá lên thành phát hiện lớn hơn) + 3 ý còn lại. Đã vét trước 2 ý tưởng khác cùng batch — loại cả 2 TRƯỚC KHI giao việc:
- "Quick Duplicate ngay trong danh sách furniture" — ĐÃ CÓ 100%: đọc lại DOM/code xác nhận mỗi mục trong danh sách nội thất đã có nút "⧉" (class `room3d-furniture-duplicate`, gọi `duplicateFurniture(idx)`) ngay cạnh nút xoá "✕" — đúng y hệt mô tả "action duplicate trực tiếp, không cần mở context menu". Không làm thêm.
- "Chế độ Minimal UI cho viewport" — chính ChatGPT tự đánh giá "cần xử lý state/UI cẩn thận", rủi ro/công sức cao hơn 5 ý còn lại. Để dành backlog, ưu tiên các ý an toàn hơn round này.

**Phát hiện quan trọng khi vét ý tưởng #3 "Giữ camera khi chuyển Day/Night"**: đọc sâu code xác nhận vấn đề THỰC TẾ LỚN HƠN NHIỀU so với mô tả hẹp của ChatGPT — `camera.position`/`controls.target` được gán LẠI theo công thức mặc định cố định (`width*0.9, height*1.6, length*1.3`) ở ĐẦU MỖI LẦN effect dựng scene chạy lại, và effect này chạy lại theo TOÀN BỘ mảng dependency (14 giá trị: `tab, room, localFurniture, colors, resetSignal, colorOverrides, lightingMode, itemColorOverrides, showLabels, previewMode, hiddenIndices, snapStep, showRoomSurfaces, wireframeMode, cameraSpeed, shadowsEnabled, brightnessLevel`) — nghĩa là KHÔNG CHỈ đổi Ngày/Đêm mà MỌI toggle đã xây dựng suốt 20+ round qua (Ẩn nhãn, Snap, Ẩn tường/sàn, Khung dây, Tốc độ camera, Tắt bóng đổ, Độ sáng, Chế độ xem trước, thậm chí thêm/xoá/đổi màu 1 món) đều làm camera "nhảy" về khung hình mặc định, xoá sạch mọi pan/zoom/xoay user vừa làm. Đây là 1 papercut tích luỹ âm thầm qua nhiều round, không phải lỗi mới — sửa TẬN GỐC (giữ camera qua MỌI lần dựng lại, không chỉ riêng Ngày/Đêm) mang lại giá trị lớn hơn hẳn ý tưởng hẹp ban đầu.

- **Chế độ "Chỉ nội thất"**: toggle tạm ẩn các model trang trí phụ (thảm, chậu cây, tranh treo tường — không phải nội thất chính trong danh sách), giữ nguyên nội thất + tường/sàn/trần.
- **WASD điều khiển camera**: khi CHƯA chọn món nào, W/A/S/D làm thêm (không thay) phím mũi tên hiện có, thân thiện hơn với người quen điều khiển kiểu game.
- **Tên món khi hover (không cần chọn)**: rê chuột lên 1 món trong scene → hiện tooltip nhỏ tên món ngay tại vị trí con trỏ — khác nhãn nổi luôn-hiện (TASK-025/063, tắt được qua "Ẩn nhãn") và khác context menu.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - **Giữ camera qua mọi lần dựng lại (sửa gốc)**: thêm `const lastRoomIdRef = useRef(null)` (cùng chỗ khai báo `defaultViewRef`). Trong effect dựng scene: tính `defaultCameraPosition`/`defaultTarget` là 2 `THREE.Vector3` riêng theo đúng công thức cũ (không đổi công thức). Nếu `lastRoomIdRef.current === room?.id` VÀ `cameraRef.current`/`controlsRef.current` đã tồn tại (không phải lần dựng đầu tiên) → gán `camera.position`/`controls.target` từ giá trị CŨ (`cameraRef.current.position`/`controlsRef.current.target`) thay vì công thức mặc định. Ngược lại (lần đầu hoặc đổi sang phòng khác hẳn `room.id`) → dùng công thức mặc định như cũ. `defaultViewRef.current` LUÔN LUÔN lưu đúng `{ defaultCameraPosition, defaultTarget }` (KHÔNG đổi theo — giữ đúng ý nghĩa "về hẳn mặc định" của `resetView()`). Cập nhật `lastRoomIdRef.current = room?.id` cuối effect.
  - State `decorOnlyMode` (boolean, mặc định `false`, không persist). Theo dõi các mesh trang trí phụ đã tạo (`loadDecorModel` cho rug/2 plant, `addWallArt`) qua 1 mảng cục bộ trong effect (`decorMeshes = []`, push khi từng model load xong) — set `.visible = !decorOnlyMode` cho từng mesh trong mảng này (KHÔNG áp cho nội thất chính/tường/sàn/trần). Nút toggle "🪴 Chỉ nội thất" / "🖼️ Hiện đồ trang trí" trong dropdown "⋯ Thêm ▾". Thêm `decorOnlyMode` vào deps effect.
  - Trong nhánh "chưa chọn món nào" của `onKeyDown` (điều khiển camera bằng phím mũi tên đã có, TASK-114): thêm các `else if` cho `w`/`W`, `a`/`A`, `s`/`S`, `d`/`D` gọi ĐÚNG các hàm đã dùng cho mũi tên tương ứng (`w`≈`ArrowUp`, `s`≈`ArrowDown`, `a`≈`ArrowLeft`, `d`≈`ArrowRight`) — tái dùng nguyên logic, không viết thêm.
  - Bridge state `hoveredItemName` (string hoặc `null`) + `hoverScreenPos` (`{x,y}` toạ độ trang) — cập nhật trong nhánh hover-only của `onPointerMove` (đã raycast `draggables` sẵn cho `hoverOutline`) khi trúng 1 mesh: set tên + toạ độ màn hình từ `evt.clientX/clientY`; khi không trúng mesh nào → `null`. JSX: `<span style={{position:'fixed', left, top, ...}}>` nhỏ hiện tên khi `hoveredItemName` khác `null`, `pointerEvents:'none'` (không chặn thao tác chuột bên dưới).
  - Thêm dòng mới vào bảng "❓ Phím tắt" cho cả 3 tính năng UI mới + ghi chú "camera giữ nguyên qua các thao tác khác" (không phải phím tắt nhưng đáng ghi vào đây để user biết hành vi đã thay đổi).

## Out of scope

- Không đổi hành vi `resetView()`/`focusAll()`/`focusOnSelected()`/`centerView()` hiện có — vẫn hoạt động y hệt, chỉ KHÔNG còn bị các toggle khác vô tình can thiệp giữa chừng.
- Đổi `room.id` (chuyển hẳn sang thiết kế/phòng khác) VẪN reset camera về mặc định theo kích thước phòng mới — đúng hành vi hợp lý (phòng khác kích thước khác, camera cũ có thể không còn hợp).
- 2 ý tưởng đã loại ở mục Goal.

## Dependencies

Toàn bộ 17 giá trị trong deps của effect dựng scene hiện có (ảnh hưởng trực tiếp bởi thay đổi này). TASK-027 (`loadDecorModel`/`addWallArt`, đối tượng bị ẩn/hiện). TASK-114 (phím mũi tên điều khiển camera, mẫu tái dùng cho WASD). TASK-035 (`hoverOutline`, raycast hover sẵn có, tái dùng cho tên khi hover).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Xoay/pan/zoom camera tới 1 góc bất kỳ (không phải mặc định), rồi bấm BẤT KỲ toggle nào đã có (Ẩn nhãn, Buổi tối, Snap, Ẩn tường/sàn, Khung dây, Tốc độ camera, Tắt bóng đổ, Độ sáng, Chế độ xem trước) → camera GIỮ NGUYÊN góc/khoảng cách đó, không nhảy về mặc định.
- Bấm "↺ Đặt lại góc nhìn" sau khi đã xoay/pan → vẫn về ĐÚNG khung hình mặc định ban đầu (không bị lệch do lần dựng gần nhất).
- Chuyển sang thiết kế/phòng khác (đổi hẳn `room.id`) → camera về khung hình mặc định phù hợp phòng mới (không giữ vị trí phòng cũ).
- Bấm "🪴 Chỉ nội thất" → thảm/chậu cây/tranh tường biến mất, nội thất chính + tường/sàn/trần vẫn còn nguyên. Bấm lại → hiện lại đúng.
- Nhấn W/A/S/D khi chưa chọn món → camera phản ứng giống hệt phím mũi tên tương ứng.
- Rê chuột lên 1 món (chưa click chọn) → tên món hiện gần con trỏ; di chuột ra khỏi món → tên biến mất ngay.
- Không hồi quy: mọi tính năng camera/toggle đã có từ trước, kéo-thả, Snap-to-Grid, Alignment Guides, khoảng cách tới tường, Về tâm phòng/Về giữa phòng, chọn/xoay/context menu.
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome — ưu tiên verify kỹ phần giữ camera (rủi ro cao nhất, đụng effect lõi dựng scene) trước khi verify 3 tính năng nhỏ còn lại.

## Coordinator verification

- `npm run build` PASS ngay lần đầu cho phần sửa camera (rủi ro cao nhất, đụng effect lõi dựng scene) — verify + Docker rebuild + Playwright RIÊNG cho phần này TRƯỚC khi làm tiếp 3 tính năng nhỏ còn lại, đúng ưu tiên đã ghi trong mục Testing.
- **Phát hiện quan trọng lúc code (không chỉ lúc thiết kế)**: bản thiết kế ban đầu định đọc thẳng `cameraRef.current`/`controlsRef.current` trong lần dựng scene MỚI để biết vị trí camera CŨ — nhưng đọc lại kỹ `useEffect` cleanup xác nhận cleanup LUÔN chạy TRƯỚC lần effect kế tiếp và đã null hoá 2 ref này (`cameraRef.current = null`) — nếu làm theo thiết kế ban đầu, `sameRoom` sẽ luôn `false`, tính năng vô tác dụng. Sửa bằng cách thêm `prevCameraStateRef` MỚI, chụp lại `{position, target, roomId}` NGAY TRONG cleanup (trước dòng null hoá) — cleanup vẫn có quyền truy cập `camera`/`controls`/`room` qua closure của chính lần effect đó.
- Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS (chạy 2 lần — sau phần sửa camera, và sau khi thêm đủ 4 tính năng).
- Verify E2E qua Claude in Chrome (job đã tạo trước đó):
  - **Giữ camera**: chọn "Bàn trung tâm" → "🔍 Phóng to món đã chọn" (khung hình zoom rất sát, khác hẳn mặc định) → bấm "🔲 Chế độ khung dây" → screenshot xác nhận khung hình GIỮ NGUYÊN Y HỆT (chỉ nội thất đổi sang khung dây, camera không nhúc nhích) — thành công ngay từ thử nghiệm đầu. Sau đó bấm "↺ Đặt lại góc nhìn" → screenshot xác nhận về ĐÚNG khung hình mặc định rộng ban đầu (không bị lệch do lần dựng gần nhất) — xác nhận `defaultViewRef` không bị ảnh hưởng bởi việc giữ camera.
  - **Chỉ nội thất**: bấm toggle → screenshot xác nhận thảm + 2 chậu cây biến mất hoàn toàn, nội thất chính (sofa/kệ/đèn/bàn) + tường/sàn/trần giữ nguyên. Bấm lại → hiện lại đúng.
  - **WASD**: dispatch phím "d" 2 lần (kèm `pointerenter` trước để qua guard `pointerOverCanvas`, đúng Known Issue đã ghi từ TASK-138) → screenshot xác nhận camera xoay đúng hướng, góc thay đổi rõ rệt so với trước.
  - **Tên khi hover**: dispatch `pointermove` tới toạ độ mesh "Kệ/tủ lưu trữ" → tooltip hiện đúng tên ngay cạnh vị trí con trỏ (screenshot xác nhận). Dispatch `pointerleave` → tooltip biến mất ngay.
- Console sạch lỗi trong toàn bộ quá trình verify (nhiều vòng rebuild/reload).
- Không phát hiện lỗi app mới, không hồi quy bất kỳ tính năng camera/toggle nào đã có từ trước (TASK-034/043/058/076/114/118/127/131/133/135/136/137/138), kéo-thả, Snap-to-Grid, Alignment Guides, chọn/xoay/context menu.

## Status

COMPLETED
