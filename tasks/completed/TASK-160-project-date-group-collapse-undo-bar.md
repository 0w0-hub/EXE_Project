# TASK-160

## Title

Thu gọn/mở từng nhóm ngày trong Projects + thanh "Hoàn tác" sau khi xoá vào Thùng rác

## Goal

Ý tưởng từ ChatGPT round 33 (2 ý gộp #1+#2, cùng đụng `Projects.jsx`), đã vét trước qua Explore agent:

- **Thu gọn/mở nhóm ngày**: `groupByRelativeDate`/`displaySections` (TASK-157) hiện render tiêu đề nhóm (`<h3 className="project-group-header">`, cả grid lẫn list) THUẦN TĨNH — không có onClick/state/toggle nào. Xác nhận CHƯA CÓ 0%. Có pattern tái dùng được trực tiếp từ `Room3DViewer.jsx` (TASK-126, panel "Nội thất trong phòng"): `useState` lazy-init từ `localStorage` (mặc định mở/`true`), nút toggle glyph `▾`/`▸` + `aria-expanded`, thân bọc `display: none` khi đóng (giữ mounted, không unmount).
- **Thanh "Hoàn tác" sau xoá**: `handleSoftDelete(jobId, e)` gọi `designApi.softDelete(jobId)` rồi lọc khỏi `items`. API restore đã có sẵn (`designApi.restore(jobId)`, dùng lại y hệt `Trash.jsx`). CHƯA CÓ component toast/snackbar nào trong dự án — cần viết mới (nhẹ, không cần thư viện).

## Scope

- `frontend/src/pages/Projects.jsx`:
  - Thu gọn/mở TỪNG nhóm ngày độc lập: state riêng (vd `Set` các label đã đóng, KHÔNG suy ra từ `displaySections` vì nhóm này tính lại mỗi render) + `localStorage` để nhớ trạng thái đóng/mở qua các lần ghé trang (mặc định TẤT CẢ nhóm mở). Nút toggle trên mỗi tiêu đề nhóm (`▾`/`▸` + `aria-expanded`), thân nhóm bọc `display: none` khi đóng — dùng đúng pattern TASK-126 (`Room3DViewer.jsx`).
  - Sau khi `handleSoftDelete` xoá thành công 1 project: hiện thanh nhỏ "Đã chuyển vào Thùng rác — [Hoàn tác]" (component mới, nhẹ, style theo `.card`/design token có sẵn, không cần thư viện toast). Tự ẩn sau vài giây (vd 5s) HOẶC khi bấm "Hoàn tác". Bấm "Hoàn tác" → gọi `designApi.restore(jobId)` (API đã có, TASK-107) → tải lại danh sách đúng cách trang này đang dùng để lấy dữ liệu ban đầu (không tự dựng lại thứ tự/nhóm bằng tay — gọi lại đúng hàm fetch hiện có để đảm bảo dữ liệu thật, đồng nhất với các task trước).

## Out of scope

- Không đổi logic `groupByRelativeDate`/field ngày dùng để nhóm (TASK-157) — chỉ thêm lớp tương tác thu gọn/mở BÊN TRÊN nhóm đã có.
- Không đổi cơ chế Trash/Restore hiện có (TASK-107) — thanh Hoàn tác chỉ gọi lại API `restore` sẵn có, không tạo luồng xoá mới.
- Không cần animation phức tạp cho thanh Hoàn tác — hiện/ẩn đơn giản là đủ.

## Dependencies

`Projects.jsx` (`groupByRelativeDate`/`displaySections` TASK-157, `handleSoftDelete`), `designApi.restore` (`frontend/src/services/api.js`), pattern collapse từ `Room3DViewer.jsx` (TASK-126).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Bấm nút toggle trên tiêu đề 1 nhóm ngày → CHỈ nhóm đó đóng/mở, các nhóm khác không đổi. Reload trang → trạng thái đóng/mở của từng nhóm vẫn giữ nguyên (qua `localStorage`).
- Xoá 1 project vào Thùng rác → thanh "Đã chuyển vào Thùng rác — Hoàn tác" hiện ra → bấm "Hoàn tác" → project XUẤT HIỆN LẠI đúng trong danh sách (xác nhận qua reload trang thật, không chỉ optimistic UI).
- Không bấm "Hoàn tác" trong vài giây → thanh tự ẩn, project vẫn nằm trong Thùng rác (không tự khôi phục).
- Không hồi quy: nhóm ngày (TASK-157), ghim (TASK-122), "Mở nhanh" (TASK-147), menu "⋮" (TASK-147), điều hướng bàn phím (TASK-148/154), tìm kiếm/Esc (TASK-150/152).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`RoomNew.jsx`/`Dashboard.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-161/162.

## Coordinator verification

Dispatch cho 1 background agent, không đụng `Room3DViewer.jsx`/`RoomNew.jsx`/`Dashboard.jsx`. Agent áp dụng collapse cho MỌI nhóm trong `displaySections` (cả 4 nhóm ngày lẫn nhóm "📌 Đã ghim" nếu có, quyết định mở rộng hợp lý vì dùng chung 1 kiểu tiêu đề) — state `collapsedGroupLabels` (`Set` nhãn đóng, lazy-init từ `localStorage`, mặc định rỗng = tất cả mở), thân nhóm bọc `display: contents`/`display: none` (điều chỉnh so với pattern gốc TASK-126 vì `.room-grid` là CSS grid/`.room-list` là flex — cần giữ card là con trực tiếp của container). Thanh "Hoàn tác": `handleSoftDelete` gọi `showUndoDeleteToast(jobId)` SAU khi API `softDelete` thành công, "Hoàn tác" gọi `designApi.restore(jobId)` rồi `loadItems()` (fetch lại thật, không tự dựng state).

`npm run build` PASS. Docker rebuild + Playwright TASK-098 regression: 3/3 PASS (1 lần chạy đầu tiên fail do backend chưa kịp warm-up ngay sau rebuild — "Không thể kết nối tới server" — không liên quan tới thay đổi của task này vì không đụng Auth/Register; chạy lại ngay sau đó PASS, chạy full suite lần 2 xác nhận 3/3 PASS ổn định).

Verify E2E qua Claude in Chrome (tài khoản test):
- Toggle nhóm "Hôm nay" → `aria-expanded` đổi `true`→`false`, glyph `▾`→`▸`, các card trong nhóm ẩn đúng (chỉ nhóm đó, không ảnh hưởng nhóm khác). Reload trang thật → trạng thái đóng vẫn giữ nguyên (qua `localStorage`) → toggle lại mở ra đúng.
- Xoá 1 project (`Phòng khách`, dữ liệu test) vào Thùng rác qua menu "⋮" → thanh "Đã chuyển vào Thùng rác — Hoàn tác" xuất hiện đúng ngay sau khi API xoá thành công. Bấm "Hoàn tác" trong cửa sổ 5s → toast biến mất, project XUẤT HIỆN LẠI. Xác nhận qua RELOAD TRANG THẬT (không chỉ optimistic UI) — cả 2 project hiện đủ sau reload, chứng minh restore đã ghi nhận ở backend thật.
- Xác nhận toast tự ẩn sau ~5s nếu không bấm Hoàn tác (quan sát được trong lượt test đầu, phải rút ngắn thời gian round-trip giữa các lệnh JS để bắt kịp cửa sổ 5s khi test undo).
- Không hồi quy: nhóm ngày (TASK-157), ghim, "Mở nhanh" (TASK-147), menu "⋮" (TASK-147). Console sạch lỗi qua reload thật.

## Status

COMPLETED

## Implementation notes (background agent)

- `frontend/src/pages/Projects.jsx`:
  - Collapse áp dụng cho MỌI nhóm trong `displaySections` (cả 4 nhóm ngày lẫn nhóm "📌 Đã ghim" nếu có)
    vì cả 2 dùng chung 1 kiểu tiêu đề `<h3 className="project-group-header">` — quyết định mở rộng nhẹ
    so với câu chữ "nhóm ngày" trong Goal, không phá quy tắc nào ở Scope/Out of scope (không đổi logic
    `groupByRelativeDate`/pin, chỉ thêm lớp tương tác thu gọn/mở BÊN TRÊN). State: `collapsedGroupLabels`
    (Set các NHÃN đang đóng, lazy-init từ `localStorage` key `homely_projects_collapsed_groups`, mặc định
    Set rỗng = tất cả mở) + `toggleGroupCollapsed(label)`. Thân mỗi nhóm bọc trong `<div style={{ display:
    isGroupCollapsed ? 'none' : 'contents' }}>` (không phải `undefined` như Room3DViewer) — bắt buộc vì
    `.room-grid` là CSS grid/`.room-list` là flex, `display: contents` giữ card/row là con TRỰC TIẾP của
    container cha (không phá layout lưới/gap), còn `display: none` khi đóng ẩn cả wrapper lẫn card con,
    giữ mounted đúng pattern TASK-126.
  - Thanh "Hoàn tác": state `undoDeleteJobId` + `undoDeleteTimerRef`, hàm `showUndoDeleteToast`/
    `clearUndoDeleteTimer`/`handleUndoDelete`. `handleSoftDelete` gọi `showUndoDeleteToast(jobId)` trong
    `.then()` (sau khi API `softDelete` thành công, không phải optimistic trước đó). "Hoàn tác" gọi
    `designApi.restore(jobId)` rồi `loadItems()` (hàm fetch hiện có, TASK-113) — không tự dựng lại
    item/thứ tự bằng tay. Tự ẩn sau `UNDO_TOAST_TIMEOUT_MS = 5000`ms; dọn timer lúc unmount.
- `frontend/src/styles.css`: thêm `.undo-toast` (position: fixed góc dưới-phải, flex ngang, tái dùng
  `.card` cho nền/bo góc/shadow/dark-mode — không thêm màu mới).
- `npm run build` PASS (không có lỗi/warning mới ngoài cảnh báo chunk-size Room3DViewer đã có từ trước).
- KHÔNG đụng `Room3DViewer.jsx`/`RoomNew.jsx`/`Dashboard.jsx`.
