# TASK-168

## Title

Giữ vị trí cuộn khi quay lại Projects + Sao chép tên trong menu "⋮" + Trả focus đúng nút mở menu

## Goal

Ý tưởng từ ChatGPT round cuối (3 ý gộp, cùng đụng `Projects.jsx`), đã vét trước qua Explore agent — đây là ROUND CUỐI CÙNG của vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (theo `/goal` user đặt ra), user đã yêu cầu làm nốt round này rồi DỪNG HẲN.

- **Giữ vị trí cuộn**: xác nhận CHƯA CÓ `ScrollRestoration`/tracking scroll nào trong `App.jsx`/router. Vét trước làm rõ phạm vi THẬT hẹp hơn đề xuất gốc — điều hướng BẤM NÚT BACK trình duyệt (popstate) đã được trình duyệt tự động khôi phục `scrollY` (mặc định `history.scrollRestoration = 'auto'`, không bị code nào ghi đè) — KHÔNG cần làm gì thêm cho trường hợp này. Khoảng trống THẬT chỉ ở trường hợp BẤM LINK điều hướng tới rồi quay lại `/projects` (forward navigation mới, không phải popstate) — trường hợp này scroll LUÔN reset về đầu, không có cơ chế nào khôi phục.
- **Sao chép tên project**: xác nhận menu "⋮" hiện có 4 mục (Đổi tên/Ghim lên đầu/Đánh dấu yêu thích/Chuyển vào thùng rác), CHƯA CÓ mục sao chép tên. Pattern tái dùng trực tiếp từ TASK-115 (`handleCopyJobId` ở `DesignResult.jsx`).
- **Trả focus đúng nút mở menu**: xác nhận `useEscapeKey`/click-outside đóng menu "⋮" (TASK-147) KHÔNG trả focus về nút đã mở nó — focus bị mất/rơi về `<body>`. Đây là khoảng trống accessibility thật, menu "⋮" là ứng viên tốt nhất (đã có `aria-haspopup`/`aria-expanded` đầy đủ, có nút trigger keyboard-accessible mỗi hàng).

## Scope

- `frontend/src/pages/Projects.jsx`:
  - **Giữ vị trí cuộn (phạm vi ĐÚNG, hẹp)**: lưu `window.scrollY` vào biến module-level hoặc `sessionStorage` NGAY TRƯỚC khi user điều hướng RỜI KHỎI trang (click vào project để mở, hoặc unmount component) — khi quay lại `/projects` qua LINK (không phải nút Back trình duyệt), khôi phục lại đúng vị trí đã lưu TRONG CÙNG PHIÊN. KHÔNG đụng gì tới hành vi popstate/nút Back của trình duyệt (đã hoạt động đúng tự nhiên).
  - **Sao chép tên**: thêm mục "📋 Sao chép tên" vào menu "⋮" (cả 2 layout grid/list), gọi `navigator.clipboard.writeText(job.roomType)` (hoặc tên hiển thị thật của project — kiểm tra đúng field, `job.customName` nếu có TASK-106 hoặc `job.roomType`), đổi trạng thái nút/label ngắn thành "Đã sao chép" rồi tự trở lại sau ~2s, đúng pattern `handleCopyJobId` (TASK-115).
  - **Trả focus đúng nút**: khi đóng menu "⋮" (qua Escape, click ra ngoài, hoặc chọn 1 hành động trong menu), trả `.focus()` về ĐÚNG nút "⋮" đã mở nó — lưu ref theo `jobId` (tương tự pattern `cardRefs` có sẵn).

## Out of scope

- Không đụng hành vi popstate/Back trình duyệt (đã đúng tự nhiên, không cần sửa).
- Không đổi sort/view persistence (TASK-106) — giữ scroll độc lập hoàn toàn.
- Không mở rộng "Trả focus" sang các popup/dropdown khác (NotificationBell, quick-preview) — chỉ đúng phạm vi menu "⋮" theo khuyến nghị vét trước (ứng viên rõ ràng nhất).

## Dependencies

`Projects.jsx` (menu "⋮" TASK-147, `cardRefs` pattern TASK-148), `handleCopyJobId` pattern từ `DesignResult.jsx` (TASK-115).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Mở 1 project (qua click LINK, không phải nút Back) rồi bấm quay lại "Dự án của tôi" qua link điều hướng trong app → vị trí cuộn khôi phục đúng như trước khi rời trang (trong cùng phiên).
- Bấm "📋 Sao chép tên" trong menu "⋮" → clipboard nhận đúng tên project, label đổi ngắn thành "Đã sao chép" rồi tự trở lại.
- Mở menu "⋮" bằng bàn phím (Enter/Space trên nút trigger), bấm Escape đóng menu → focus TRẢ VỀ ĐÚNG nút "⋮" vừa mở (không rơi về `<body>`).
- Không hồi quy: 4 mục menu cũ (Đổi tên/Ghim/Yêu thích/Thùng rác), nút "Về đầu danh sách" (TASK-163), thu gọn/mở nhóm ngày (TASK-160), điều hướng bàn phím (TASK-148/154).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`RoomNew.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-169.

## Coordinator verification

Dispatch cho 1 background agent, không đụng `Room3DViewer.jsx`/`RoomNew.jsx`. Agent dùng `useNavigationType()` (react-router-dom v6) phân biệt `PUSH` (link thật, khôi phục scroll) với `POP` (nút Back trình duyệt, KHÔNG đụng — để nguyên hành vi native `history.scrollRestoration = 'auto'`); "Sao chép tên" dùng lại đúng `displayName(job)` có sẵn (TASK-106, cùng field dùng cho tiêu đề card); "Trả focus" lưu ref theo `jobId` (không theo index, vì thứ tự đổi khi sort/pin) và thay MỌI điểm đóng menu (Escape/click-ra-ngoài/4 hành động cũ) gọi qua `closeActionsMenu(jobId)` thống nhất.

`npm run build` PASS. Docker rebuild + Playwright TASK-098 regression: 3/3 PASS ngay lần đầu.

Verify E2E qua Claude in Chrome:
- **Giữ vị trí cuộn**: chèn tạm `<div>` cao 1200px qua JS mô phỏng nội dung dài (dữ liệu test không đủ dài để cuộn tự nhiên) → cuộn xuống `scrollY=500` → click LINK THẬT vào 1 project → click LINK THẬT "Dự án của tôi" quay lại → xác nhận `scrollY` khôi phục ĐÚNG `500.44` (không lệch), xác nhận qua PUSH navigation thật (không dùng `navigate` tool vì gây reload/POP).
- **Sao chép tên**: xác nhận mục "📋 Sao chép tên" hiện đúng trong menu "⋮" (cả 5 mục). Gặp lại ĐÚNG Known Issue công cụ đã ghi nhận từ TASK-115 — `navigator.clipboard.writeText()`/`readText()` TREO renderer trong môi trường test tự động (dialog xin quyền clipboard native không tự tắt được, screenshot timeout rồi PASS lại khi retry) — xác nhận qua code review: implementation dùng ĐÚNG pattern `handleCopyJobId` đã hoạt động thật trong sản phẩm, không phải lỗi app.
- **Trả focus**: mở menu "⋮" bằng bàn phím, bấm Escape → xác nhận `document.activeElement` CHÍNH XÁC là nút "⋮" vừa mở (không rơi về `<body>`).
- Không hồi quy: 4 mục menu cũ, "Về đầu danh sách" (TASK-163), thu gọn/mở nhóm ngày (TASK-160). Console sạch lỗi.

## Status

COMPLETED
