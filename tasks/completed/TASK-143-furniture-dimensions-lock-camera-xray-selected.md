# TASK-143

## Title

Hiện kích thước món đang chọn + Khoá camera + Chế độ xuyên nhẹ (X-ray) cho món đang chọn

## Goal

3 ý tưởng từ ChatGPT round 25 (hỏi lần thứ 2 trong cùng phiên chat, sau khi báo cáo TASK-142 đã xong) — đã vét 6 ý tưởng mới, loại 1/6 + để dành backlog 2/6 TRƯỚC KHI giao việc:

- "Grid Size Selector" — GẦN NHƯ TRÙNG: Snap-to-Grid (TASK-117) đã có đúng cơ chế 3 mức bước lưới (`Tắt/0.1m/0.25m`), tuần hoàn qua 1 nút `🧲 Snap: X`. ChatGPT đề xuất giá trị `5/10/20cm` khác biệt nhỏ về đơn vị/UI (dropdown thay vì cycle-button) nhưng CÙNG BẢN CHẤT — không đủ khác biệt để làm task riêng, loại.
- "Ghost Preview khi thêm furniture" — ĐỔI LUỒNG THAO TÁC hiện có (bấm nút loại đồ = thêm ngay lập tức, có từ TASK-018) sang luồng 2 bước (bấm loại đồ → xem preview bán trong suốt theo con trỏ → bấm vào sàn để đặt) — rủi ro cao hơn nhiều so với 2 ý còn lại (thay đổi hành vi nút đã quen thuộc qua 30+ loại đồ, không đơn thuần thêm tính năng cộng thêm), để dành backlog.
- "Quick Duplicate theo hướng" — cần thêm UI chọn hướng (4 nút mũi tên) + quyết định offset bao nhiêu mét, phức tạp hơn 1 round bình thường khi làm CHUNG với 2 ý còn lại, để dành backlog (có thể tận dụng `transformOverridesRef` mới từ TASK-142 để gán thẳng vị trí offset cho món nhân đôi).

3 ý tưởng còn lại — dùng ngay:

- **Thước đo kích thước furniture**: khi chọn 1 món, hiện dòng "📏 Kích thước: Rộng × Sâu × Cao" đọc từ `furnitureSize(item.category)` đã có sẵn (không cần model/config mới).
- **Lock Camera**: nút khoá `OrbitControls` (toggle `controls.enabled`), tránh vô tình kéo/cuộn đổi góc nhìn lúc đang tập trung chỉnh nội thất — CHƯA có toggle nào tương tự (chỉ có disable NỘI BỘ lúc đang kéo 1 món, không phải nút user chủ động bật/tắt).
- **X-ray Selected**: khi chọn 1 món, nút bật chế độ xuyên nhẹ CHỈ cho chính món đó (`material.opacity`/`transparent`), giúp nhìn xuyên để kiểm tra vị trí bên trong scene mà không ẩn món khác.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - **Kích thước món đang chọn**: dòng "📏 Kích thước: WxDxH m" cạnh "📍 Vị trí"/"📐 Góc xoay" hiện có, tính từ `furnitureSize(localFurniture[selectedFurnitureIndex]?.category)` — không cần bridge state mới, tính trực tiếp ở JSX từ `selectedFurnitureIndex` + `localFurniture` đã có.
  - **Lock Camera**: state `cameraLocked` (không persist, giống các toggle cosmetic khác) + nút "🔒/🔓 Khoá góc nhìn" trong dropdown "⋯ Thêm ▾". Trong effect dựng scene: `controls.enabled = !cameraLocked` khi khởi tạo — NHƯNG phải tương thích với cơ chế disable NỘI BỘ có sẵn lúc kéo furniture (dòng ~2005/2025/2326/2348) — dùng chung 1 biến cờ để không bị 2 cơ chế ghi đè lẫn nhau (khi camera đã khoá, kéo xong KHÔNG được tự động mở khoá lại).
  - **X-ray Selected**: nút "👻 Xuyên nhẹ" chỉ hiện khi có `selectedFurnitureIndex`. Khi bật: set `material.transparent = true; material.opacity = 0.35` cho CHÍNH mesh đang chọn (và children nếu là GLTF model qua traverse, đúng pattern wireframe TASK-136); tắt thì khôi phục `opacity = 1`. Không persist, tự tắt khi đổi selection hoặc rebuild scene (giống thói quen KHÔNG lưu các toggle trực quan tạm thời khác).

## Out of scope

- "Grid Size Selector", "Ghost Preview", "Quick Duplicate theo hướng" — đã loại/để dành backlog ở mục Goal.
- Không đổi luồng thêm/xoá/chọn nội thất hiện có.

## Dependencies

