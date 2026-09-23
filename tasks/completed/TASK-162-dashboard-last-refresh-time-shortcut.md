# TASK-162

## Title

Hiện thời điểm làm mới gần nhất + phím tắt Shift+R cho nút "Làm mới" Dashboard

## Goal

Ý tưởng từ ChatGPT round 33 (2 ý gộp #5+#6, cùng đụng `Dashboard.jsx`), đã vét trước qua Explore agent:

- **Thời điểm làm mới gần nhất**: `handleRefresh()`/`loadRooms()` (TASK-159) đã trả về đúng promise chain để biết lúc nào request kết thúc — CHƯA CÓ hiện thị "Cập nhật lúc HH:mm:ss" nào. Ghi lại thời điểm request THẬT SỰ thành công (không phải lúc bấm nút).
- **Phím tắt Shift+R**: Dashboard hiện KHÔNG có bất kỳ `keydown` listener nào. Xác nhận AN TOÀN — Shift+R không trùng phím tắt trình duyệt/OS (khác Ctrl/Cmd+R là reload trang), không trùng phím `r`/`R` nào khác trong app (chỉ có 1 chỗ dùng `R` là bên trong `Room3DViewer.jsx`, phạm vi khác hẳn route Dashboard). Có pattern gate chuẩn để tái dùng từ `Projects.jsx` (TASK-150) — kiểm tra `document.activeElement`/`isContentEditable` trước khi hành động, tránh chặn nhầm lúc đang gõ input khác (vd ô tìm kiếm Dashboard đã có).

## Scope

- `frontend/src/pages/Dashboard.jsx`:
  - Thêm state `lastRefreshedAt` (Date/timestamp), set trong `handleRefresh()` ngay khi `loadRooms()` resolve (dù thành công hay lỗi — vẫn tính là "đã làm mới xong", đúng tinh thần đã áp dụng cho label loading TASK-159). Hiện dòng nhỏ "Cập nhật lúc HH:mm:ss" cạnh nút "🔄 Làm mới" (chỉ hiện SAU lần refresh đầu tiên trong phiên, không hiện lúc mới vào trang).
  - Thêm `useEffect` gắn `keydown` listener kiểu dùng chung window/document (đúng pattern TASK-150), bắt `Shift+R`/`Shift+r`, guard không hành động khi đang focus input/textarea/select/contentEditable (kể cả ô tìm kiếm sẵn có trên Dashboard), gọi đúng `handleRefresh()` hiện có (không tạo hàm mới), có `guard !refreshing` để không chồng lấp request khi đang loading. Thêm `title="Làm mới (Shift+R)"` vào nút hiện có để gợi ý phím tắt.

## Out of scope

- Không đổi `loadRooms()`/`handleRefresh()` logic cốt lõi (TASK-159) — chỉ thêm ghi nhận timestamp + phím tắt gọi lại đúng hàm đã có.
- Không thêm phím tắt nào khác ngoài Shift+R.

## Dependencies

`Dashboard.jsx` (`handleRefresh`/`loadRooms`/`refreshing` state, TASK-159), pattern gate keydown từ `Projects.jsx` (TASK-150).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Bấm "🔄 Làm mới" → sau khi xong, dòng "Cập nhật lúc HH:mm:ss" hiện đúng giờ hệ thống tại thời điểm request thật sự hoàn tất (không phải lúc bấm).
- Bấm Shift+R khi Dashboard đang mở (không đang gõ ở input/textarea nào) → refresh y hệt như bấm nút, kể cả cập nhật đúng thời điểm.
- Focus vào ô tìm kiếm Dashboard rồi gõ chữ "R" hoa (giữ Shift để gõ hoa) → KHÔNG kích hoạt refresh, chữ "R" được gõ bình thường vào ô tìm kiếm.
- Đang trong lúc `refreshing=true` (loading), bấm Shift+R lần nữa → không gửi thêm request chồng lấn.
- Không hồi quy: nút "🔄 Làm mới" (TASK-159), "+ Tạo phòng mới"/"Mở Projects"/"Thùng rác" (TASK-145), lời chào theo trạng thái (TASK-156).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`Projects.jsx`/`RoomNew.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-160/161.

## Coordinator verification

Dispatch cho 1 background agent, không đụng `Room3DViewer.jsx`/`Projects.jsx`/`RoomNew.jsx`. Agent thêm `lastRefreshedAt` state + `formatTimeHms()` (tự viết, không phụ thuộc locale của `toLocaleTimeString`), set trong `.finally()` của `handleRefresh()` (cả thành công lẫn lỗi). Thêm `keydown` listener Shift+R đúng pattern gate của `Projects.jsx` (TASK-150) — kiểm tra `document.activeElement`/INPUT/TEXTAREA/SELECT/contentEditable trước khi hành động, guard `refreshing` tránh chồng lấp. Thêm `title="Làm mới (Shift+R)"`.

`npm run build` PASS. Docker rebuild + Playwright TASK-098 regression: 3/3 PASS (cùng lượt với TASK-160/161).

Verify E2E qua Claude in Chrome: dispatch `KeyboardEvent('keydown', {key:'R', shiftKey:true})` qua `document` (tránh Known Issue công cụ `computer` key action không đáng tin cậy) → refresh kích hoạt đúng, dòng "Cập nhật lúc HH:mm:ss" xuất hiện, giờ khớp đồng hồ hệ thống thật. Focus vào ô tìm kiếm Dashboard rồi dispatch Shift+R trên `document.activeElement` (INPUT) → xác nhận KHÔNG kích hoạt refresh (timestamp không đổi), đúng guard. Xác nhận `title="Làm mới (Shift+R)"` đã gắn đúng vào nút. Không hồi quy: nút "🔄 Làm mới" (TASK-159), cụm nút TASK-145, lời chào TASK-156. Console sạch lỗi qua reload thật.

## Status

COMPLETED
