# TASK-158

## Title

Đếm ký tự hiện tại/giới hạn cho các trường văn bản trong form tạo phòng

## Goal

Ý tưởng từ ChatGPT round 32 (cùng batch TASK-157/159), đã vét trước qua Explore agent — phát hiện QUAN TRỌNG cần điều chỉnh phạm vi so với đề xuất gốc:

- Giới hạn ký tự THẬT SỰ tồn tại nhưng CHỈ ở tầng CỘT DATABASE (`@Column(length=...)` trong `RoomPreference.java`/`Room.java`), KHÔNG được enforce ở tầng API request (`SavePreferenceRequest.java`/`CreateRoomRequest.java` không có `@Size` nào) và KHÔNG có `maxLength` HTML nào ở frontend hiện tại — nghĩa là hiện tại user CÓ THỂ gõ vượt giới hạn cột DB mà không có cảnh báo nào, rủi ro lỗi ghi DB âm thầm (đã xác nhận đây là 1 khoảng trống thật, không phải chỉ để hiện đẹp UI).
- Giới hạn THẬT theo cột DB đã xác nhận: `preferredColors` 500, `style` 500 (field liên quan style trong `RoomPreference.java`), `desiredFurniture` 1000, `freeTextRequest` 2000, `roomType` 100 (ở `Room.java`, khác luồng — roomType chọn qua nút bấm định sẵn, không cần đếm ký tự).
- **Quyết định phạm vi**: thêm `maxLength` HTML ĐÚNG các số đã xác nhận cho `style`/`preferredColors`/`desiredFurniture`/`freeTextRequest` (chặn thật ở frontend, vừa fix khoảng trống rủi ro DB, vừa là điều kiện tiên quyết để hiện đếm ký tự có ý nghĩa) + hiện dòng nhỏ "X/500 ký tự" cạnh mỗi trường, cập nhật theo thời gian thực.

## Scope

- `frontend/src/pages/RoomNew.jsx`:
  - Thêm `maxLength={500}` cho input `style`, `maxLength={500}` cho `preferredColors`, `maxLength={1000}` cho `desiredFurniture`, `maxLength={2000}` cho `freeTextRequest` — ĐÚNG số đã xác nhận từ cột DB, không đoán số khác.
  - Cạnh mỗi trường (hoặc ngay dưới), thêm dòng nhỏ (`text-muted`, cỡ chữ nhỏ) "X/500 ký tự" đọc `form.style.length`/tương ứng, cập nhật ngay khi gõ (đã có `onChange` sẵn, không cần thêm state mới).
  - KHÔNG đụng `roomType`/`widthMeters`/`lengthMeters`/`budget` (không phải trường văn bản tự do có giới hạn ký tự cột DB liên quan).

## Out of scope

- KHÔNG thêm validate JS mới ngoài `maxLength` HTML gốc (trình duyệt tự chặn gõ vượt `maxLength`).
- KHÔNG đổi `SavePreferenceRequest.java`/backend (đây là task frontend-only, thêm `@Size` ở backend nếu cần là việc khác, không thuộc phạm vi task này).
- "Create Form Section Collapse" — để dành backlog, không làm chung round này vì `RoomNew.jsx` đã có nhiều thay đổi tích luỹ (TASK-149/153/155), rủi ro cao hơn nếu tái cấu trúc JSX lúc này.

## Dependencies

`RoomNew.jsx` (`form` state hiện có), giới hạn cột DB thật từ `RoomPreference.java`.

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Gõ vào ô "Phong cách mong muốn" → dòng đếm "X/500 ký tự" cập nhật đúng theo thời gian thực.
- Cố gõ vượt 500 ký tự vào ô đó → trình duyệt tự chặn không cho gõ thêm (do `maxLength`).
- Tương tự đúng cho `preferredColors` (500), `desiredFurniture` (1000), `freeTextRequest` (2000).
- Điền đủ form hợp lệ (trong giới hạn) → submit vẫn hoạt động đúng như cũ, không hồi quy luồng tạo phòng chính (TASK-153/155 đã có).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`Projects.jsx`/`Dashboard.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-157/159.

## Coordinator verification

Dispatch cho 1 background agent, không đụng `Room3DViewer.jsx`/`Projects.jsx`/`Dashboard.jsx`. Agent thêm `maxLength` ĐÚNG số đã xác nhận từ cột DB thật (`style` 500, `preferredColors` 500, `desiredFurniture` 1000, `freeTextRequest` 2000) + dòng đếm nhỏ "X/N ký tự" đọc `form.<field>.length`, cập nhật theo `onChange` sẵn có, không thêm state mới.

`npm run build` PASS. Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS.

Verify E2E qua Claude in Chrome (tài khoản test, trang `/rooms/new`):
- Ô "Phong cách mong muốn" (`style`): `maxLength` đọc đúng `500` qua DOM; gõ "Modern minimal" → dòng đếm hiện đúng "14/500 ký tự", cập nhật đúng theo thời gian thực từng ký tự gõ.
- Xác nhận `maxLength` đúng số trên cả 3 trường còn lại qua đọc thuộc tính DOM (`preferredColors` 500, `desiredFurniture` 1000, `freeTextRequest` 2000) — khớp đúng cột DB thật đã xác nhận lúc vét ý tưởng, không phải số đoán.
- Điền đủ form hợp lệ (trong giới hạn) → submit vẫn hoạt động đúng, không hồi quy luồng tạo phòng chính (TASK-153/155 vẫn PASS trong cùng lượt Playwright).
- Console sạch lỗi.

Ghi chú: task này đồng thời vá 1 khoảng trống rủi ro thật đã phát hiện lúc vét ý tưởng — trước đây không có `maxLength` HTML nào, user có thể gõ vượt giới hạn cột DB (`@Column(length=...)`) mà không cảnh báo, dù tầng API (`SavePreferenceRequest.java`) không enforce `@Size`. `maxLength` HTML chặn thật ở nguồn nhập, giảm rủi ro lỗi ghi DB âm thầm — dù chưa xử lý gốc rễ (thiếu `@Size` ở API DTO), việc đó nằm ngoài phạm vi task này (frontend-only, xem Out of scope).

## Status

COMPLETED
