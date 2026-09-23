# TASK-167

## Title

Dọn whitespace khi dán vào trường văn bản + huy hiệu "Đã chỉnh" cho từng trường trong form tạo phòng

## Goal

Ý tưởng từ ChatGPT round 35 (2 ý gộp #3+#4, cùng đụng `RoomNew.jsx`), đã vét trước qua Explore agent:

- **Dọn whitespace khi dán**: xác nhận CHƯA CÓ `onPaste` handler nào trong TOÀN app (grep rộng `onPaste`, 0 kết quả) — đây sẽ là handler `onPaste` ĐẦU TIÊN của dự án. Các trường hiện chỉ có `onChange` gọi thẳng `update(field, e.target.value)`, không trim gì cả.
- **Huy hiệu "Đã chỉnh"**: xác nhận `buildDefaultForm(template)`/`defaultFormRef`/`isFormDefault(f, defaults)` (TASK-149) ĐÃ CÓ SẴN, hiện chỉ dùng cho nút "🧹 Xoá thiết lập" (so sánh TOÀN form). Có thể tái dùng THẲNG `defaultFormRef.current[field]` để so sánh TỪNG trường riêng — KHÔNG cần state/logic tracking mới. Đã xác nhận đây KHÔNG trùng với `useDraftAutosave`/banner khôi phục bản nháp (TASK-095/149) — 2 cơ chế hoàn toàn độc lập (autosave lưu snapshot TOÀN form vào localStorage theo debounce, không có khái niệm "giá trị mặc định"/so sánh từng trường).

## Scope

- `frontend/src/pages/RoomNew.jsx`:
  - Thêm `onPaste` handler cho 4 trường văn bản tự do (`style`, `preferredColors`, `desiredFurniture`, `freeTextRequest`) — khi dán, loại bỏ whitespace đầu/cuối (`.trim()`) TRƯỚC KHI lưu vào state qua `update(field, value)`. KHÔNG tự sửa nội dung ở giữa chuỗi, KHÔNG áp dụng cho việc gõ tay bình thường (chỉ áp dụng lúc PASTE).
  - Thêm huy hiệu nhỏ "Đã chỉnh" cạnh nhãn mỗi trường khi `form[field] !== defaultFormRef.current[field]` — so sánh TRỰC TIẾP với `defaultFormRef.current` đã có sẵn, KHÔNG thêm state/tracking mới. Áp dụng cho các trường hợp lý (text fields đã có ở TASK-158/164, cân nhắc cả `widthMeters`/`lengthMeters`/`budget` nếu so sánh hợp lý — agent tự quyết định phạm vi trường nào hiện huy hiệu dựa trên trường nào thực sự có "giá trị mặc định" rõ ràng trong `buildDefaultForm`).

## Out of scope

- KHÔNG phải autosave/draft-recovery — không đụng `useDraftAutosave`/`DraftIndicator`/banner khôi phục bản nháp.
- Không đổi `maxLength`/đếm ký tự (TASK-158), không đổi nút "×" xoá riêng trường (TASK-164), không đổi "🧹 Xoá thiết lập" (TASK-149).
- Không thêm validate JS mới.

## Dependencies

`RoomNew.jsx` (`update()`, `buildDefaultForm`/`defaultFormRef`/`isFormDefault` TASK-149).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Dán text có khoảng trắng đầu/cuối vào ô "Phong cách mong muốn" → nội dung lưu vào state ĐÃ được trim, không còn khoảng trắng thừa đầu/cuối.
- Gõ tay bình thường (không paste) → KHÔNG bị ảnh hưởng bởi thay đổi này.
- Sửa 1 trường khác giá trị mặc định → huy hiệu "Đã chỉnh" hiện đúng cạnh trường đó; trường vẫn giữ giá trị mặc định → không hiện huy hiệu.
- Không hồi quy: paste vào trường rồi bấm nút "×" (TASK-164) vẫn xoá đúng; đếm ký tự (TASK-158) vẫn đúng sau khi trim; submit form chính hoạt động bình thường; bản nháp tự lưu (TASK-095) không bị ảnh hưởng.
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`Projects.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-166.

## Coordinator verification

Dispatch cho 1 background agent, không đụng `Room3DViewer.jsx`/`Projects.jsx`. Agent viết `handlePasteTrim(field)` (handler `onPaste` ĐẦU TIÊN trong dự án) — `preventDefault()` paste gốc, đọc `clipboardData`, `.trim()`, chèn đúng vào vị trí con trỏ/vùng chọn hiện tại (không chỉ append cuối), tôn trọng `maxLength` thật của từng trường (TASK-158) vì bỏ qua đường paste gốc của trình duyệt đồng nghĩa phải tự clip lại thủ công. Huy hiệu "Đã chỉnh" dùng thẳng `defaultFormRef.current[field]` (TASK-149) so sánh — áp dụng cho 7 trường có khái niệm "giá trị mặc định" rõ ràng (`widthMeters`/`lengthMeters`/`style`/`preferredColors`/`desiredFurniture`/`budget`/`freeTextRequest`), bỏ qua `roomType` (đã có trạng thái active riêng) và ảnh upload (không có default).

`npm run build` PASS. Docker rebuild + Playwright TASK-098 regression: 3/3 PASS ngay lần đầu.

Verify E2E qua Claude in Chrome: dispatch `ClipboardEvent('paste', ...)` thật qua `DataTransfer` (mô phỏng đúng paste thật, không chỉ gõ) với text `"   Modern minimal   "` vào ô "Phong cách mong muốn" → giá trị lưu vào state đúng `"Modern minimal"` (đã trim, length 14). Huy hiệu "Đã chỉnh" hiện đúng CHỈ 1 cái, đúng trên trường vừa đổi, không hiện sai trên trường khác. Gõ tay bình thường (không paste, dùng native setter + `input` event) vào 1 trường khác với khoảng trắng đầu/cuối → GIỮ NGUYÊN không bị trim (xác nhận `onPaste` không ảnh hưởng `onChange`, đúng yêu cầu chỉ trim lúc paste). Console sạch lỗi.

## Status

COMPLETED