TASK-136 (pattern traverse material cho wireframe, tái dùng cho X-ray), TASK-138 (dòng "📍 Vị trí"/khu vực hiện thông tin món đang chọn, thêm dòng kích thước cạnh đó), `furnitureSize()` có sẵn từ TASK-004+.

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Chọn 1 món → dòng "📏 Kích thước: WxDxH m" hiện đúng khớp `furnitureSize(category)`.
- Bật "Khoá góc nhìn" → kéo chuột trên nền phòng KHÔNG xoay/pan camera; tắt lại → hoạt động bình thường.
- Khoá camera rồi kéo-thả 1 món nội thất (vẫn được phép, khác khoá TỪNG món TASK-141) → sau khi thả chuột, camera VẪN khoá (không bị cơ chế nội bộ mở khoá nhầm).
- Chọn 1 món → bật "Xuyên nhẹ" → CHỈ món đó trở nên bán trong suốt, món khác không đổi; tắt lại → khôi phục đúng độ mờ ban đầu.
- Đổi selection sang món khác trong khi đang X-ray → món cũ tự khôi phục đúng (không "kẹt" trong suốt).
- Không hồi quy: mọi tính năng đã có (camera giữ nguyên qua toggle TASK-139, khoá/isolate/lưới sàn TASK-141, transform persist TASK-142).
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome.

## Coordinator verification

- **Kích thước món đang chọn**: thêm nhánh JSX tính trực tiếp `furnitureSize(localFurniture[selectedFurnitureIndex]?.category)` (không cần bridge state mới, dùng ngay 2 giá trị đã có trong scope). Hiện "📏 Kích thước: WxDxH m" cạnh "📍 Vị trí"/"📐 Góc xoay". Verify live: chọn "Bàn trung tâm" → hiện đúng "📏 Kích thước: 0.9×0.9×0.45m" (khớp `furnitureSize('table')`).
- **Lock Camera**: state `cameraLocked` đưa vào dependency array effect (đúng pattern mọi toggle cosmetic khác — rebuild không mất camera nhờ `prevCameraStateRef` TASK-139 đã áp dụng cho MỌI lý do rebuild). `controls.enabled = !cameraLocked` gán lúc khởi tạo; 2 chỗ trước đó gán cứng `controls.enabled = true` sau khi kết thúc kéo furniture/resize phòng (`onPointerUp`) đổi thành `!cameraLocked` để không tự mở khoá nhầm khi camera đang bị khoá thủ công. Nút "🔒/🔓 Khoá góc nhìn" trong dropdown "⋯ Thêm ▾". Verify live: bật khoá → kéo chuột trên nền phòng → khung hình GIỮ NGUYÊN (screenshot trước/sau giống hệt); mở khoá lại thành công.
- **X-ray Selected**: nút "👻 Xuyên nhẹ"/"👻 Tắt xuyên nhẹ" chỉ hiện khi có `selectedFurnitureIndex`, ref-delegation `toggleXrayRef` (đúng pattern `resetTransformRef`/`centerSelectedRef`). Biến cục bộ `xrayedMesh` trong closure effect theo dõi món đang xuyên; hàm `setMeshXray(mesh, on)` traverse mesh (kể cả model GLTF con qua `proxyMesh.add(model)`) set `transparent`/`opacity`/`needsUpdate`. `selectMesh()` khôi phục đúng món CŨ khi đổi selection (tránh "kẹt" trong suốt) — không mang xray sang món mới. Effect tự tắt `xrayEnabled` ở đầu mỗi lần chạy lại nếu còn sót `true` từ trước (phòng trường hợp 1 toggle KHÁC kích hoạt rebuild trong lúc đang bật xray — mesh mới luôn opacity mặc định 1, tránh nhãn nút nói sai). Verify live: chọn "Bàn trung tâm" → bật Xuyên nhẹ → zoom xác nhận mesh mờ hẳn (thấy xuyên xuống thảm bên dưới); tắt lại → khôi phục đúng độ đặc; bật lại rồi CHUYỂN SANG chọn "Sofa/giường chính" → xác nhận nút tự về "👻 Xuyên nhẹ" (đã tắt đúng cho món cũ, không dính sang món mới).
- `npm run build` PASS, Docker rebuild frontend, Playwright TASK-098 regression 3/3 PASS.
- **Gặp lại Known Issue công cụ đã biết** (click toạ độ đôi khi không phản hồi dù UI đúng, đặc biệt trong dropdown "⋯ Thêm ▾") — xác nhận bằng cách đọc lại `textContent` của nút NGAY SAU click tọa độ (không đổi) rồi retry qua `document.querySelectorAll('button').find(...).click()` trực tiếp (đổi đúng ngay).
- Console sạch lỗi (`localhost.*ERROR`, không có kết quả) trong suốt quá trình verify.

## Status

COMPLETED
