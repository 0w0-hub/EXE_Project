# TASK-137

## Title

Nhập góc xoay trực tiếp + độ sáng tuỳ chỉnh + tắt bóng đổ + Esc bỏ chọn

## Goal

4 ý tưởng từ ChatGPT round 20 (round hỏi ý tưởng lần 20). Đã vét trước 2 ý tưởng khác cùng batch — loại cả 2 TRƯỚC KHI giao việc:
- "Deselect bằng click vùng trống" — ĐÃ CÓ 100%: đọc lại `onPointerUp` xác nhận dòng `if (!resizingAxis && moved < 5) selectMesh(dragging || null)` — khi nhấp (không kéo) vào chỗ trống, `dragging` là `null` nên `selectMesh(null)` được gọi, bỏ chọn đúng như ý tưởng mô tả. Comment code sẵn có còn ghi rõ: "nhấp ra chỗ trống thì bỏ chọn" (TASK-040). Không làm thêm.
- "Chế độ Perspective/Orthographic" — quy mô lớn hơn ước lượng "1 file, độ khó trung bình": đổi loại camera lúc runtime cần duy trì đồng bộ 2 loại camera (Perspective/Orthographic) hoặc viết lại toàn bộ logic resize (Orthographic tính lại `left/right/top/bottom` thay vì `aspect/fov`), raycasting, OrbitControls rewire — camera hiện xuyên suốt rất nhiều hàm (`resetView`, `focusOnSelected`, `focusAll`, `captureScreenshot`, resize handler...). Đối tượng chính "người dùng phổ thông" cũng ít cần góc nhìn kỹ thuật kiểu CAD này. Để dành backlog nếu có nhu cầu thật rõ ràng hơn.

- **Nhập góc xoay trực tiếp**: thay dòng chữ tĩnh "📐 Góc xoay: X°" (TASK-135) bằng ô nhập số — gõ trực tiếp 0-360° thay vì bấm nhiều lần nút xoay 15°.
- **Độ sáng 3D tuỳ chỉnh**: nút tuần hoàn 5 mức độ sáng, ĐỘC LẬP với toggle Ngày/Đêm (TASK-043) — điều chỉnh độ phơi sáng tổng thể, không đổi preset ánh sáng.
- **Bật/tắt bóng đổ**: toggle `renderer.shadowMap.enabled` — xem hình khối rõ hơn (đỡ rối bởi bóng chồng chéo) khi phòng đông món.
- **Esc bỏ chọn nội thất**: nhấn Esc khi đang chọn 1 món → bỏ chọn ngay (hành vi RIÊNG trong viewport, độc lập với Esc đóng dropdown/context menu đã có TASK-090/124 — nhiều `useEscapeKey` có thể cùng tồn tại, mỗi cái tự kiểm tra điều kiện riêng).

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - Thay `<span>📐 Góc xoay: {selectedRotationDeg}°</span>` bằng `<input type="number" min="0" max="359" value={selectedRotationDeg} onChange={...}>` — gọi hàm mới `setSelectedRotationInput(deg)` (ref-delegation giống `rotateSelected`/`centerSelected`: `setRotationRef` gán thân thật trong effect, set thẳng `selectedMesh.rotation.y = THREE.MathUtils.degToRad(deg)`, cập nhật `selectedRotationDeg`, `syncSelectionOutline()`). Khoá đúng bởi `previewMode`. Giá trị ngoài 0-359 tự kẹp (`clamp`).
  - State `brightnessLevel` (số nguyên 0-4, mặc định 2 = "Bình thường", không persist). Mảng hệ số `[0.6, 0.8, 1.0, 1.2, 1.5]` nhân thêm vào `renderer.toneMappingExposure` đã tính theo `lightingMode` (giữ nguyên công thức `isEvening ? 0.85 : 1.05` hiện có, nhân thêm hệ số này). Nút tuần hoàn "🔅/🔆 Độ sáng: {nhãn mức}" trong dropdown "⋯ Thêm ▾".
  - State `shadowsEnabled` (boolean, mặc định `true`, không persist). Set `renderer.shadowMap.enabled = shadowsEnabled` ngay sau khi tạo renderer. Nút toggle "🌑 Tắt bóng đổ"/"☀️ Bật bóng đổ" trong dropdown "⋯ Thêm ▾".
  - `useEscapeKey(selectedFurnitureIndex != null, () => selectMeshRef.current?.(null))` — thêm 1 lời gọi mới cạnh 3 lời gọi `useEscapeKey` đã có (dropdown/menu/context menu), dùng `selectMeshRef` mới (ref-delegation, vì `selectMesh` thật nằm trong effect) để gọi được từ ngoài.
  - Thêm dòng mới vào bảng "❓ Phím tắt" cho cả 4 tính năng.

