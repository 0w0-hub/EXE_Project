# TASK-135

## Title

Đưa món đang chọn về tâm phòng + hiện góc xoay hiện tại

## Goal

2 ý tưởng từ ChatGPT round 18 (round hỏi ý tưởng lần 18). Đã vét trước 4 ý tưởng khác cùng batch — loại cả 4 TRƯỚC KHI giao việc:
- "Cảnh báo Furniture chồng lấn" — TRÙNG PHẦN LỚN với tính năng đã có: đọc lại code xác nhận `overlapsAnother()` + đổi màu viền hover sang đỏ khi 2 món giao nhau lúc kéo ĐÃ có từ TASK-052 (`hoverOutline.material.color.set(overlapsAnother(dragging) ? 0xc4433d : 0xffffff)`). ChatGPT tự nhận "một nhóm tính năng hiện chưa có trong các round trước" — SAI, đã có. Không làm thêm (phần chênh lệch duy nhất — thêm dòng chữ "Các món đang chồng lên nhau" cạnh viền đỏ có sẵn — giá trị quá nhỏ để tách task riêng).
- "Cảnh báo Furniture vượt khỏi phòng" — SAI hoàn toàn: đọc code xác nhận `nextX`/`nextZ` LUÔN được `THREE.MathUtils.clamp(..., -halfW, halfW)`/`clamp(..., -halfL, halfL)` khi kéo (từ TASK-004/007) — về mặt toán học, món KHÔNG BAO GIỜ có thể vượt khỏi phòng lúc kéo. Không có tình huống nào để cảnh báo.
- "Duplicate + Flip" (tạo bản đối xứng trái/phải khi nhân đôi) — giá trị thực tế thấp trong codebase này: toàn bộ 30+ loại nội thất là hình khối procedural đơn giản (hộp/trụ, không phải model 3D chi tiết có tính bất đối xứng thật như model catalog thật) — "lật đối xứng" 1 khối hộp đối xứng cho ra kết quả THỊ GIÁC GIỐNG HỆT bản gốc, trừ khi món đã bị xoay lệch trục thì mới có khác biệt (rất hẹp). Không đủ giá trị so với công sức.
- "Quick Delete Selected trong Selection Info" — dư thừa: xoá 1 món đã chọn ĐÃ có 3 cách (phím Delete/Backspace TASK-040, nút ✕ trong danh sách nội thất, "✕ Xoá" trong context menu chuột phải TASK-124) — thêm nút thứ 4 ngay trong nhóm toolbar "món đang chọn" (cạnh Phóng to/Xoay/Đặt lại vị trí, đều KHÔNG phá huỷ) tăng rủi ro bấm nhầm xoá do đặt cạnh các nút thao tác nhẹ nhàng khác, đi ngược tinh thần gọn nhẹ toolbar của TASK-118.

- **"Center Selected"**: đưa món đang chọn về đúng tâm mặt bằng phòng (x=0, z=0), GIỮ NGUYÊN góc xoay — khác `resetSelectedTransform` (TASK-116, đưa về vị trí TÍNH TOÁN BAN ĐẦU từ `resolveFurniturePositions` + góc xoay 0°). Hữu ích khi user muốn nhanh chóng đặt 1 món (vd bàn trung tâm, thảm) đúng giữa phòng mà không cần kéo tay ước lượng.
- **Hiển thị góc xoay hiện tại**: khi đã chọn 1 món, hiện "Góc xoay: X°" cập nhật ngay khi xoay (nút Xoay trái/phải, phím Q/E, nhấp đúp xoay 90°, Đặt lại vị trí/góc xoay) — giúp căn chỉnh chính xác không cần đoán bằng mắt.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - Bridge state `selectedRotationDeg` (số nguyên độ, 0-359) — cùng pattern `dragWallDistance`/`contextMenu`.
  - `selectMesh()`: set `selectedRotationDeg` từ `mesh.rotation.y` khi chọn (0 khi bỏ chọn).
  - `rotateSelectedRef.current`, phím Q/E (trong `onKeyDown`), `onDoubleClick` (xoay 90°), `resetTransformRef.current`: mỗi nơi mutate `rotation.y` xong → cập nhật lại `selectedRotationDeg` tương ứng (đọc lại từ mesh, không tính tay trùng lặp logic).
  - Hàm `centerSelected()` mới (theo đúng pattern `resetSelectedTransform`/ref-delegation: `centerSelectedRef` khai báo cùng chỗ `resetTransformRef`, gán thân thật trong effect) — set `position.x = 0`, `position.z = 0` (giữ `position.y`/`rotation` nguyên), cập nhật label + `syncSelectionOutline()`, có `pushHistory('Đưa "..." về tâm phòng')`.
  - JSX: thêm nút "🎯 Về tâm phòng" vào nhóm nút hiện khi `selectedFurnitureIndex != null` (cạnh "↺ Đặt lại vị trí/góc xoay"), khoá đúng bởi `previewMode` (đây là mutation vị trí, giống các nút khác trong nhóm). Thêm text "📐 Góc xoay: {selectedRotationDeg}°" nhỏ cạnh nhóm nút này khi đã chọn món.

