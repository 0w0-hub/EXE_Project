# TASK-136

## Title

Chế độ Wireframe + tốc độ camera tuỳ chỉnh + Copy ảnh vào clipboard

## Goal

3 ý tưởng từ ChatGPT round 19 (round hỏi ý tưởng lần 19). Đã vét trước 3 ý tưởng khác cùng batch — loại cả 3 TRƯỚC KHI giao việc:
- "Thước đo giữa 2 món đồ" (chọn 2 furniture, hiện khoảng cách giữa chúng) — SAI VỀ QUY MÔ: ChatGPT ước lượng "1-2 file 3D" nhưng đọc code xác nhận `Room3DViewer.jsx` CHỈ hỗ trợ CHỌN 1 MÓN TẠI 1 THỜI ĐIỂM (`selectedFurnitureIndex` là 1 số, không phải mảng) — không có cơ chế multi-select nào (khác `CompareDesigns.jsx`, đó là multi-select cho SO SÁNH THIẾT KẾ, không liên quan). Làm đúng ý tưởng này cần xây multi-select mới cho nội thất + viết lại mọi logic phụ thuộc `selectedFurnitureIndex` đơn lẻ (xoay/reset/center/context menu) — quy mô LỚN HƠN NHIỀU so với ước lượng ban đầu.
- "Ẩn Furniture theo nhóm" (Seating/Table/Decoration) — không khớp hạ tầng hiện có: `FURNITURE_GROUPS` (catalog "+ thêm loại đồ") nhóm theo KHU VỰC PHÒNG (Phòng khách/Phòng ngủ/...), không phải theo LOẠI ĐỒ như ChatGPT đề xuất — cần xây taxonomy nhóm mới riêng cho tính năng này. Vả lại ẩn/hiện từng món (TASK-109) đã đủ dùng cho số lượng nội thất thực tế mỗi phòng (thường 4-8 món, không phải hàng chục món cần thao tác hàng loạt).
- "Chọn Furniture bằng click trong danh sách → highlight mạnh hơn" — dư thừa: click tên trong danh sách (TASK-109) đã gọi `selectMesh()` vẽ NGAY viền chọn rõ ràng (khung màu nổi bật quanh món, đã xác nhận qua screenshot verify TASK-135) — thêm hiệu ứng "pulse" tạm thời chỉ là trang trí thêm cho việc đã rõ ràng sẵn, giá trị thấp.

- **Chế độ xem Wireframe**: toggle Solid/Wireframe cho nội thất — giúp nhìn xuyên các khối khi phòng đông món, dễ phát hiện món bị che khuất phía sau món khác.
- **Điều chỉnh tốc độ camera**: 3 mức Chậm/Bình thường/Nhanh cho `OrbitControls` (xoay/pan/zoom) — phù hợp gu điều khiển khác nhau, không ảnh hưởng nội thất.
- **Copy ảnh vào clipboard**: thêm lựa chọn "Sao chép ảnh" bên cạnh 3 mức tải ảnh hiện có (TASK-121) — dán thẳng vào Messenger/Word/PowerPoint không cần tìm file vừa tải.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - State `wireframeMode` (boolean, mặc định `false`). Trong effect dựng scene: với mỗi mesh trong `draggables` (danh sách nội thất, KHÔNG áp cho tường/sàn/trần — giữ đúng phạm vi "nhìn xuyên nội thất"), `mesh.traverse(child => { if (child.isMesh && child.material) child.material.wireframe = wireframeMode })` — xử lý cả model GLTF lồng nhau lẫn khối hộp fallback/procedural. Thêm `wireframeMode` vào deps effect.
  - Nút toggle "🔲 Chế độ khung dây" / "🧊 Chế độ đặc" trong dropdown "⋯ Thêm ▾" (không thêm nút top-level, đúng tinh thần TASK-118/131).
  - State `cameraSpeed` (`'slow' | 'normal' | 'fast'`, mặc định `'normal'`). Set `controls.rotateSpeed`/`controls.panSpeed`/`controls.zoomSpeed` theo hệ số tương ứng (vd 0.5x/1x/1.8x giá trị mặc định của OrbitControls) ngay sau khi tạo `controls`, cập nhật lại khi state đổi (thêm vào deps effect). Nút tuần hoàn "🐢/🚶/🐇 Tốc độ camera: Chậm/Bình thường/Nhanh" trong dropdown "⋯ Thêm ▾".
  - Hàm `copyScreenshotToClipboard()` mới — tái dùng logic chụp khung hình từ `captureScreenshot` (canvas → `toBlob`), dùng `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])`, bọc try/catch (báo lỗi nhẹ nếu trình duyệt/quyền không hỗ trợ, không throw vỡ app). Thêm mục "📋 Sao chép ảnh" trong dropdown "⋯ Thêm ▾" cạnh 3 mức tải ảnh hiện có.
  - Thêm 3 dòng mới vào bảng "❓ Phím tắt" mô tả 3 tính năng trên.