## Out of scope

- Không đổi cách hoạt động deselect-khi-click-trống hiện có (đã đúng, không cần sửa).
- Không làm Perspective/Orthographic toggle (lý do ở mục Goal).
- Không persist `brightnessLevel`/`shadowsEnabled` (thuần phiên xem hiện tại, giống các toggle khác đã có).

## Dependencies

TASK-135 (`selectedRotationDeg`, nơi thay ô nhập), TASK-043 (`lightingMode`/`isEvening`, công thức exposure gốc), TASK-090/124 (mẫu `useEscapeKey` nhiều lời gọi song song).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Chọn 1 món, gõ số vào ô góc xoay (vd 200) + Enter/blur → món xoay đúng góc đó ngay.
- Tuần hoàn độ sáng qua 5 mức → khung hình 3D sáng/tối rõ rệt theo đúng mức, không đổi màu tường/sàn/nội thất (chỉ đổi độ phơi sáng).
- Tắt bóng đổ → bóng biến mất trên toàn scene; bật lại → bóng trở lại đúng như cũ.
- Đang chọn 1 món, nhấn Esc → bỏ chọn ngay (nhóm nút "món đang chọn" biến mất khỏi toolbar).
- Không hồi quy: Esc đóng dropdown/context menu/tour vẫn hoạt động độc lập, kéo-thả, Snap-to-Grid, Alignment Guides, Wireframe, tốc độ camera.
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome.

## Coordinator verification

- `npm run build` PASS (`✓ built in 2.50s`).
- Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS.
- Verify E2E qua Claude in Chrome trên job đã tạo trước đó:
  - **Nhập góc xoay**: chọn "Bàn trung tâm" → ô nhập hiện đúng "0". Gõ "200" → screenshot xác nhận món xoay đúng góc mới ngay, ô nhập hiện "200".
  - **Esc bỏ chọn**: dispatch `KeyboardEvent('keydown', {key:'Escape'})` trong lúc đang chọn món → xác nhận ô nhập góc xoay (và cả nhóm nút "món đang chọn") biến mất khỏi toolbar ngay — bỏ chọn đúng.
  - **Tắt bóng đổ**: bấm "🌑 Tắt bóng đổ" → screenshot xác nhận bóng mềm dưới nội thất biến mất hoàn toàn, sàn phẳng đều. Bấm lại "☀️ Bật bóng đổ" → bóng trở lại.
  - **Độ sáng**: tuần hoàn từ "Bình thường" → "Sáng" → screenshot xác nhận khung hình sáng hơn rõ rệt, màu tường/sàn/nội thất không đổi (chỉ đổi độ phơi sáng).
- Console sạch lỗi trong toàn bộ quá trình verify.
- Không phát hiện lỗi app mới, không hồi quy Esc đóng dropdown/context menu (vẫn hoạt động độc lập — nhiều `useEscapeKey` cùng tồn tại không xung đột), kéo-thả, Snap-to-Grid, Alignment Guides, Wireframe, tốc độ camera.
- Ghi nhận 1 giới hạn UX nhỏ (không chặn đóng task): ô nhập góc xoay dùng `value` được kiểm soát hoàn toàn bởi state — nếu user xoá trắng ô nhập hoàn toàn giữa chừng (không phải gõ đè lên vùng bôi đen), ô sẽ tạm hiện rỗng nhưng React ép về lại số cũ ngay do `setSelectedRotationInput` chủ động bỏ qua giá trị `NaN` (đúng thiết kế, tránh gán `NaN` làm vỡ mesh) — không phải lỗi, chỉ là 1 kiểu tương tác gõ số ít phổ biến hơn (đa số user gõ đè bằng cách bôi đen trước, không gặp tình huống này).

## Status

COMPLETED