## Out of scope

- Không đổi `resetSelectedTransform` (TASK-116) hiện có — `centerSelected` là hành động RIÊNG, không thay thế.
- Không tính/hiện góc xoay khi CHƯA chọn món nào.
- 4 ý tưởng đã loại ở mục Goal.

## Dependencies

TASK-040/042/034 (xoay gốc), TASK-116 (`resetSelectedTransform`, mẫu ref-delegation tham khảo trực tiếp).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Chọn 1 món → hiện đúng "📐 Góc xoay: 0°" (hoặc góc hiện tại nếu đã xoay từ trước). Xoay trái/phải/Q/E/nhấp đúp → số độ cập nhật đúng ngay.
- Bấm "🎯 Về tâm phòng" → món di chuyển về đúng x=0,z=0, góc xoay giữ nguyên (không reset về 0°).
- Đặt lại vị trí/góc xoay (TASK-116) → góc xoay hiện về đúng 0°.
- Preview Mode khoá đúng nút "Về tâm phòng" (mutation vị trí).
- Không hồi quy: `resetSelectedTransform`, kéo-thả, Snap-to-Grid, Alignment Guides, khoảng cách tới tường (TASK-133).
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome.

## Coordinator verification

- `npm run build` PASS (`✓ built in 2.46s`).
- **Phát hiện + tự sửa 1 rủi ro lúc code (trước khi verify)**: bản nháp đầu tiên của `centerSelectedRef` có gọi `pushHistory(...)` — đọc lại `resetTransformRef`/`rotateSelectedRef` xác nhận CẢ HAI đều KHÔNG gọi `pushHistory` (đúng quyết định kiến trúc TASK-028/102/116: vị trí/góc xoay kéo-thả không theo dõi trong state React nên Undo/Redo không có gì đúng để khôi phục). Bỏ `pushHistory` khỏi `centerSelectedRef` để nhất quán — tránh tạo 1 mục Undo "giả" (bấm Hoàn tác sẽ không thực sự đưa món về vị trí cũ).
- Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS.
- Verify E2E qua Claude in Chrome trên job đã tạo trước đó: chọn "Bàn trung tâm" qua click tên trong danh sách (TASK-109) → "📐 Góc xoay: 0°" hiện đúng. Bấm "↻ Xoay phải 15°" 2 lần → "30°" đúng. Bấm "🎯 Về tâm phòng" → góc xoay GIỮ NGUYÊN "30°" (đúng yêu cầu, khác Reset), screenshot xác nhận món di chuyển về đúng giữa phòng. Bấm "↺ Đặt lại vị trí/góc xoay" → góc xoay về đúng "0°".
- Console sạch lỗi.
- Không phát hiện lỗi app mới, không hồi quy `resetSelectedTransform`/kéo-thả/Snap-to-Grid/Alignment Guides/khoảng cách tới tường (TASK-133).

## Status

COMPLETED