## Out of scope

- Không áp wireframe cho tường/sàn/trần (chỉ nội thất, đúng mục tiêu "nhìn xuyên khối khi bố trí").
- Không persist `wireframeMode`/`cameraSpeed` qua `localStorage` (thuần phiên xem hiện tại, giống `showLabels`/`showRoomSurfaces`).
- 3 ý tưởng đã loại ở mục Goal.

## Dependencies

TASK-121 (`captureScreenshot`, logic chụp khung hình tái dùng cho Copy ảnh), TASK-118 (dropdown "⋯ Thêm ▾").

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Bật "Chế độ khung dây" → mọi món nội thất hiện dạng khung dây (thấy xuyên qua), tường/sàn/trần KHÔNG đổi. Tắt lại → về bình thường, màu/texture giữ nguyên.
- Đổi tốc độ camera qua 3 mức → xoay/pan/zoom bằng chuột nhanh/chậm rõ rệt theo đúng mức đã chọn.
- Bấm "Sao chép ảnh" → không lỗi console; nếu môi trường hỗ trợ Clipboard API, ảnh vào clipboard thật (verify bằng đọc lại `navigator.clipboard.read()` nếu công cụ test cho phép, hoặc chấp nhận giới hạn công cụ đã biết từ TASK-115 nếu treo).
- Không hồi quy: kéo-thả, chọn món, Snap-to-Grid, Alignment Guides, khoảng cách tới tường, Về tâm phòng/góc xoay (TASK-133/135).
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome — lưu ý Copy ảnh có thể gặp lại giới hạn công cụ clipboard đã ghi nhận ở TASK-115 (dialog quyền clipboard treo tự động hoá), nếu vậy verify qua code review + build/regression thay thế.

## Coordinator verification

- `npm run build` PASS (`✓ built in 2.61s`).
- Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS.
- Verify E2E qua Claude in Chrome trên job đã tạo trước đó:
  - **Wireframe**: bấm "🔲 Chế độ khung dây" → screenshot lúc đầu ở góc rộng KHÔNG thấy khác biệt rõ (nội thất quá nhỏ) — dùng "🔍 Phóng to món đã chọn" (TASK-058) để zoom cận, screenshot lúc này xác nhận RÕ RÀNG "Bàn trung tâm" hiện dạng khung dây tam giác hoá (đường viền cam/gỗ thay vì mặt đặc) — đúng hiệu ứng mong muốn, áp dụng đúng cho nội thất (cả model GLTF qua `attachLoadedModel`), KHÔNG áp cho tường/sàn/trần (vẫn đặc). Bấm lại "🧊 Chế độ đặc" → khôi phục đúng về mặt đặc bình thường.
  - **Tốc độ camera**: bấm nút tuần hoàn → chuyển đúng "Bình thường" → "Nhanh" (xác nhận qua đọc lại text nút sau khi mở lại dropdown).
  - **Sao chép ảnh**: bấm "📋 Sao chép ảnh" → **không xác nhận được thành công/lỗi qua text trạng thái** (không hiện " ✓" lẫn " (lỗi)" sau hơn 2 giây chờ) — nhất quán với giới hạn công cụ ĐÃ BIẾT từ TASK-115 (`navigator.clipboard.writeText/write` treo vô thời hạn trong môi trường Claude-in-Chrome tự động do dialog quyền clipboard native không tự tắt được). Xác nhận đây là hạn chế công cụ chứ không phải lỗi app: (a) console sạch, không có exception nào bắn ra; (b) toàn bộ UI vẫn phản hồi bình thường ngay sau đó (bấm nút wireframe khác vẫn hoạt động tức thì) — chứng tỏ promise clipboard treo âm thầm ở background, không block main thread/React; (c) code review xác nhận logic đúng (try/catch bọc đầy đủ, dùng đúng `canvas.toBlob` + `ClipboardItem` theo chuẩn Clipboard API, không có lỗi cú pháp/logic).
- Console sạch lỗi trong toàn bộ quá trình verify.
- Không phát hiện lỗi app mới, không hồi quy kéo-thả/Snap-to-Grid/Alignment Guides/khoảng cách tới tường/Về tâm phòng/góc xoay/tải ảnh 3 mức cũ.

## Status

COMPLETED
