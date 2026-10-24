# TASK-169

## Title

Đặt lại từng trường về giá trị mặc định thực tế (khác xoá trắng)

## Goal

Ý tưởng từ ChatGPT round cuối, đã vét trước qua Explore agent, xác nhận NEW/VALID và KHÔNG trùng lặp với nút "×" (TASK-164, xoá về CHUỖI RỖNG):

- `buildDefaultForm(template)` lấy default từ `template` cho `roomType`/`style`/`preferredColors`/`desiredFurniture`/`budget` — KHI user vào form qua "Áp dụng mẫu" (`Templates.jsx` → `navigate('/rooms/new', { state: { template } })`), các trường này có default THẬT KHÔNG RỖNG (vd style/màu/ngân sách gợi ý từ mẫu). Nếu user sửa lệch khỏi mẫu rồi muốn "quay lại đúng mẫu ban đầu" cho 1 trường cụ thể, nút "×" (TASK-164) sẽ xoá TRẮNG thay vì khôi phục về giá trị mẫu — đây là khoảng trống thật.
- Không vào form qua mẫu (default mọi trường là `''`) → "đặt lại về mặc định" và "xoá trắng" cho ra kết quả GIỐNG NHAU — chấp nhận trùng lặp hành vi ở trường hợp này (không phải lỗi thiết kế, chỉ là 2 nút cùng tồn tại nhưng chỉ hữu ích khác nhau tuỳ ngữ cảnh có/không có mẫu).

## Scope

- `frontend/src/pages/RoomNew.jsx`:
  - Thêm hành động nhỏ "↺ Về mặc định" cạnh huy hiệu "Đã chỉnh" (TASK-167, đã dùng `isFieldChanged(field)`/`defaultFormRef.current[field]`) — CHỈ hiện khi field đã đổi (`isFieldChanged(field)` true) VÀ `defaultFormRef.current[field]` KHÁC RỖNG (tránh nút thừa trùng hệt "×" khi default vốn đã rỗng — agent tự quyết định điều kiện hiện chính xác theo logic này). Bấm → gọi `update(field, defaultFormRef.current[field])`.

## Out of scope

- Không đổi nút "×" (TASK-164, vẫn xoá về rỗng) — 2 nút cùng tồn tại, phục vụ 2 mục đích khác nhau.
- Không đổi `buildDefaultForm`/`defaultFormRef`/`isFieldChanged` (TASK-149/167) — chỉ THÊM 1 hành động mới dùng lại logic đã có.
- Không đổi "🧹 Xoá thiết lập" (TASK-149, reset TOÀN form).

## Dependencies

`RoomNew.jsx` (`buildDefaultForm`/`defaultFormRef` TASK-149, `isFieldChanged`/huy hiệu "Đã chỉnh" TASK-167, `.field-with-clear`/"×" TASK-164).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Vào `/rooms/new` qua "Áp dụng mẫu" (`Templates.jsx`, có `style`/màu/ngân sách gợi ý sẵn) → sửa lệch 1 trường (vd đổi `style`) → huy hiệu "Đã chỉnh" + nút "↺ Về mặc định" xuất hiện → bấm → trường quay lại ĐÚNG giá trị mẫu ban đầu (không phải rỗng).
- Vào `/rooms/new` KHÔNG qua mẫu (default mọi trường rỗng) → sửa 1 trường → theo đúng điều kiện đã định, nút "↺ Về mặc định" KHÔNG xuất hiện thừa khi default vốn rỗng (chỉ còn nút "×" đã có, tránh 2 nút trùng chức năng).
- Không hồi quy: nút "×" (TASK-164), huy hiệu "Đã chỉnh" (TASK-167), đếm ký tự (TASK-158), "🧹 Xoá thiết lập" (TASK-149).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`Projects.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-168.

## Coordinator verification

Dispatch cho 1 background agent, không đụng `Room3DViewer.jsx`/`Projects.jsx`. Agent thêm `canResetToDefault(field)` = `isFieldChanged(field) && !!defaultFormRef.current[field]` — điều kiện đúng đảm bảo nút "↺ Về mặc định" CHỈ hiện khi có giá trị mặc định THẬT khác rỗng để khôi phục.

`npm run build` PASS. Docker rebuild + Playwright TASK-098 regression: 3/3 PASS (cùng lượt với TASK-168).

Verify E2E qua Claude in Chrome:
- Vào `/rooms/new` qua "Áp dụng mẫu" (Templates, mẫu "Japandi") → xác nhận `style` mặc định = "Japandi" (không rỗng). Sửa thành "Modern" → huy hiệu "Đã chỉnh" + nút "↺ Về mặc định" xuất hiện đúng (CHỈ 1 nút). Bấm nút → giá trị khôi phục ĐÚNG "Japandi" (giá trị mẫu thật, KHÔNG PHẢI rỗng) — khác hẳn nút "×" (TASK-164) vốn xoá về rỗng — badge biến mất đúng sau khi khớp lại default.
- Vào `/rooms/new` KHÔNG qua mẫu (default mọi trường rỗng) → sửa `style` → huy hiệu "Đã chỉnh" hiện nhưng nút "↺ Về mặc định" KHÔNG xuất hiện (tránh trùng chức năng với nút "×" đã có) — CHỈ nút "×" hiện, đúng thiết kế.
- Console sạch lỗi cả 2 trang.

## Status

COMPLETED
